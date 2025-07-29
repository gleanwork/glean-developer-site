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
                details_elements = outer_container.find_all('details', class_='openapi-markdown__details')
        else:
            details_elements = soup.find_all('details', class_='openapi-markdown__details')

        for details in details_elements:
            summary = details.find('summary')
            if summary and summary.get('id', '').count('-') == 1:
                print("HEREIMP", details)
                property_data = self._parse_property_from_details(details)
                if property_data:
                    schema.update(property_data)
        
        print("HERESCHEMA", schema)
        
        return schema
    
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
        
        # Get description
        description = ""
        # First try: direct sibling p tag (simpler structure)
        desc_elem = summary.find_next_sibling('p')
        if desc_elem:
            description = desc_elem.get_text(strip=True)
        else:
            # Second try: nested p tag within the collapsible content
            # Look for the content div after summary and find the first p tag
            content_div = summary.find_next_sibling('div')
            if content_div:
                nested_p = content_div.find('p')
                if nested_p:
                    description = nested_p.get_text(strip=True)
        
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
        
        # Get description from the p tag
        description = ""
        desc_elem = schema_item.find('p')
        if desc_elem:
            description = desc_elem.get_text(strip=True)
        
        # Handle enum values if present
        enum_values = []
        possible_values_elem = schema_item.find(string=re.compile(r'Possible values:'))
        if possible_values_elem:
            parent = possible_values_elem.parent
            if parent:
                values_text = parent.get_text()
                enum_match = re.search(r'\[(.*?)\]', values_text)
                if enum_match:
                    enum_str = enum_match.group(1)
                    enum_values = [v.strip().strip('`"\'') for v in enum_str.split(',')]
        
        result = {
            "type": field_type,
            "description": description,
            "required": is_required
        }
        
        if enum_values:
            result["enum"] = enum_values
        
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
            content_parts.append(str(api_data['request_schema']))
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
            content_parts.append(str(api_data['response_schema']))
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