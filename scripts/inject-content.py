#!/usr/bin/env python3
"""
Script to inject detailed API content into llms-full.txt file.
Scrapes all API pages from sitemap and captures hierarchical JSON structure.
"""

import re
import sys
import os
import json
import xml.etree.ElementTree as ET
from typing import List, Dict, Tuple, Optional
from urllib.parse import urlparse
import uuid
import concurrent.futures
import threading

import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright


class LLMContentInjector:
    def __init__(self, llms_file_path: str, base_url: str = "https://developers.glean.com"):
        self.llms_file_path = llms_file_path
        self.base_url = base_url
        
    def _get_all_sitemap_urls(self, sitemap_url: str) -> List[str]:
        """Get all URLs from the sitemap."""
        response = requests.get(sitemap_url)
        if response.status_code != 200:
            raise RuntimeError(f"Failed to fetch sitemap: {response.status_code}")
        
        root = ET.fromstring(response.content)
        urls = [elem.text for elem in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
        return urls
    
    def _is_api_reference_page(self, html: str) -> bool:
        """Check if a page is an API reference page."""
        soup = BeautifulSoup(html, 'html.parser')
        return bool(soup.find('pre', class_='openapi__method-endpoint'))
    
    def _extract_hierarchical_schema(self, soup: BeautifulSoup, section_type: str = "request") -> Dict:
        """Extract hierarchical JSON schema from the DOM structure."""
        schema = {}
        details_elements = []
                
        if section_type == "responses":
            outer_container = soup.find('div', class_='openapi-tabs__schema-container')
            if outer_container:
                tab_item = outer_container.find('div', class_='openapi-tabs__item')
                details_elements = outer_container.find_all('details', class_='openapi-markdown__details')
        else:
            h2_section = soup.find('h2', id=section_type)
            if h2_section:
                next_container = h2_section.find_next_sibling('div')
                if next_container:
                    details_elements = next_container.find_all('details', class_='openapi-markdown__details')
                else:
                    details_elements = []

        for details in details_elements:
            summary = details.find('summary')
            
            ul_container = details.find('ul')
            if ul_container:
                property_divs = ul_container.find_all('div', recursive=False)
                
                for prop_div in property_divs:
                    nested_details = prop_div.find('details', class_='openapi-markdown__details')
                    
                    if nested_details:
                        property_data = self._parse_property_from_details(nested_details)
                        if property_data:
                            schema.update(property_data)
                    else:
                        schema_item = prop_div.find('div', class_='openapi-schema__list-item')
                        if schema_item:
                            container = schema_item.find('span', class_='openapi-schema__container')
                            if container:
                                property_elem = container.find('strong', class_='openapi-schema__property')
                                if property_elem:
                                    property_name = property_elem.get_text(strip=True)
                                    simple_property = self._parse_simple_property_from_item(schema_item)
                                    if simple_property:
                                        schema[property_name] = simple_property
        
        return schema
    
    def _extract_description_with_tables(self, desc_elem) -> str:
        """Extract description text including formatted table data, possible values, and examples."""
        if not desc_elem:
            return ""
        
        description_parts = []
        
        text_content = desc_elem.get_text(strip=True)
        if text_content:
            description_parts.append(text_content)
        
        tables = desc_elem.find_all('table')
        parent = desc_elem.parent
        if not tables and parent:
            tables = parent.find_all('table')
        
        for table in tables:
            table_text = self._format_table_data(table)
            if table_text:
                description_parts.append(table_text)
        
        search_containers = []
        if parent:
            search_containers.append(parent)
            if parent.parent:
                search_containers.append(parent.parent)
        
        possible_values = []
        example = ""
        
        for container in search_containers:
            if not possible_values or not example:
                pv, ex = self._extract_enum_and_example(container)
                if not possible_values and pv:
                    possible_values = pv
                if not example and ex:
                    example = ex
        
        if possible_values:
            values_str = ', '.join([f"`{val}`" for val in possible_values])
            description_parts.append(f"Possible values: {values_str}")
        
        if example:
            description_parts.append(f"Example: `{example}`")
        
        return '\n\n'.join(description_parts)
    
    def _format_table_data(self, table) -> str:
        """Convert HTML table to readable text format."""
        if not table:
            return ""
        
        formatted_rows = []
        
        tbody = table.find('tbody')
        if tbody:
            for tr in tbody.find_all('tr'):
                cells = [td.get_text(strip=True) for td in tr.find_all(['td', 'th'])]
                if len(cells) >= 2:
                    enum_value = cells[0]
                    description = cells[1]
                    formatted_rows.append(f"{enum_value}: {description}")
        else:
            all_rows = table.find_all('tr')
            for tr in all_rows[1:]:
                cells = [td.get_text(strip=True) for td in tr.find_all(['td', 'th'])]
                if len(cells) >= 2:
                    enum_value = cells[0]
                    description = cells[1]
                    formatted_rows.append(f"{enum_value}: {description}")
        
        return '\n'.join(formatted_rows) if formatted_rows else ""

    def _extract_enum_and_example(self, content_div) -> tuple:
        """Extract possible values and examples from content div."""
        possible_values = []
        example = ""
        
        possible_values_elem = content_div.find(string=re.compile(r'Possible values:'))
        if not possible_values_elem:
            for elem in content_div.find_all(string=re.compile(r'Possible values:')):
                possible_values_elem = elem
                break
        
        if possible_values_elem:
            immediate_parent = possible_values_elem.parent
            container = immediate_parent
            if immediate_parent and immediate_parent.name in ['strong', 'b', 'em']:
                container = immediate_parent.parent
            
            if container:
                codes = container.find_all('code')
                if codes:
                    possible_values = [code.get_text(strip=True) for code in codes]
                else:
                    values_text = container.get_text()
                    enum_match = re.search(r'\[(.*?)\]', values_text)
                    if enum_match:
                        enum_str = enum_match.group(1)
                        possible_values = [v.strip().strip('`"\'') for v in enum_str.split(',')]
        
        example_elem = content_div.find(string=re.compile(r'Example:'))
        if not example_elem:
            for elem in content_div.find_all(string=re.compile(r'Example:')):
                example_elem = elem
                break
                
        if example_elem:
            parent = example_elem.parent
            if parent:
                code_elem = parent.find('code')
                if code_elem:
                    example = code_elem.get_text(strip=True)
                else:
                    next_sibling = parent.find_next_sibling()
                    if next_sibling:
                        code_elem = next_sibling.find('code')
                        if code_elem:
                            example = code_elem.get_text(strip=True)
        
        return possible_values, example

    def _parse_property_from_details(self, details) -> Dict:
        """Parse a property from an openapi-markdown__details element."""
        summary = details.find('summary')
        if not summary:
            return {}
        
        property_elem = summary.find(class_="openapi-schema__property")
        if not property_elem:
            return {}
        
        property_name = property_elem.get_text(strip=True)
        
        type_elem = summary.find(class_="openapi-schema__name")
        property_type = type_elem.get_text(strip=True) if type_elem else "object"
        
        required_elem = summary.find(class_="openapi-schema__required")
        is_required = bool(required_elem)
        
        description = ""
        
        desc_elem = summary.find_next_sibling('p')
        content_div = None
        
        if desc_elem:
            description = self._extract_description_with_tables(desc_elem)
            content_div = summary.find_next_sibling('div')
        else:
            content_div = summary.find_next_sibling('div')
            if content_div:
                nested_p = content_div.find('p')
                if nested_p:
                    description = self._extract_description_with_tables(nested_p)
                else:
                    description = self._extract_description_with_tables(content_div)
        
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
            child_divs = details.find_all('div', id=re.compile(f'^{re.escape(child_pattern)}'))
            
            for child_div in child_divs:
                parent_details = child_div.find_parent('details', class_='openapi-markdown__details')
                if parent_details and parent_details != details:
                    continue
                
                child_details = child_div.find('details', class_='openapi-markdown__details')
                if child_details:
                    nested_data = self._parse_property_from_details(child_details)
                    children.update(nested_data)
                else:
                    schema_item = child_div.find('div', class_='openapi-schema__list-item')
                    if schema_item:
                        container = schema_item.find('span', class_='openapi-schema__container')
                        if container:
                            property_elem = container.find('strong', class_='openapi-schema__property')
                            if property_elem:
                                child_name = property_elem.get_text(strip=True)
                                child_property = self._parse_simple_property_from_item(schema_item)
                                if child_property:
                                    children[child_name] = child_property
        
        property_data = {
            "type": property_type,
            "description": description,
            "required": is_required,
            "is_array": is_array
        }
        
        if children:
            property_data["properties"] = children
        
        return {property_name: property_data}
    
    def _parse_simple_property_from_item(self, schema_item) -> Dict:
        """Parse a simple property from openapi-schema__list-item."""
        container = schema_item.find('span', class_='openapi-schema__container')
        if not container:
            return {}
        
        property_elem = container.find('strong', class_='openapi-schema__property')
        if not property_elem:
            return {}
        
        type_elem = container.find('span', class_='openapi-schema__name')
        field_type = type_elem.get_text(strip=True) if type_elem else "unknown"
        
        required_elem = container.find('span', class_='openapi-schema__required')
        is_required = bool(required_elem)
        
        description = ""
        desc_elem = schema_item.find('p')
        if desc_elem:
            description = self._extract_description_with_tables(desc_elem)
        else:
            description = self._extract_description_with_tables(schema_item)
        
        result = {
            "type": field_type,
            "description": description,
            "required": is_required
        }
        
        return result
    
    def _extract_request_parameters(self, soup: BeautifulSoup, param_type: str) -> Dict:
        """Extract query or path parameters from the request section."""
        h2_section = soup.find('h2', id='request')
        if not h2_section:
            return {}
        
        header_text = f"{param_type.title()} Parameters"
        
        details_elements = []
        current_sibling = h2_section.find_next_sibling()
        while current_sibling:
            if current_sibling.name == 'details' and 'openapi-markdown__details' in current_sibling.get('class', []):
                details_elements.append(current_sibling)
            elif current_sibling.name == 'div' and 'tabs-container' in current_sibling.get('class', []):
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
                            param_items = ul_container.find_all('div', class_='openapi-params__list-item')
                            
                            for item in param_items:
                                container = item.find('span', class_='openapi-schema__container')
                                if container:
                                    prop_elem = container.find('strong', class_='openapi-schema__property')
                                    if not prop_elem:
                                        continue
                                    param_name = prop_elem.get_text(strip=True)
                                    
                                    type_elem = container.find('span', class_='openapi-schema__type')
                                    param_type_str = type_elem.get_text(strip=True) if type_elem else "string"
                                    
                                    required_elem = container.find('span', class_='openapi-schema__required')
                                    is_required = bool(required_elem)
                                    
                                    desc_elem = item.find('p')
                                    description = desc_elem.get_text(strip=True) if desc_elem else ""
                                    
                                    parameters[param_name] = {
                                        "type": param_type_str,
                                        "description": description,
                                        "required": is_required
                                    }
                        
                        return parameters
        
        return {}

    def _extract_mime_type(self, soup: BeautifulSoup, section: str = "request") -> str:
        """Extract MIME type from the API page."""
        h2 = soup.find("h2", id=section)
        if not h2:
            return ""
        container = h2.find_next("div", class_="openapi-tabs__mime-container")
        if not container:
            return ""
        li = container.select_one('ul.openapi-tabs__mime > li[aria-selected="true"]') \
             or container.select_one('ul.openapi-tabs__mime > li')
        return li.text.strip() if li else ""
    
    def _extract_code_samples(self, page) -> Dict[str, str]:
        """Extract code samples from the page using Playwright."""
        code_samples = {
            "python_code_sample": "",
            "go_code_sample": "",
            "java_code_sample": "",
            "typescript_code_sample": "",
            "curl_code_sample": ""
        }
        
        languages = {
            "python": "python_code_sample",
            "go": "go_code_sample", 
            "java": "java_code_sample",
            "javascript": "typescript_code_sample",
            "curl": "curl_code_sample"
        }
        
        for lang, key in languages.items():
            try:
                tab_selector = f'.openapi-tabs__code-item--{lang}'
                if page.locator(tab_selector).count() > 0:
                    page.click(tab_selector)
                    page.wait_for_timeout(500)
                    
                    code_lines = []
                    content_spans = page.locator('.openapi-explorer__code-block-code-line-content')
                    for i in range(content_spans.count()):
                        span_element = content_spans.nth(i)
                        if span_element.is_visible():
                            line_content = span_element.inner_text()
                            if line_content.strip():
                                code_lines.append(line_content)
                    if code_lines:
                        code_text = '\n'.join(code_lines)
                        code_samples[key] = code_text
            except Exception as e:
                continue
        
        return code_samples
    
    def _scrape_api_page_with_browser(self, url: str, page) -> Dict:
        """Scrape a single API page using provided Playwright page instance."""
        try:
            page.goto(url, wait_until="networkidle")
            page.wait_for_timeout(3000)
            
            html_content = page.content()
            soup = BeautifulSoup(html_content, 'html.parser')
            
            title = soup.find('h1').text.strip() if soup.find('h1') else ""
            
            auth_elem = soup.find('h4', class_='openapi-security__summary-header')
            authentication = auth_elem.text.strip() if auth_elem else ""
            
            request_schema = self._extract_hierarchical_schema(soup, "request")
            response_schema = self._extract_hierarchical_schema(soup, "responses")
            
            query_parameters = self._extract_request_parameters(soup, "query")
            path_parameters = self._extract_request_parameters(soup, "path")
            
            request_mime_type = self._extract_mime_type(soup, "request")
            response_mime_type = self._extract_mime_type(soup, "responses")
            
            code_samples = self._extract_code_samples(page)
            
            result = {
                "title": title,
                "url": url,
                "authentication": authentication,
                "request_schema": request_schema,
                "response_schema": response_schema,
                "query_parameters": query_parameters,
                "path_parameters": path_parameters,
                "request_mime_type": request_mime_type,
                "response_mime_type": response_mime_type,
                **code_samples
            }
            
            return result
            
        except Exception as e:
            raise RuntimeError(f"Error scraping {url}: {e}") from e
    
    def _scrape_api_pages_parallel(self, urls: List[str], max_workers: int = 5) -> List[Dict]:
        """Scrape multiple API pages in parallel using ThreadPoolExecutor."""
        results = [None] * len(urls)
        url_idx_tuples = list(enumerate(urls))
        
        def _scrape_with_browser(url_idx_tuple: Tuple[int, str]) -> Tuple[int, Dict]:
            idx, url = url_idx_tuple
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                try:
                    data = self._scrape_api_page_with_browser(url, page)
                    return (idx, data)
                finally:
                    browser.close()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            for idx, data in executor.map(_scrape_with_browser, url_idx_tuples):
                results[idx] = data
        
        return results
    
    def _format_enhanced_content(self, api_data: Dict) -> str:
        """Format the API data into clean markdown for injection."""
        content_parts = []
        
        if api_data.get('authentication'):
            content_parts.append("## Authentication")
            content_parts.append(api_data['authentication'])
            content_parts.append("")
        
        has_request_content = (api_data.get('request_schema') or 
                             api_data.get('query_parameters') or 
                             api_data.get('path_parameters'))
        
        if has_request_content:
            content_parts.append("## Request")
            content_parts.append("")
            
            if api_data.get('path_parameters'):
                content_parts.append("### Path Parameters")
                content_parts.append("")
                for param_name, param_info in api_data['path_parameters'].items():
                    required_text = " (required)" if param_info.get('required') else ""
                    content_parts.append(f"- **{param_name}** ({param_info['type']}){required_text}: {param_info['description']}")
                content_parts.append("")
            
            if api_data.get('query_parameters'):
                content_parts.append("### Query Parameters")
                content_parts.append("")
                for param_name, param_info in api_data['query_parameters'].items():
                    required_text = " (required)" if param_info.get('required') else ""
                    content_parts.append(f"- **{param_name}** ({param_info['type']}){required_text}: {param_info['description']}")
                content_parts.append("")
            
            if api_data.get('request_schema'):
                mime_type = api_data.get('request_mime_type', '')
                if mime_type:
                    content_parts.append(f"- **Content-Type:** {mime_type}")
                else:
                    content_parts.append("- **Content-Type:** application/json")
                
                content_parts.append("")
                content_parts.append("### Request Body")
                content_parts.append("")
                
                content_parts.append("```json")
                content_parts.append(json.dumps(api_data['request_schema'], indent=2))
                content_parts.append("```")
                content_parts.append("")
        
        if api_data.get('response_schema'):
            content_parts.append("## Response")
            
            response_mime_type = api_data.get('response_mime_type', '')
            if response_mime_type:
                content_parts.append(f"- **Content-Type:** {response_mime_type}")
            else:
                content_parts.append("- **Content-Type:** application/json")
            
            content_parts.append("")
            content_parts.append("### Response Body")
            content_parts.append("")
            
            content_parts.append("```json")
            content_parts.append(json.dumps(api_data['response_schema'], indent=2))
            content_parts.append("```")
            content_parts.append("")
        
        code_samples = {
            "Python": api_data.get('python_code_sample', ''),
            "Go": api_data.get('go_code_sample', ''),
            "Java": api_data.get('java_code_sample', ''),
            "TypeScript": api_data.get('typescript_code_sample', ''),
            "cURL": api_data.get('curl_code_sample', '')
        }
        
        has_code = any(code_samples.values())
        if has_code:
            content_parts.append("## Code Examples")
            content_parts.append("")
            
            for lang, code in code_samples.items():
                if code:
                    content_parts.append(f"### {lang}")
                    content_parts.append(f"```{lang.lower()}")
                    content_parts.append(code)
                    content_parts.append("```")
                    content_parts.append("")
        
        return '\n'.join(content_parts)
    
    def _find_api_sections_in_llms_file(self) -> List[Dict]:
        """Parse the llms-full.txt file to find API sections to enhance."""
        with open(self.llms_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        pattern = r'# ([^\n]+)\n\n```\n([A-Z]+) \n(/[^\n]+)\n```\n\n([^\n]+)'
        matches = re.finditer(pattern, content)
        
        api_sections = []
        for match in matches:
            title = match.group(1).strip()
            method = match.group(2).strip()
            endpoint = match.group(3).strip()
            description = match.group(4).strip()
            
            start_pos = match.start()
            next_header_match = re.search(r'\n# [^\n]+\n', content[match.end():])
            if next_header_match:
                end_pos = match.end() + next_header_match.start()
            else:
                end_pos = len(content)
            
            api_sections.append({
                'title': title,
                'method': method,
                'endpoint': endpoint,
                'description': description,
                'start_pos': start_pos,
                'end_pos': end_pos,
                'original_content': content[start_pos:end_pos]
            })
        
        return api_sections
    
    def run(self, limit: Optional[int] = None):
        """Main execution function."""
        all_urls = self._get_all_sitemap_urls(f"{self.base_url}/sitemap.xml")
        
        api_urls = []
        
        for url in all_urls:
            try:
                response = requests.get(url)
                if response.status_code == 200:
                    if self._is_api_reference_page(response.text):
                        api_urls.append(url)
            except Exception as e:
                continue
        
        if limit:
            api_urls = api_urls[:limit]
        
        api_sections = self._find_api_sections_in_llms_file()
        
        enhanced_apis = {}
        try:
            scraped_data = self._scrape_api_pages_parallel(api_urls, max_workers=5)
            
            for api_data in scraped_data:
                for section in api_sections:
                    if (section['title'].lower() in api_data['title'].lower() or
                        api_data['title'].lower() in section['title'].lower()):
                        enhanced_apis[section['title']] = api_data
                        break
                        
        except Exception as e:
            return
        
        with open(self.llms_file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        enhanced_content = original_content
        offset = 0
        
        for section in api_sections:
            if section['title'] in enhanced_apis:
                api_data = enhanced_apis[section['title']]
                enhanced_section = self._format_enhanced_content(api_data)
                
                section_content = section['original_content']
                
                responses_match = re.search(r'\n## Responses[^\n]*\n', section_content)
                if responses_match:
                    injection_point = section['start_pos'] + offset + responses_match.start()
                    enhanced_content = (enhanced_content[:injection_point] + 
                                      '\n' + enhanced_section + '\n' + 
                                      enhanced_content[injection_point:])
                    offset += len(enhanced_section) + 2
        
        output_file = self.llms_file_path.replace('.txt', '-enhanced.txt')
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(enhanced_content)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)
    
    llms_file = sys.argv[1]
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else None
    
    injector = LLMContentInjector(llms_file)
    injector.run(limit)

    print("Successfully injected dynamic content into llms-full.txt")
