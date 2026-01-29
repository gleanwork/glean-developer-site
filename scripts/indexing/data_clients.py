from typing import Union, List, Tuple, Optional
from pathlib import PurePosixPath
from urllib.parse import urlparse
import uuid
import json
import logging
import requests
import xml.etree.ElementTree as ET
import concurrent.futures

import trafilatura
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

from glean.indexing.connectors.base_data_client import BaseConnectorDataClient
from data_types import DocumentationPage, ApiReferencePage

logger = logging.getLogger(__name__)

class DeveloperDocsDataClient(BaseConnectorDataClient[Union[DocumentationPage, ApiReferencePage]]):
    
    def __init__(self, dev_docs_base_url: str):
        self.dev_docs_base_url = dev_docs_base_url

    def _get_all_sitemap_urls(self, sitemap_url: str) -> List[str]:
        response = requests.get(sitemap_url)
        if response.status_code != 200:
            raise RuntimeError(f"Failed to fetch sitemap: {response.status_code}")
        root = ET.fromstring(response.content)
        urls = [elem.text for elem in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
        return urls

    def _is_api_reference_page(self, html: str) -> bool:
        soup = BeautifulSoup(html, 'html.parser')
        return bool(soup.find('pre', class_='openapi__method-endpoint'))

    def get_documentation_page_data(self, urls: List[str]) -> List[DocumentationPage]:
        """Extract documentation pages using trafilatura for clean content extraction."""

        def title_from_url(url: str) -> str:
            path = PurePosixPath(urlparse(url).path)
            last_segment = path.name or ""
            return last_segment.replace('-', ' ').replace('_', ' ').title()

        def extract_page(url: str) -> Optional[DocumentationPage]:
            print(f"Scraping {url}...")
            response = requests.get(url, timeout=30)
            if response.status_code != 200:
                logger.warning(f"Failed to fetch {url} - HTTP {response.status_code}")
                return None

            html = response.text
            content = trafilatura.extract(
                html,
                include_tables=True,
                include_comments=False,
                include_images=False,
                output_format="txt"
            ) or ""

            if not content:
                logger.warning(f"No content extracted from {url}, skipping")
                return None

            soup = BeautifulSoup(html, 'lxml')
            h1 = soup.find('h1')
            title = h1.text.strip() if h1 else title_from_url(url)

            return DocumentationPage(
                id=str(uuid.uuid5(uuid.NAMESPACE_URL, url)),
                title=title,
                content=content,
                url=url,
                page_type="info_page"
            )

        results = []
        errors = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = {executor.submit(extract_page, url): url for url in urls}
            for future in concurrent.futures.as_completed(futures):
                url = futures[future]
                try:
                    page = future.result()
                    if page is not None:
                        results.append(page)
                except Exception as e:
                    logger.error(f"Error scraping {url}: {e}")
                    errors.append(url)

        if errors:
            logger.warning(f"Failed to scrape {len(errors)} pages: {errors}")

        results.sort(key=lambda p: p["url"])
        return results

    def get_api_reference_page_data(self, urls: List[str]) -> List[ApiReferencePage]:
        
        def _extract_mime_type(soup, section="request") -> str:
            h2 = soup.find("h2", id=section)
            if not h2:
                return ""
            container = h2.find_next("div", class_="openapi-tabs__mime-container")
            if not container:
                return ""
            li = container.select_one('ul.openapi-tabs__mime > li[aria-selected="true"]') \
                 or container.select_one('ul.openapi-tabs__mime > li')
            return li.text.strip() if li else ""

        def _extract_authentication_type(soup) -> str:
            details = soup.find('details', class_='openapi-security__details')
            if details:
                header = details.find('h4', class_='openapi-security__summary-header')
                if header:
                    return header.text.strip()
            return ""

        def _extract_api_reference(url: str, html: str) -> dict:
            soup = BeautifulSoup(html, 'html.parser')
            title = soup.find('h1').text.strip() if soup.find('h1') else ""

            # Extract tag from breadcrumbs first
            tag = "unknown"
            breadcrumb_items = soup.select('ul.breadcrumbs li span.breadcrumbs__link')
            if breadcrumb_items and len(breadcrumb_items) >= 2:
                tag = breadcrumb_items[1].text.strip().lower().replace(" ", "-")

            # Fallback: extract tag from URL path (e.g., /api/client-api/governance/... -> governance)
            if tag == "unknown":
                path = PurePosixPath(urlparse(url).path)
                # Pattern: /api/client-api/{tag}/... or /api/indexing-api/{tag}/...
                if len(path.parts) >= 4 and path.parts[1] == 'api':
                    tag = path.parts[3]
            method_block = soup.select_one("pre.openapi__method-endpoint")
            method = "unknown"
            endpoint = "unknown"
            if method_block:
                method_span = method_block.find('span', class_="badge")
                endpoint_h2 = method_block.find('h2', class_="openapi__method-endpoint-path")
                if method_span and endpoint_h2:
                    method = method_span.text.strip()
                    endpoint_full = endpoint_h2.text.strip()
                    # Extract just the path from the full URL (e.g., "https://api.glean.com/rest/..." -> "/rest/...")
                    parsed = urlparse(endpoint_full)
                    endpoint = parsed.path if parsed.scheme else endpoint_full
            
            beta_admonition = soup.find('div', class_='theme-admonition')
            beta_text = ""
            if beta_admonition:
                beta_p = beta_admonition.find('p')
                if beta_p:
                    beta_text = beta_p.get_text(strip=True)
            
            description = ""
            left_panel = soup.find(class_='openapi-left-panel__container')
            if left_panel:
                direct_p = left_panel.find('p', recursive=False)
                if direct_p:
                    description = direct_p.get_text(strip=True)
            
            if beta_text and description:
                description = f"{beta_text} {description}"

            response_codes = []
            tabs_container = soup.select_one('.openapi-tabs__container')
            if tabs_container:
                response_code_tabs = tabs_container.select('.openapi-tabs__response-code-item')

                margin_top_md = tabs_container.select_one('div.margin-top--md')
                top_level_panels = []
                
                if margin_top_md:
                    for child in margin_top_md.children:
                        if (hasattr(child, 'name') and child.name == 'div' and 
                            child.get('role') == 'tabpanel' and 
                            'tabItem_Ymn6' in child.get('class', [])):
                            top_level_panels.append(child)
                
                for i, code_tab in enumerate(response_code_tabs):
                    code = code_tab.text.strip()
                    desc = ""
                    if i < len(top_level_panels):
                        p_tag = top_level_panels[i].find('p')
                        if p_tag:
                            desc = p_tag.get_text(strip=True)
                    response_codes.append(f"{code}: {desc}" if desc else code)
            else:
                response_codes = [tab.text.strip() for tab in soup.select('.openapi-tabs__response-code-item')]
            
            req_mime = _extract_mime_type(soup, section="request")
            res_mime = _extract_mime_type(soup, section="responses")
            auth_type = _extract_authentication_type(soup)

            if method == "unknown" or tag == "unknown" or endpoint == "unknown":
                raise ValueError(f"Could not extract method, tag, or endpoint for {url}: method={method}, tag={tag}, endpoint={endpoint}")
            return {
                "id": str(uuid.uuid5(uuid.NAMESPACE_URL, url)),
                "title": title,
                "tag": tag,
                "endpoint": endpoint,
                "method": method,
                "description": description,
                "request_content_type": req_mime,
                "response_content_type": res_mime,
                "authentication": auth_type,
                "response_codes": response_codes,
                "url": url
            }

        def _extract_description_with_tables(element) -> str:
            """Extract description text including any tables."""
            if not element:
                return ""
            
            table = element.find('table')
            if table:
                table_parts = []
                tbody = table.find('tbody')
                if tbody:
                    rows = tbody.find_all('tr')
                    for row in rows:
                        cells = row.find_all('td')
                        if len(cells) >= 2:
                            key = cells[0].get_text(strip=True)
                            value = cells[1].get_text(strip=True)
                            table_parts.append(f"{key}: {value}")
                
                return ' '.join(table_parts)
            else:
                return element.get_text(' ', strip=True)

        def _parse_properties_from_divs(property_divs) -> dict:
            """Unified function to parse properties from a collection of divs."""
            properties = {}
            
            for prop_div in property_divs:
                nested_details = prop_div.find('details', class_='openapi-markdown__details')
                if nested_details:
                    property_data = _parse_property_from_details(nested_details)
                    properties.update(property_data)
                else:
                    schema_item = prop_div.find(class_='openapi-schema__list-item')
                    if schema_item:
                        container = schema_item.find(class_='openapi-schema__container')
                        if container:
                            property_elem = container.find('strong', class_='openapi-schema__property')
                            if property_elem:
                                property_name = property_elem.get_text(strip=True)
                                simple_property = _parse_simple_property_from_item(schema_item)
                                if simple_property:
                                    properties[property_name] = simple_property
            
            return properties

        def _parse_simple_property_from_item(schema_item) -> dict:
            """Parse a simple property from openapi-schema__list-item."""
            container = schema_item.find(class_='openapi-schema__container')
            if not container:
                return {}
            
            type_elem = container.find(class_='openapi-schema__name')
            field_type = type_elem.get_text(strip=True) if type_elem else 'unknown'
            
            required_elem = container.find(class_='openapi-schema__required')
            is_required = required_elem is not None
            
            description = ''
            desc_elem = schema_item.find('p', recursive=False)
            
            if desc_elem:
                description = _extract_description_with_tables(desc_elem)
            else:
                description_parts = []
                for sibling in container.next_siblings:
                    if hasattr(sibling, 'name') and sibling.name in ['p', 'div']:
                        part = _extract_description_with_tables(sibling)
                        if part:
                            description_parts.append(part)
                
                if description_parts:
                    description = ' '.join(description_parts)
            
            return {
                'type': field_type,
                'description': description,
                'required': is_required,
            }

        def _parse_property_from_details(details) -> dict:
            """Parse a property from an openapi-markdown__details element."""
            summary = details.find('summary')
            if not summary:
                return {}
            
            property_elem = summary.find(class_='openapi-schema__property')
            if not property_elem:
                return {}
            
            property_name = property_elem.get_text(strip=True)
            
            type_elem = summary.find(class_='openapi-schema__name')
            property_type = type_elem.get_text(strip=True) if type_elem else 'object'
            
            required_elem = summary.find(class_='openapi-schema__required')
            is_required = required_elem is not None
            
            description = ''
            content_div = summary.find_next_sibling('div')
            
            if content_div:
                collapsible_content = content_div.find(class_='collapsibleContent_i85q')
                if collapsible_content:
                    first_level_div = None
                    for div in collapsible_content.find_all('div', recursive=False):
                        style = div.get('style', '')
                        if 'margin-left: 1rem' in style:
                            first_level_div = div
                            break
                    
                    if first_level_div:
                        second_level_div = None
                        for div in first_level_div.find_all('div', recursive=False):
                            style = div.get('style', '')
                            if 'margin-top: 0.5rem' in style:
                                second_level_div = div
                                break
                        
                        if second_level_div:
                            for child in second_level_div.children:
                                if hasattr(child, 'name') and child.name == 'p':
                                    description = _extract_description_with_tables(child)
                                    break

                        oneof_badge = first_level_div.find('span', class_='badge badge--info', string='oneOf', recursive=False)
                        if not oneof_badge:
                            for child_div in first_level_div.find_all('div', recursive=False):
                                if not child_div.find('details'):
                                    oneof_badge = child_div.find('span', class_='badge badge--info', string='oneOf')
                                    if oneof_badge:
                                        break

                        if oneof_badge:                    
                            tabs_container = first_level_div.find('div', class_='openapi-tabs__schema-container')
                            if tabs_container:
                                oneof_options = []
                                
                                tab_panels = tabs_container.find_all('div', attrs={'role': 'tabpanel'})
                                for panel in tab_panels:
                                    panel_properties = {}
                                    
                                    panel_child_divs = []
                                    for child in panel.children:
                                        if hasattr(child, 'name') and child.name == 'div' and child.get('id'):
                                            panel_child_divs.append(child)
                                    
                                    if panel_child_divs:
                                        panel_properties = _parse_properties_from_divs(panel_child_divs)
                                    
                                    if panel_properties:
                                        oneof_options.append({
                                            'properties': panel_properties
                                        })
                                
                                enhanced_description = description
                                if enhanced_description:
                                    enhanced_description += f" Each object must be ONE OF: "
                                else:
                                    enhanced_description = "Each object must be ONE OF: "
                                
                                option_descriptions = []
                                for i, option in enumerate(oneof_options, 1):
                                    props = list(option['properties'].keys())
                                    props_with_types = []
                                    for prop_name in props:
                                        prop_data = option['properties'].get(prop_name, {})
                                        prop_type = prop_data.get('type', 'unknown')
                                        props_with_types.append(f"{prop_name} ({prop_type})")
                                    option_descriptions.append(f"({i}) {{ {', '.join(props_with_types)} }}")
                                
                                enhanced_description += ', '.join(option_descriptions) + ". Mixing fields is not allowed."
                                
                                property_data = {
                                    'type': property_type,
                                    'description': enhanced_description,
                                    'required': is_required,
                                    'oneOf': oneof_options
                                }
                                
                                return {property_name: property_data}
            
            children = {}
            summary_id = summary.get('id', '')
            if summary_id:
                child_pattern = f"{summary_id}-"
                child_divs = details.find_all('div', id=lambda x: x and x.startswith(child_pattern))
                
                filtered_divs = []
                for child_div in child_divs:
                    parent_details = child_div.find_parent('details', class_='openapi-markdown__details')
                    if parent_details == details:
                        filtered_divs.append(child_div)
                
                children = _parse_properties_from_divs(filtered_divs)
            
            property_data = {
                'type': property_type,
                'description': description,
                'required': is_required,
            }
            
            if len(children) > 0:
                property_data['properties'] = children
            
            return {property_name: property_data}

        def _extract_body_schema(soup, section) -> str:
            if section == "request":
                tabs_container = soup.select_one('.row.theme-api-markdown > .openapi-left-panel__container > .tabs-container')
                if not tabs_container:
                    return ""
                
                details_elements = tabs_container.select_one('details.openapi-markdown__details')
                if not details_elements:
                    return ""
            elif section == "response":
                tabs_container = soup.select_one('.row.theme-api-markdown > .openapi-left-panel__container > .openapi-tabs__container')
                if not tabs_container:
                    return ""
                
                schema_container = tabs_container.select_one('.openapi-tabs__schema-container')
                if not schema_container:
                    return ""
                
                details_elements = schema_container.select_one('details.openapi-markdown__details.response')
                if not details_elements:
                    return ""
            
            property_divs = []
            
            ul_container = details_elements.find('ul')
            if ul_container:
                div_children = ul_container.find_all('div', recursive=False)
                
                if div_children:
                    first_div = div_children[0]
                    
                    if first_div.get('id'):
                        property_divs = div_children
                    
                    elif first_div.get('class') and not first_div.get('id'):
                        schema_list_items = ul_container.find_all('div', class_='openapi-schema__list-item')
                        if schema_list_items:
                            property_divs = schema_list_items + [ul_container]
                        else:
                            property_divs = div_children
                    
                    elif first_div.find_all('div', recursive=False):
                        property_divs = first_div.find_all('div', recursive=False)
            
            schema = _parse_properties_from_divs(property_divs)
            return json.dumps(schema, indent=2)

        def _extract_request_parameters(soup, param_type) -> str:
            """Extract query or path parameters from the request section."""
            h2_section = soup.find('h2', id='request')
            if not h2_section:
                return ""
            
            header_text = f"{param_type.capitalize()} Parameters"
            
            details_elements = []
            current_sibling = h2_section.find_next_sibling()
            while current_sibling:
                if (current_sibling.name == 'details' and 
                    'openapi-markdown__details' in current_sibling.get('class', [])):
                    details_elements.append(current_sibling)
                elif (current_sibling.name == 'div' and 
                      'tabs-container' in current_sibling.get('class', [])):
                    break
                current_sibling = current_sibling.find_next_sibling()
            
            for details in details_elements:
                summary = details.find('summary')
                if summary:
                    h3 = summary.find('h3', class_='openapi-markdown__details-summary-header-params')
                    if h3:
                        h3_text = h3.get_text()
                        if header_text in h3_text:
                            parameters = {}
                            ul_container = details.find('ul')
                            if ul_container:
                                param_items = ul_container.find_all(class_='openapi-params__list-item')
                                
                                for item in param_items:
                                    container = item.find(class_='openapi-schema__container')
                                    if container:
                                        prop_elem = container.find('strong', class_='openapi-schema__property')
                                        if not prop_elem:
                                            continue
                                        param_name = prop_elem.get_text(strip=True)
                                        
                                        type_elem = container.find(class_='openapi-schema__type')
                                        param_type_str = type_elem.get_text(strip=True) if type_elem else 'string'
                                        
                                        required_elem = container.find(class_='openapi-schema__required')
                                        is_required = required_elem is not None
                                        
                                        desc_elem = item.find('p')
                                        description = desc_elem.get_text(strip=True) if desc_elem else ''
                                        
                                        parameters[param_name] = {
                                            'type': param_type_str,
                                            'description': description,
                                            'required': is_required,
                                        }
                            
                            if parameters:
                                return json.dumps(parameters, indent=2)
            
            return ""

        def _extract_code_samples(page) -> dict:
            languages = {
                'python': 'python_code_sample',
                'go': 'go_code_sample', 
                'java': 'java_code_sample',
                'javascript': 'typescript_code_sample',
                'curl': 'curl_code_sample',
            }
            
            code_samples = {key: '' for key in languages.values()}
            
            for lang, key in languages.items():
                try:
                    tab_selector = f'.openapi-tabs__code-item--{lang}'
                    tab_count = page.locator(tab_selector).count()
                    if tab_count > 0:
                        page.click(tab_selector)
                        page.wait_for_timeout(500)
                        
                        code_lines = []
                        content_spans = page.locator('.openapi-explorer__code-block-code-line-content')
                        span_count = content_spans.count()
                        
                        for i in range(span_count):
                            span_element = content_spans.nth(i)
                            is_visible = span_element.is_visible()
                            if is_visible:
                                line_content = span_element.inner_text()
                                if line_content.strip():
                                    code_lines.append(line_content)
                        
                        if len(code_lines) > 0:
                            code_text = '\n'.join(code_lines)
                            code_samples[key] = code_text
                except Exception as e:
                    continue
            return code_samples
        
        def _scrape_single_page_with_page(url: str, page) -> ApiReferencePage:
            try:
                page.goto(url, wait_until="networkidle")
            except Exception as e:
                raise RuntimeError(f"Failed to load {url}: {e}") from e

            page.wait_for_timeout(3000)
            html_content = page.content()
            soup = BeautifulSoup(html_content, 'html.parser')
            api_ref_data = _extract_api_reference(url, html_content)
            request_query_parameters = _extract_request_parameters(soup, "query")
            request_path_parameters = _extract_request_parameters(soup, "path")
            request_body = _extract_body_schema(soup, "request")
            response_body = _extract_body_schema(soup, "response")
            code_samples = _extract_code_samples(page)
            api_ref = ApiReferencePage(
                id=api_ref_data["id"],
                title=api_ref_data["title"],
                tag=api_ref_data["tag"],
                endpoint=api_ref_data["endpoint"],
                method=api_ref_data["method"],
                description=api_ref_data["description"],
                request_content_type=api_ref_data["request_content_type"],
                response_content_type=api_ref_data["response_content_type"],
                authentication=api_ref_data["authentication"],
                response_codes=api_ref_data["response_codes"],
                url=api_ref_data["url"],
                request_query_parameters=request_query_parameters,
                request_path_parameters=request_path_parameters,
                request_body=request_body,
                response_body=response_body,
                python_code_sample=code_samples["python_code_sample"],
                go_code_sample=code_samples["go_code_sample"],
                java_code_sample=code_samples["java_code_sample"],
                typescript_code_sample=code_samples["typescript_code_sample"],
                curl_code_sample=code_samples["curl_code_sample"],
                page_type="api_reference"
            )
            return api_ref
        
        def _scrape_dynamic_api_pages(urls: List[str], max_workers=10) -> List[ApiReferencePage]:
            results = [None] * len(urls)
            url_idx_tuples = list(enumerate(urls))
            
            def _scrape_with_browser(url_idx_tuple: Tuple[int, str]) -> Tuple[int, ApiReferencePage]:
                idx, url = url_idx_tuple
                with sync_playwright() as p:
                    browser = p.chromium.launch(headless=True)
                    page = browser.new_page()
                    try:
                        print(f"Scraping {url}...")
                        data = _scrape_single_page_with_page(url, page)
                        return (idx, data)
                    except Exception as e:
                        raise RuntimeError(f"Error scraping {url}: {e}") from e
                    finally:
                        browser.close()
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                for idx, data in executor.map(_scrape_with_browser, url_idx_tuples):
                    results[idx] = data
            return results
        
        res = _scrape_dynamic_api_pages(urls)
        print("API REFERENCE DATA: ", res)
        return res

    def get_source_data(self, since: str = None) -> List[Union[DocumentationPage, ApiReferencePage]]:
        all_urls = self._get_all_sitemap_urls(self.dev_docs_base_url + "/sitemap.xml")
        info_page_urls = []
        api_ref_urls = []
        
        print(f"Checking {len(all_urls)} URLs for API reference pages...")
        for url in all_urls:
            try:
                response = requests.get(url)
                if response.status_code != 200:
                    raise RuntimeError(f"Failed to fetch {url} - HTTP {response.status_code}")
                html = response.text
                if self._is_api_reference_page(html):
                    api_ref_urls.append(url)
                else:
                    info_page_urls.append(url)
            except Exception as e:
                raise RuntimeError(f"Error checking {url}: {e}") from e
        print(f"Found {len(api_ref_urls)} API reference pages and {len(info_page_urls)} info pages.")
        
        return self.get_documentation_page_data(info_page_urls) + self.get_api_reference_page_data(api_ref_urls)
