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

# Import required libraries
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
            print("HEREOUTER", outer_container)
            if outer_container:
                tab_item = outer_container.find('div', class_='openapi-tabs__item')
                details_elements = outer_container.find_all('details', class_='openapi-markdown__details')
        else:
            h2_section = soup.find('h2', id=section_type)
            if h2_section:
                # Navigate through the nested structure: h2 -> tabs-container -> ... -> details
                next_container = h2_section.find_next_sibling('div')
                if next_container:
                    details_elements = next_container.find_all('details', class_='openapi-markdown__details')
                else:
                    details_elements = []

        # Process the main details elements that contain the schema structure
        for details in details_elements:
            summary = details.find('summary')
            print("HREESUMMARY", summary)
            
            # Find the UL container that holds all the property divs
            ul_container = details.find('ul')
            if ul_container:
                # Get all direct child divs that represent properties
                property_divs = ul_container.find_all('div', recursive=False)
                
                for prop_div in property_divs:
                    # Check if this div contains a nested details element (complex object)
                    nested_details = prop_div.find('details', class_='openapi-markdown__details')
                    
                    if nested_details:
                        # This is a complex object with nested details
                        property_data = self._parse_property_from_details(nested_details)
                        if property_data:
                            schema.update(property_data)
                    else:
                        # This is a simple property div
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
        
        print("HERESCHEMA", schema)
        
        return schema
    
    def _extract_description_with_tables(self, desc_elem) -> str:
        """Extract description text including formatted table data, possible values, and examples."""
        if not desc_elem:
            return ""
        
        description_parts = []
        
        # Get regular text content
        text_content = desc_elem.get_text(strip=True)
        if text_content:
            description_parts.append(text_content)
        
        # Look for tables in the description element or its parent
        tables = desc_elem.find_all('table')
        parent = desc_elem.parent
        if not tables and parent:
            # Check parent element for tables
            tables = parent.find_all('table')
        
        # Process each table
        for table in tables:
            table_text = self._format_table_data(table)
            if table_text:
                description_parts.append(table_text)
        
        # Extract possible values and examples and add to description
        # Try multiple scopes to find possible values and examples
        search_containers = []
        if parent:
            search_containers.append(parent)
            # Also try grandparent in case the structure is nested differently
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
        
        # Process body rows - format as "VALUE: Description"
        tbody = table.find('tbody')
        if tbody:
            for tr in tbody.find_all('tr'):
                cells = [td.get_text(strip=True) for td in tr.find_all(['td', 'th'])]
                if len(cells) >= 2:  # Need at least enum value and description
                    enum_value = cells[0]
                    description = cells[1]
                    formatted_rows.append(f"{enum_value}: {description}")
        else:
            # Handle tables without explicit tbody - skip header row
            all_rows = table.find_all('tr')
            for tr in all_rows[1:]:  # Skip first row (header)
                cells = [td.get_text(strip=True) for td in tr.find_all(['td', 'th'])]
                if len(cells) >= 2:  # Need at least enum value and description
                    enum_value = cells[0]
                    description = cells[1]
                    formatted_rows.append(f"{enum_value}: {description}")
        
        return '\n'.join(formatted_rows) if formatted_rows else ""

    def _extract_enum_and_example(self, content_div) -> tuple:
        """Extract possible values and examples from content div."""
        possible_values = []
        example = ""
        
        # Extract possible values - search more broadly
        possible_values_elem = content_div.find(string=re.compile(r'Possible values:'))
        if not possible_values_elem:
            # Try searching in all descendants
            for elem in content_div.find_all(string=re.compile(r'Possible values:')):
                possible_values_elem = elem
                break
        
        if possible_values_elem:
            # Get the parent element (usually <strong> or similar)
            immediate_parent = possible_values_elem.parent
            # Find the containing paragraph or div that has the actual values
            container = immediate_parent
            if immediate_parent and immediate_parent.name in ['strong', 'b', 'em']:
                container = immediate_parent.parent
            
            if container:
                # Look for code elements within the container
                codes = container.find_all('code')
                if codes:
                    possible_values = [code.get_text(strip=True) for code in codes]
                else:
                    # Fallback: try to parse from text using regex
                    values_text = container.get_text()
                    enum_match = re.search(r'\[(.*?)\]', values_text)
                    if enum_match:
                        enum_str = enum_match.group(1)
                        possible_values = [v.strip().strip('`"\'') for v in enum_str.split(',')]
        
        # Extract example - search more broadly
        example_elem = content_div.find(string=re.compile(r'Example:'))
        if not example_elem:
            # Try searching in all descendants
            for elem in content_div.find_all(string=re.compile(r'Example:')):
                example_elem = elem
                break
                
        if example_elem:
            parent = example_elem.parent
            if parent:
                # Look for code element after "Example:"
                code_elem = parent.find('code')
                if code_elem:
                    example = code_elem.get_text(strip=True)
                else:
                    # Look for sibling elements that might contain the example
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
        
        # Extract property info from summary
        property_elem = summary.find(class_="openapi-schema__property")
        if not property_elem:
            return {}
        
        property_name = property_elem.get_text(strip=True)
        
        # Get type
        type_elem = summary.find(class_="openapi-schema__name")
        property_type = type_elem.get_text(strip=True) if type_elem else "object"
        
        # Check if required
        required_elem = summary.find(class_="openapi-schema__required")
        is_required = bool(required_elem)
        
        # Get description (including table data, possible values, and examples)
        description = ""
        
        # First try: direct sibling p tag (simpler structure)
        desc_elem = summary.find_next_sibling('p')
        content_div = None
        
        if desc_elem:
            description = self._extract_description_with_tables(desc_elem)
            content_div = summary.find_next_sibling('div')
        else:
            # Second try: nested p tag within the collapsible content
            # Look for the content div after summary and find the first p tag
            content_div = summary.find_next_sibling('div')
            if content_div:
                nested_p = content_div.find('p')
                if nested_p:
                    description = self._extract_description_with_tables(nested_p)
                else:
                    # Third try: look for tables directly in the content div
                    description = self._extract_description_with_tables(content_div)
        
        # Check if this is an array type by looking for "Array [" pattern
        is_array = False
        array_indicator = details.find('li')
        if array_indicator:
            array_div = array_indicator.find('div')
            if array_div and 'Array [' in array_div.get_text():
                is_array = True
        
        # Parse children from the div under summary
        children = {}
        summary_id = summary.get('id', '')
        if summary_id:
            # Look for child elements with IDs starting with the parent ID + "-"
            child_pattern = f"{summary_id}-"
            child_divs = details.find_all('div', id=re.compile(f'^{re.escape(child_pattern)}'))
            
            for child_div in child_divs:
                # Skip if this div is nested inside another details element (not a direct child)
                parent_details = child_div.find_parent('details', class_='openapi-markdown__details')
                if parent_details and parent_details != details:
                    continue  # This is nested inside another details, skip it
                
                # Check if this child is also a details element
                child_details = child_div.find('details', class_='openapi-markdown__details')
                if child_details:
                    # Recursively parse nested details
                    nested_data = self._parse_property_from_details(child_details)
                    children.update(nested_data)
                else:
                    # Parse as simple property
                    schema_item = child_div.find('div', class_='openapi-schema__list-item')
                    if schema_item:
                        # Get the property name from the schema item
                        container = schema_item.find('span', class_='openapi-schema__container')
                        if container:
                            property_elem = container.find('strong', class_='openapi-schema__property')
                            if property_elem:
                                child_name = property_elem.get_text(strip=True)
                                child_property = self._parse_simple_property_from_item(schema_item)
                                if child_property:
                                    children[child_name] = child_property
        
        # Build result
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
        # Find the container span
        container = schema_item.find('span', class_='openapi-schema__container')
        if not container:
            return {}
        
        # Get property name
        property_elem = container.find('strong', class_='openapi-schema__property')
        if not property_elem:
            return {}
        
        # Get type
        type_elem = container.find('span', class_='openapi-schema__name')
        field_type = type_elem.get_text(strip=True) if type_elem else "unknown"
        
        # Check if required
        required_elem = container.find('span', class_='openapi-schema__required')
        is_required = bool(required_elem)
        
        # Get description (including table data if present)
        description = ""
        desc_elem = schema_item.find('p')
        if desc_elem:
            description = self._extract_description_with_tables(desc_elem)
        else:
            # Look for tables directly in the schema item
            description = self._extract_description_with_tables(schema_item)
        
        result = {
            "type": field_type,
            "description": description,
            "required": is_required
        }
        
        return result
    
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
                    
                    # Extract code from visible containers only (skip the hidden default one)
                    code_lines = []
                    content_spans = page.locator('.openapi-explorer__code-block-code-line-content')
                    for i in range(content_spans.count()):
                        span_element = content_spans.nth(i)
                        # Only extract from visible elements (skips the hidden default container)
                        if span_element.is_visible():
                            line_content = span_element.inner_text()
                            if line_content.strip():
                                code_lines.append(line_content)
                    if code_lines:
                        code_text = '\n'.join(code_lines)
                        code_samples[key] = code_text
            except Exception as e:
                print(f"Error extracting {lang} code: {e}")
                continue
        
        return code_samples
    
    def _scrape_api_page(self, url: str) -> Dict:
        """Scrape a single API page and extract all relevant data."""
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            try:
                print(f"Scraping {url}...")
                page.goto(url, wait_until="networkidle")
                page.wait_for_timeout(3000)
                
                html_content = page.content()
                soup = BeautifulSoup(html_content, 'html.parser')
                
                # Extract basic API info
                title = soup.find('h1').text.strip() if soup.find('h1') else ""
                
                # Extract authentication
                auth_elem = soup.find('h4', class_='openapi-security__summary-header')
                authentication = auth_elem.text.strip() if auth_elem else ""
                
                # Extract request and response schemas
                request_schema = self._extract_hierarchical_schema(soup, "request")
                response_schema = self._extract_hierarchical_schema(soup, "responses")
                print("HEREREQUEST", request_schema)
                print("HERERESPONSE", response_schema)
                
                # Extract MIME types for both request and response
                request_mime_type = self._extract_mime_type(soup, "request")
                response_mime_type = self._extract_mime_type(soup, "responses")
                
                # Extract code samples
                code_samples = self._extract_code_samples(page)
                
                result = {
                    "title": title,
                    "url": url,
                    "authentication": authentication,
                    "request_schema": request_schema,
                    "response_schema": response_schema,
                    "request_mime_type": request_mime_type,
                    "response_mime_type": response_mime_type,
                    **code_samples
                }
                
                return result
                
            finally:
                browser.close()
    
    def _format_enhanced_content(self, api_data: Dict) -> str:
        """Format the API data into clean markdown for injection."""
        print("HEREAPI", api_data)
        content_parts = []
        
        # Authentication
        if api_data.get('authentication'):
            content_parts.append("## Authentication")
            content_parts.append(api_data['authentication'])
            content_parts.append("")
        
        # Request section
        if api_data.get('request_schema'):
            content_parts.append("## Request")
            
            # Use extracted MIME type or fallback to application/json
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
        
        # Response section
        if api_data.get('response_schema'):
            content_parts.append("## Response")
            
            # Use extracted response MIME type
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
        
        # Code examples
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
        
        # Find all API sections with pattern: # Title\n\n```\nMETHOD \n/endpoint\n```
        pattern = r'# ([^\n]+)\n\n```\n([A-Z]+) \n(/[^\n]+)\n```\n\n([^\n]+)'
        matches = re.finditer(pattern, content)
        
        api_sections = []
        for match in matches:
            title = match.group(1).strip()
            method = match.group(2).strip()
            endpoint = match.group(3).strip()
            description = match.group(4).strip()
            
            # Find the end of this section (next # header or end of file)
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
        print("Getting API URLs from sitemap...")
        
        # Get all URLs from sitemap
        all_urls = self._get_all_sitemap_urls(f"{self.base_url}/sitemap.xml")
        
        # Filter to API reference pages
        api_urls = []
        print(f"Checking {len(all_urls)} URLs for API reference pages...")
        
        for url in all_urls:
            try:
                response = requests.get(url)
                if response.status_code == 200:
                    if self._is_api_reference_page(response.text):
                        api_urls.append(url)
            except Exception as e:
                print(f"Error checking {url}: {e}")
                continue
        
        print(f"Found {len(api_urls)} API reference pages")
        
        if limit:
            api_urls = api_urls[:limit]
            print(f"Processing first {limit} APIs for testing")
        
        # Parse existing llms-full.txt file to find injection points
        api_sections = self._find_api_sections_in_llms_file()
        print(f"Found {len(api_sections)} API sections in llms-full.txt")
        
        # Scrape API pages and collect enhanced data
        enhanced_apis = {}
        for url in api_urls:
            try:
                api_data = self._scrape_api_page(url)
                print("HERE", api_data)
                
                # Match with sections in llms-full.txt by title or endpoint
                for section in api_sections:
                    if (section['title'].lower() in api_data['title'].lower() or
                        api_data['title'].lower() in section['title'].lower()):
                        enhanced_apis[section['title']] = api_data
                        break
                        
            except Exception as e:
                print(f"Error scraping {url}: {e}")
                continue
        
        print(f"Successfully scraped {len(enhanced_apis)} APIs")
        
        # Inject enhanced content into llms-full.txt
        with open(self.llms_file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        enhanced_content = original_content
        offset = 0
        
        for section in api_sections:
            if section['title'] in enhanced_apis:
                api_data = enhanced_apis[section['title']]
                enhanced_section = self._format_enhanced_content(api_data)
                
                # Find injection point (after description, before responses)
                section_content = section['original_content']
                
                # Look for the responses section
                responses_match = re.search(r'\n## Responses[^\n]*\n', section_content)
                if responses_match:
                    # Inject before responses
                    injection_point = section['start_pos'] + offset + responses_match.start()
                    enhanced_content = (enhanced_content[:injection_point] + 
                                      '\n' + enhanced_section + '\n' + 
                                      enhanced_content[injection_point:])
                    offset += len(enhanced_section) + 2
        
        # Write enhanced content
        output_file = self.llms_file_path.replace('.txt', '-enhanced.txt')
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(enhanced_content)
        
        print(f"Enhanced content written to {output_file}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python inject-content.py <llms-full.txt> [limit]")
        sys.exit(1)
    
    llms_file = sys.argv[1]
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else None
    
    injector = LLMContentInjector(llms_file)
    injector.run(limit) 