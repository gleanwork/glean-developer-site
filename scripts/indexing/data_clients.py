from typing import Union, List, Tuple
from glean.indexing.connectors.base_data_client import BaseConnectorDataClient
from data_types import DocumentationPage, ApiReferencePage
import json
import re
import requests
import xml.etree.ElementTree as ET
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup, Tag
import uuid
import concurrent.futures
import threading

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

        def _slugify(text: str) -> str:
            return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

        def _extract_section_from_breadcrumbs(soup) -> str:
            breadcrumbs = soup.select('ul.breadcrumbs li.breadcrumbs__item')
            if not breadcrumbs or len(breadcrumbs) < 2:
                return "unknown"
            for i, li in enumerate(breadcrumbs):
                if 'breadcrumbs__item--active' in li.get('class', []):
                    if i > 0:
                        prev = breadcrumbs[i-1]
                        span = prev.find('span', class_='breadcrumbs__link')
                        if span:
                            return span.text.strip()
                        return prev.get_text(strip=True)
            if len(breadcrumbs) >= 2:
                span = breadcrumbs[-2].find('span', class_='breadcrumbs__link')
                if span:
                    return span.text.strip()
                return breadcrumbs[-2].get_text(strip=True)
            return "unknown"

        def _extract_content_until_next_h2(start_elem) -> str:
            content_parts = []
            for sibling in start_elem.next_siblings:
                if isinstance(sibling, str):
                    continue
                if sibling.name == 'h2':
                    break
                
                if sibling.name == 'table':
                    table_text = _format_table_content(sibling)
                    if table_text:
                        content_parts.append(table_text)
                else:
                    text = sibling.get_text(separator=" ", strip=True)
                    if text:
                        content_parts.append(text)
            return "\n".join(content_parts)

        def _format_table_content(table) -> str:
            """Format table content in a clear, LLM-friendly way."""
            if not table:
                return ""
            
            print(f"DEBUG: Processing table with HTML: {table.prettify()}")
            
            headers = []
            thead = table.find('thead', recursive=False)
            print(f"DEBUG: Found thead: {thead}")
            if thead:
                header_row = thead.find('tr')
                print(f"DEBUG: Processing header row with HTML: {header_row.prettify()}")
                if header_row:
                    for th in header_row.find_all(['th', 'td']):
                        header_text = th.get_text(separator=" ").strip()
                        headers.append(header_text)
                        print(f"DEBUG: Found header: '{header_text}'")
            
            print(f"DEBUG: Final headers: {headers}")
            
            data_rows = []
            tbody = table.find('tbody')
            rows_container = tbody if tbody else table
            
            for row in rows_container.find_all('tr'):
                if not headers or row != table.find('tr'):
                    cells = row.find_all(['td', 'th'])
                    if cells:
                        row_data = []
                        for cell in cells:
                            cell_text = cell.get_text(separator=" ").strip()
                            row_data.append(cell_text)
                        if any(row_data):
                            data_rows.append(row_data)
                            print(f"DEBUG: Added row: {row_data}")
            
            print(f"DEBUG: Total data rows: {len(data_rows)}")
            
            if not data_rows:
                return ""
            
            formatted_parts = []
            
            if headers and len(headers) >= 2:
                formatted_parts.append(f"Table ({headers[0]} → {headers[1]}):")
                for row in data_rows:
                    if len(row) >= 2:
                        key = row[0]
                        value = row[1]
                        if len(row) > 2:
                            value = f"{value} ({', '.join(row[2:])})"
                        formatted_parts.append(f"• {key}: {value}")
            else:
                formatted_parts.append("Table data:")
                for i, row in enumerate(data_rows):
                    formatted_parts.append(f"• Row {i+1}: {' | '.join(row)}")
            
            result = "\n".join(formatted_parts)
            print(f"DEBUG: Final formatted table: {result}")
            return result

        def _extract_intro_content_after_header(soup) -> str:
            h1 = soup.find('h1')
            header = h1.find_parent() if h1 else None
            if not header:
                return ""

            content_parts = []
            for elem in header.next_elements:
                if isinstance(elem, Tag):
                    if elem.name == 'h2':
                        break   
                    if elem.name == 'table':
                        table_text = _format_table_content(elem)
                        if table_text:
                            content_parts.append(table_text)
                    if elem.name in ['p', 'ol', 'li']:
                        text = elem.get_text(separator="\n", strip=True)
                        if text:
                            content_parts.append(text)
                if elem is not header and getattr(elem, 'name', None) == 'header':
                    break
            return "\n".join(content_parts).strip()

        def _extract_page_info_with_fragments(url: str, html: str) -> List[DocumentationPage]:
            soup = BeautifulSoup(html, 'lxml')
            page_title = soup.find('h1').text.strip() if soup.find('h1') else ""
            section = _extract_section_from_breadcrumbs(soup)
            data = []
            h1 = soup.find('h1')
            h2_tags = soup.find_all('h2')
            h1_content = _extract_intro_content_after_header(soup)
            if h1:
                if h1_content:
                    page_info = DocumentationPage(
                        id=str(uuid.uuid5(uuid.NAMESPACE_URL, url)),
                        title=page_title,
                        section=section,
                        heading=page_title or section,
                        content=h1_content,
                        url=url,
                        page_type="info_page"
                    )
                    data.append(page_info)
            
            # Track seen (class, heading_text) pairs to avoid duplicates
            seen_headers = set()
            if h2_tags:
                for h2 in h2_tags:
                    heading_text = h2.text.strip()
                    parent_header = h2.find_parent('header')
                    header_class = tuple(parent_header.get('class', [])) if parent_header else ()
                    key = (header_class, heading_text)
                    if key in seen_headers:
                        continue
                    seen_headers.add(key)
                    fragment = _slugify(heading_text)
                    full_url = url + "#" + fragment
                    if "entryHeader_Mafo" in header_class:
                        content = _extract_content_until_next_h2(parent_header)
                    else:
                        content = _extract_content_until_next_h2(h2)
                    id_val = str(uuid.uuid5(uuid.NAMESPACE_URL, full_url))
                    page_info = DocumentationPage(
                        id=id_val,
                        title=page_title,
                        section=section,
                        heading=heading_text,
                        content=content,
                        url=full_url,
                        page_type="info_page"
                    )
                    data.append(page_info)
            return data

        def _scrape_dynamic_info_pages(urls: List[str], max_workers=10) -> List[DocumentationPage]:
            all_page_info = []
            lock = threading.Lock()
            url_idx_tuples = list(enumerate(urls))
            ordered_results = [None] * len(urls)
            
            def _fetch_and_extract_with_index(idx_url_tuple) -> Tuple[int, List[DocumentationPage]]:
                idx, url = idx_url_tuple
                page_info = _fetch_and_extract(url)
                return (idx, page_info)
            
            def _fetch_and_extract(url) -> List[DocumentationPage]:
                print(f"Scraping {url}...")
                try:
                    response = requests.get(url)
                    if response.status_code != 200:
                        raise RuntimeError(f"Failed to fetch {url} - HTTP {response.status_code}")
                    page_info = _extract_page_info_with_fragments(url, response.text)
                    return page_info
                except Exception as e:
                    raise RuntimeError(f"Error scraping {url}: {e}") from e
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                for idx, page_info in executor.map(_fetch_and_extract_with_index, url_idx_tuples):
                    ordered_results[idx] = page_info
            for page_info in ordered_results:
                all_page_info.extend(page_info)
            return all_page_info
        
        res = _scrape_dynamic_info_pages(urls)
        print("INFO PAGE DATA: ", res)
        return res

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
            tag = "unknown"
            breadcrumb_items = soup.select('ul.breadcrumbs li span.breadcrumbs__link')
            if breadcrumb_items and len(breadcrumb_items) >= 2:
                tag = breadcrumb_items[1].text.strip().lower().replace(" ", "-")
            method_block = soup.select_one("pre.openapi__method-endpoint")
            method = "unknown"
            endpoint = "unknown"
            if method_block:
                method_span = method_block.find('span', class_="badge")
                endpoint_h2 = method_block.find('h2', class_="openapi__method-endpoint-path")
                if method_span and endpoint_h2:
                    method = method_span.text.strip()
                    endpoint_full = endpoint_h2.text.strip()
                    endpoint = re.sub(r'https://.*?(/.*)', r'\1', endpoint_full)
            
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
            print(f"DEBUG: Found content div: {content_div}")
            
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
                                    print(f"Found descP: {child}")
                                    description = _extract_description_with_tables(child)
                                    break

                oneof_badge = first_level_div.find('span', class_='badge badge--info', string='oneOf', recursive=False)
                if not oneof_badge:
                    print(f"DEBUG: No oneOf badge found in first_level_div")
                    for child_div in first_level_div.find_all('div', recursive=False):
                        if not child_div.find('details'):
                            oneof_badge = child_div.find('span', class_='badge badge--info', string='oneOf')
                            if oneof_badge:
                                print(f"DEBUG: Found oneOf badge in child_div: {child_div}")
                                break

                if oneof_badge:
                    print(f"DEBUG: Found oneOf constraint for {property_name}")
                    
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
                                print(f"DEBUG: Found {len(panel_child_divs)} child divs with IDs in oneOf panel")
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
                        
                        is_array = False
                        array_indicator = details.find('li')
                        if array_indicator:
                            array_div = array_indicator.find('div')
                            if array_div and 'Array [' in array_div.get_text():
                                is_array = True
                        
                        property_data = {
                            'type': property_type,
                            'description': enhanced_description,
                            'required': is_required,
                            'is_array': is_array,
                            'oneOf': oneof_options
                        }
                        
                        return {property_name: property_data}

            is_array = False
            array_indicator = details.find('li')
            if array_indicator:
                array_div = array_indicator.find('div')
                if array_div and 'Array [' in array_div.get_text():
                    is_array = True
            
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
                'is_array': is_array,
            }
            
            if len(children) > 0:
                property_data['properties'] = children
                
                field_summaries = []
                for child_name, child_data in children.items():
                    child_type = child_data.get('type', 'unknown')
                    field_summaries.append(f"{child_name} ({child_type})")
                
                if field_summaries:
                    summary_text = f" Fields: {', '.join(field_summaries)}."
                    if description:
                        property_data['description'] = description + summary_text
                    else:
                        property_data['description'] = f"Object with fields: {', '.join(field_summaries)}."
            
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
            
            print(f"DEBUG: Found {section} details element: {details_elements}")
            property_divs = []
            
            ul_container = details_elements.find('ul')
            if ul_container:
                div_children = ul_container.find_all('div', recursive=False)
                
                if div_children:
                    first_div = div_children[0]
                    
                    if first_div.get('id'):
                        property_divs = div_children
                        print('here1 - no wrapper div with id')
                    
                    elif first_div.get('class') and not first_div.get('id'):
                        schema_list_items = ul_container.find_all('div', class_='openapi-schema__list-item')
                        if schema_list_items:
                            property_divs = schema_list_items + [ul_container]
                        else:
                            property_divs = div_children
                        print('here2 - no wrapper div, no id tailored names')
                    
                    elif first_div.find_all('div', recursive=False):
                        property_divs = first_div.find_all('div', recursive=False)
                        print('here3 - one big wrapper div')
            
            print(f"DEBUG: Found {len(property_divs)} property divs")
            if property_divs:
                print(f'First propertyDiv HTML: {property_divs[0]}')
            
            schema = _parse_properties_from_divs(property_divs)
            
            if schema:
                property_names = list(schema.keys())
                if len(property_names) >= 1:
                    search_tip = {
                        "description": f"Tip: This schema may have nested structures. Search for property names (e.g. '{property_names[0]}', '{property_names[1] if len(property_names) > 1 else property_names[0]}', etc) or use headings in descriptions for navigation.",
                        "type": "info"
                    }
                    schema = {"_search_tip": search_tip, **schema}
                
                return json.dumps(schema, indent=2)
            else:
                return ""

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
                            print(f"{url} {lang} CODE SAMPLE: ", code_text)
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
            print(f"{url} REQUEST QUERY PARAMETERS: ", request_query_parameters)
            request_path_parameters = _extract_request_parameters(soup, "path")
            print(f"{url} REQUEST PATH PARAMETERS: ", request_path_parameters)         
            request_body = _extract_body_schema(soup, "request")
            print(f"{url} REQUEST BODY: ", request_body)
            response_body = _extract_body_schema(soup, "response")
            print(f"{url} RESPONSE BODY: ", response_body)
            code_samples = _extract_code_samples(page)
            print(f"{url} CODE SAMPLES: ", code_samples)
            print(f"{url} ID: ", api_ref_data["id"])
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
            lock = threading.Lock()
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
