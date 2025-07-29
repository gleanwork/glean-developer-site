#!/usr/bin/env python3
"""
Script to generate llms.txt file from Glean Developer documentation site.
This script scrapes the documentation and formats it for LLM consumption.
Includes playwright scraping for API reference pages with code samples.
"""

import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup, Tag, NavigableString
import re
from typing import List, Dict, Optional, Tuple
from urllib.parse import urljoin, urlparse
import sys
import time
import concurrent.futures
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

class LLMTextGenerator:
    
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.processed_urls = set()
        self.output_lines = []
        self.lock = threading.Lock()
        
    def _get_sitemap_urls(self) -> List[str]:
        """Get all URLs from the sitemap."""
        sitemap_url = f"{self.base_url}/sitemap.xml"
        print(f"Fetching sitemap from: {sitemap_url}")
        
        response = requests.get(sitemap_url)
        if response.status_code != 200:
            raise RuntimeError(f"Failed to fetch sitemap: {response.status_code}")
            
        root = ET.fromstring(response.content)
        urls = [elem.text for elem in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
        
        # Filter out non-documentation URLs
        doc_urls = []
        for url in urls:
            parsed = urlparse(url)
            path = parsed.path
            if (path.startswith('/docs/') or 
                path.startswith('/api/') or 
                path.startswith('/guides/') or
                path.startswith('/libraries/') or
                path.startswith('/get-started/') or
                path.startswith('/api-info/') or
                path.startswith('/changelog') or
                path == '/' or
                path == '/index.md'):
                doc_urls.append(url)
                
        print(f"Found {len(doc_urls)} documentation URLs")
        return doc_urls
    
    def _is_api_reference_page(self, html: str) -> bool:
        """Check if a page is an API reference page by looking for OpenAPI elements."""
        soup = BeautifulSoup(html, 'html.parser')
        return bool(soup.find('pre', class_='openapi__method-endpoint'))
    
    def _extract_breadcrumb_path(self, soup: BeautifulSoup) -> List[str]:
        """Extract breadcrumb navigation to understand page hierarchy."""
        breadcrumbs = []
        breadcrumb_items = soup.select('ul.breadcrumbs li.breadcrumbs__item')
        
        for item in breadcrumb_items:
            if 'breadcrumbs__item--active' in item.get('class', []):
                continue
            span = item.find('span', class_='breadcrumbs__link')
            if span:
                breadcrumbs.append(span.get_text(strip=True))
            else:
                text = item.get_text(strip=True)
                if text:
                    breadcrumbs.append(text)
                    
        return breadcrumbs
    
    def _format_table(self, table: Tag) -> str:
        """Convert HTML table to markdown format."""
        rows = []
        
        # Process table headers
        thead = table.find('thead')
        if thead:
            header_row = thead.find('tr')
            if header_row:
                headers = []
                for th in header_row.find_all(['th', 'td']):
                    headers.append(th.get_text(strip=True))
                if headers:
                    rows.append('| ' + ' | '.join(headers) + ' |')
                    rows.append('| ' + ' | '.join(['---'] * len(headers)) + ' |')
        
        # Process table body
        tbody = table.find('tbody') or table
        for tr in tbody.find_all('tr'):
            cells = []
            for td in tr.find_all(['td', 'th']):
                cell_text = td.get_text(' ', strip=True)
                # Escape pipes in cell content
                cell_text = cell_text.replace('|', '\\|')
                cells.append(cell_text)
            if cells:
                rows.append('| ' + ' | '.join(cells) + ' |')
        
        return '\n'.join(rows)
    
    def _process_element(self, element: Tag, depth: int = 0) -> str:
        """Process HTML elements and convert to markdown-like format."""
        if isinstance(element, NavigableString):
            return str(element).strip()
        
        if not isinstance(element, Tag):
            return ""
        
        tag_name = element.name.lower()
        
        # Handle different HTML elements
        if tag_name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            level = int(tag_name[1])
            prefix = '#' * level
            text = element.get_text(strip=True)
            return f"\n{prefix} {text}\n"
        
        elif tag_name == 'p':
            text = element.get_text(' ', strip=True)
            return f"\n{text}\n" if text else ""
        
        elif tag_name in ['ul', 'ol']:
            items = []
            for li in element.find_all('li', recursive=False):
                item_text = self._process_element(li)
                if tag_name == 'ul':
                    items.append(f"* {item_text.strip()}")
                else:
                    items.append(f"1. {item_text.strip()}")
            return '\n' + '\n'.join(items) + '\n' if items else ""
        
        elif tag_name == 'li':
            # Process list item content
            content = []
            for child in element.children:
                if isinstance(child, (Tag, NavigableString)):
                    processed = self._process_element(child, depth + 1)
                    if processed.strip():
                        content.append(processed.strip())
            return ' '.join(content)
        
        elif tag_name == 'table':
            return '\n' + self._format_table(element) + '\n'
        
        elif tag_name == 'pre':
            # Check if this is an API endpoint block
            if 'openapi__method-endpoint' in element.get('class', []):
                return self._format_api_endpoint(element)
            else:
                code_text = element.get_text()
                # Try to detect language for syntax highlighting
                language = ""
                if element.find('code'):
                    code_elem = element.find('code')
                    classes = code_elem.get('class', [])
                    for cls in classes:
                        if cls.startswith('language-'):
                            language = cls.replace('language-', '')
                            break
                return f"\n```{language}\n{code_text}\n```\n"
        
        elif tag_name == 'code' and element.parent.name != 'pre':
            return f"`{element.get_text()}`"
        
        elif tag_name == 'blockquote':
            lines = element.get_text('\n', strip=True).split('\n')
            quoted_lines = [f"> {line}" for line in lines if line.strip()]
            return '\n' + '\n'.join(quoted_lines) + '\n'
        
        elif tag_name in ['strong', 'b']:
            return f"**{element.get_text()}**"
        
        elif tag_name in ['em', 'i']:
            return f"*{element.get_text()}*"
        
        elif tag_name == 'a':
            text = element.get_text(strip=True)
            href = element.get('href', '')
            if href and text:
                return f"[{text}]({href})"
            return text
        
        elif tag_name == 'details':
            # Handle collapsible sections
            summary = element.find('summary')
            summary_text = summary.get_text(strip=True) if summary else "Details"
            content = []
            for child in element.children:
                if child != summary and isinstance(child, (Tag, NavigableString)):
                    processed = self._process_element(child, depth + 1)
                    if processed.strip():
                        content.append(processed)
            if content:
                return f"\n**{summary_text}**\n\n{''.join(content)}\n"
            return f"\n**{summary_text}**\n"
        
        elif tag_name in ['div', 'section', 'article', 'main', 'span']:
            # Check for special classes that might need special handling
            classes = element.get('class', [])
            
            # Handle warning/info/note boxes
            if any(cls in ['warning', 'note', 'info', 'tip', 'danger'] for cls in classes):
                text = element.get_text(' ', strip=True)
                return f"\n> **Note:** {text}\n"
            
            # Process children
            content = []
            for child in element.children:
                if isinstance(child, (Tag, NavigableString)):
                    processed = self._process_element(child, depth + 1)
                    if processed.strip():
                        content.append(processed)
            return ''.join(content)
        
        else:
            # For other elements, just get the text content
            text = element.get_text(' ', strip=True)
            return text if text else ""
    
    def _format_api_endpoint(self, element: Tag) -> str:
        """Format API endpoint information."""
        content = []
        
        # Extract method and endpoint
        method_elem = element.find('span', class_='badge')
        endpoint_elem = element.find('h2', class_='openapi__method-endpoint-path')
        
        if method_elem and endpoint_elem:
            method = method_elem.get_text(strip=True)
            endpoint = endpoint_elem.get_text(strip=True)
            content.append(f"\n**{method.upper()}** `{endpoint}`\n")
        
        return ''.join(content)
    
    def _extract_main_content(self, soup: BeautifulSoup) -> str:
        """Extract the main content from the page."""
        content_parts = []
        
        # Find the main content area
        main_content = (
            soup.find('main') or 
            soup.find('article') or 
            soup.find(class_=re.compile(r'.*content.*', re.I)) or
            soup.find('div', class_='markdown')
        )
        
        if not main_content:
            # Fallback: find content after removing nav, header, footer
            for tag in soup.find_all(['nav', 'header', 'footer']):
                tag.decompose()
            main_content = soup.find('body') or soup
        
        # Process the content
        for element in main_content.children:
            if isinstance(element, (Tag, NavigableString)):
                processed = self._process_element(element)
                if processed.strip():
                    content_parts.append(processed)
        
        content = ''.join(content_parts)
        
        # Clean up excessive whitespace
        content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
        content = content.strip()
        
        return content
    
    def _extract_api_reference_data(self, url: str, soup: BeautifulSoup) -> Dict:
        """Extract API reference metadata from the page."""
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
        
        description_tag = soup.select_one('p')
        description = description_tag.text.strip() if description_tag else ""
        response_codes = [tab.text.strip() for tab in soup.select('.openapi-tabs__response-code-item')]
        req_mime = _extract_mime_type(soup, section="request")
        res_mime = _extract_mime_type(soup, section="responses")
        auth_type = _extract_authentication_type(soup)

        return {
            "title": title,
            "tag": tag,
            "endpoint": endpoint,
            "method": method,
            "description": description,
            "request_content_type": req_mime,
            "response_content_type": res_mime,
            "authentication": auth_type,
            "response_codes": response_codes,
        }
    
    def _extract_api_schemas(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extract request/response schemas and parameters."""
        def _extract_request_body_schema(soup) -> str:
            body_sections = soup.find_all('details', class_=lambda x: x and ('mime' in x or 'body' in x.lower())) or \
                        soup.find_all('details', string=re.compile(r'Body', re.IGNORECASE))
            if not body_sections:
                body_sections = [section for section in soup.find_all('details') 
                            if section.find('summary') and 'body' in section.find('summary').get_text('\n').lower()]
            if body_sections:
                for body_section in body_sections:
                    body_text = body_section.get_text('\n', strip=True)
                    if body_text and len(body_text) > 10:
                        return body_text.strip()
            return ""

        def _extract_response_schema(soup) -> str:
            response_sections = soup.find_all('details', class_=lambda x: x and 'response' in x) or \
                            [section for section in soup.find_all('details') 
                            if section.find('summary') and ('response' in section.find('summary').get_text('\n').lower() or 
                                                            'schema' in section.find('summary').get_text('\n').lower())]
            if response_sections:
                for response_section in response_sections:
                    response_text = response_section.get_text('\n',strip=True)
                    if response_text and len(response_text) > 50:
                        return response_text.strip()
            return ""

        def _extract_query_parameters(soup) -> str:
            param_sections = [section for section in soup.find_all('details') 
                            if section.find('summary') and 
                            ('parameter' in section.find('summary').get_text('\n').lower() or 
                            'query' in section.find('summary').get_text('\n').lower())]
            if param_sections:
                for param_section in param_sections:
                    param_text = param_section.get_text('\n',strip=True)
                    if param_text and len(param_text) > 10:
                        return param_text.strip()
            return ""

        return {
            "request_parameters": _extract_query_parameters(soup),
            "request_body": _extract_request_body_schema(soup),
            "response_body": _extract_response_schema(soup)
        }
    
    def _extract_code_samples_with_playwright(self, page) -> Dict[str, str]:
        """Extract code samples using playwright for dynamic content."""
        code_samples = {
            "python": "",
            "go": "",
            "java": "",
            "javascript": "",
            "curl": ""
        }
        languages = ["python", "go", "java", "javascript", "curl"]
        
        for lang in languages:
            try:
                tab_selector = f'.openapi-tabs__code-item--{lang}'
                if page.locator(tab_selector).count() > 0:
                    page.click(tab_selector)
                    page.wait_for_timeout(500)
                    code_lines = []
                    content_spans = page.locator('.openapi-explorer__code-block-code-line-content')
                    for i in range(content_spans.count()):
                        line_content = content_spans.nth(i).inner_text()
                        if line_content.strip():
                            code_lines.append(line_content)
                    if code_lines:
                        code_text = '\n'.join(code_lines)
                        code_samples[lang] = code_text
            except Exception as e:
                print(f"Error extracting {lang} code: {e}")
                continue
        
        return code_samples
    
    def _format_api_reference_content(self, api_data: Dict, schemas: Dict, code_samples: Dict) -> str:
        """Format API reference data for LLM consumption."""
        content = []
        
        # Basic API info
        content.append(f"**{api_data['method'].upper()}** `{api_data['endpoint']}`")
        content.append("")
        
        if api_data['description']:
            content.append(api_data['description'])
            content.append("")
        
        # Authentication
        if api_data['authentication']:
            content.append("## Authentication")
            content.append(api_data['authentication'])
            content.append("")
        
        # Request parameters
        if schemas['request_parameters']:
            content.append("## Request Parameters")
            content.append(schemas['request_parameters'])
            content.append("")
        
        # Request body
        if schemas['request_body']:
            content.append("## Request Body")
            content.append(schemas['request_body'])
            content.append("")
        
        # Response
        if schemas['response_body']:
            content.append("## Response")
            content.append(schemas['response_body'])
            content.append("")
        
        if api_data['response_codes']:
            content.append("**Response Codes:** " + ", ".join(api_data['response_codes']))
            content.append("")
        
        # Code samples
        if any(code_samples.values()):
            content.append("## Code Examples")
            content.append("")
            
            for lang, code in code_samples.items():
                if code.strip():
                    lang_name = {
                        'python': 'Python',
                        'go': 'Go', 
                        'java': 'Java',
                        'javascript': 'TypeScript',
                        'curl': 'cURL'
                    }.get(lang, lang.title())
                    
                    content.append(f"### {lang_name}")
                    content.append(f"```{lang}")
                    content.append(code)
                    content.append("```")
                    content.append("")
        
        return '\n'.join(content)
    
    def _process_api_page_with_playwright(self, url: str) -> Optional[str]:
        """Process an API reference page using playwright for dynamic content."""
        try:
            print(f"Processing API page: {url}")
            
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                
                try:
                    page.goto(url, wait_until="networkidle")
                    page.wait_for_timeout(3000)
                    
                    html_content = page.content()
                    soup = BeautifulSoup(html_content, 'html.parser')
                    
                    # Extract page title
                    title = ""
                    h1 = soup.find('h1')
                    if h1:
                        title = h1.get_text(strip=True)
                    
                    # Extract breadcrumb path for context
                    breadcrumbs = self._extract_breadcrumb_path(soup)
                    
                    # Extract API reference data
                    api_data = self._extract_api_reference_data(url, soup)
                    schemas = self._extract_api_schemas(soup)
                    code_samples = self._extract_code_samples_with_playwright(page)
                    
                    # Build page content
                    page_content = []
                    
                    if title:
                        page_content.append(f"# {title}")
                        page_content.append("")
                    
                    if breadcrumbs:
                        breadcrumb_text = " > ".join(breadcrumbs)
                        page_content.append(f"> {breadcrumb_text}")
                        page_content.append("")
                    
                    # Add formatted API content
                    api_content = self._format_api_reference_content(api_data, schemas, code_samples)
                    if api_content:
                        page_content.append(api_content)
                    
                    # Add page separator
                    page_content.append("")
                    page_content.append("---")
                    page_content.append("")
                    
                    return '\n'.join(page_content)
                    
                finally:
                    browser.close()
                    
        except Exception as e:
            print(f"Error processing API page {url}: {e}")
            return None
    
    def _process_page(self, url: str) -> Optional[str]:
        """Process a single page and return formatted content."""
        try:
            # First check if it's an API reference page
            response = requests.get(url, timeout=30)
            if response.status_code != 200:
                print(f"Failed to fetch {url}: {response.status_code}")
                return None
            
            if self._is_api_reference_page(response.text):
                return self._process_api_page_with_playwright(url)
            
            # Process as regular documentation page
            print(f"Processing: {url}")
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract page title
            title = ""
            h1 = soup.find('h1')
            if h1:
                title = h1.get_text(strip=True)
            else:
                title_tag = soup.find('title')
                if title_tag:
                    title = title_tag.get_text(strip=True)
            
            # Extract breadcrumb path for context
            breadcrumbs = self._extract_breadcrumb_path(soup)
            
            # Build page header
            page_content = []
            
            if title:
                page_content.append(f"# {title}")
                page_content.append("")
            
            if breadcrumbs:
                breadcrumb_text = " > ".join(breadcrumbs)
                page_content.append(f"> {breadcrumb_text}")
                page_content.append("")
            
            # Extract main content
            main_content = self._extract_main_content(soup)
            if main_content:
                page_content.append(main_content)
            
            # Add page separator
            page_content.append("")
            page_content.append("---")
            page_content.append("")
            
            return '\n'.join(page_content)
            
        except Exception as e:
            print(f"Error processing {url}: {e}")
            return None
    
    def _process_pages_parallel(self, urls: List[str], max_workers: int = 3) -> List[str]:
        """Process pages in parallel and return formatted content."""
        results = []
        
        def process_url(url: str) -> tuple:
            content = self._process_page(url)
            return (url, content)
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all tasks
            future_to_url = {executor.submit(process_url, url): url for url in urls}
            
            # Collect results
            for future in concurrent.futures.as_completed(future_to_url):
                url = future_to_url[future]
                try:
                    url, content = future.result()
                    if content:
                        results.append((url, content))
                except Exception as e:
                    print(f"Error processing {url}: {e}")
        
        # Sort results by URL for consistent output
        results.sort(key=lambda x: x[0])
        return [content for _, content in results]
    
    def generate_llms_txt(self, output_file: str = "llms.txt") -> None:
        """Generate the complete llms.txt file."""
        print("Starting llms.txt generation...")
        
        # Get all URLs
        urls = self._get_sitemap_urls()
        
        # Process pages
        print(f"Processing {len(urls)} pages...")
        page_contents = self._process_pages_parallel(urls, max_workers=2)  # Reduced workers for playwright stability
        
        # Generate header
        header = [
            "# Glean Developer Documentation",
            "",
            "This file contains the complete Glean developer documentation for LLM consumption.",
            f"Generated from: {self.base_url}",
            f"Total pages processed: {len(page_contents)}",
            "",
            "---",
            ""
        ]
        
        # Combine all content
        full_content = '\n'.join(header) + '\n'.join(page_contents)
        
        # Write to file
        output_path = Path(output_file)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(full_content)
        
        print(f"Generated {output_file} with {len(page_contents)} pages")
        print(f"Total file size: {output_path.stat().st_size:,} bytes")

def main():
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "https://developers.glean.com"
    
    generator = LLMTextGenerator(base_url)
    generator.generate_llms_txt()

if __name__ == "__main__":
    main() 