from typing import Sequence, Union, List, Tuple
from glean.indexing.connectors.base_data_client import BaseConnectorDataClient
from data_types import PageInfoData, ApiReferenceData
import json
import re
import requests
import xml.etree.ElementTree as ET
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup, Tag
import uuid
import concurrent.futures
import threading

class DeveloperDocsDataClient(BaseConnectorDataClient[Union[PageInfoData, ApiReferenceData]]):
    
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

    def get_info_page_data(self, urls: List[str]) -> Sequence[ApiReferenceData]:

        def _slugify(text: str) -> str:
            return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

        def _extract_section_from_breadcrumbs(soup):
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

        def _extract_content_until_next_h2(start_elem):
            content_parts = []
            for sibling in start_elem.next_siblings:
                if isinstance(sibling, str):
                    continue
                if sibling.name == 'h2':
                    break
                text = sibling.get_text(separator="\n", strip=True)
                if text:
                    content_parts.append(text)
            return "\n".join(content_parts)

        def _extract_intro_content_after_header(soup):
            h1 = soup.find('h1')
            header = h1.find_parent() if h1 else None
            if not header:
                return ""
            content = []
            found_h2 = False
            for elem in header.next_elements:
                if isinstance(elem, Tag):
                    if elem.name == 'h2':
                        found_h2 = True
                        break
                    if elem.name in ['p', 'ul', 'ol', 'li']:
                        text = elem.get_text(separator="\n", strip=True)
                        if text:
                            content.append(text)
                if elem is not header and getattr(elem, 'name', None) == 'header':
                    break
            return "\n".join(content).strip()

        def _extract_page_info_with_fragments(url: str, html: str) -> List[ApiReferenceData]:
            soup = BeautifulSoup(html, 'html.parser')
            page_title = soup.find('h1').text.strip() if soup.find('h1') else ""
            section = _extract_section_from_breadcrumbs(soup)
            data = []
            h1 = soup.find('h1')
            h2_tags = soup.find_all('h2')
            h1_content = _extract_intro_content_after_header(soup)
            if h1:
                if h1_content:
                    page_info = PageInfoData(
                        id=str(uuid.uuid5(uuid.NAMESPACE_URL, url)),
                        title=page_title,
                        section=section,
                        heading=page_title or section,
                        content=h1_content,
                        url=url
                    )
                    data.append(page_info)
                elif not h2_tags:
                    fallback_content = ""
                    main = soup.find('main')
                    if main:
                        fallback_content = main.get_text(separator="\n", strip=True)
                    if not fallback_content:
                        markdown_div = soup.find('div', class_=lambda c: c and 'markdown' in c)
                        if markdown_div:
                            fallback_content = markdown_div.get_text(separator="\n", strip=True)
                    if not fallback_content:
                        body = soup.find('body')
                        fallback_content = body.get_text(separator="\n", strip=True) if body else ""
                    if fallback_content:
                        page_info = PageInfoData(
                            id=str(uuid.uuid5(uuid.NAMESPACE_URL, url)),
                            title=page_title,
                            section=section,
                            heading=page_title or section,
                            content=fallback_content,
                            url=url
                        )
                        data.append(page_info)
            if h2_tags:
                for h2 in h2_tags:
                    heading_text = h2.text.strip()
                    fragment = _slugify(heading_text)
                    full_url = url + "#" + fragment
                    content = _extract_content_until_next_h2(h2)
                    page_info = PageInfoData(
                        id=str(uuid.uuid5(uuid.NAMESPACE_URL, full_url)),
                        title=page_title,
                        section=section,
                        heading=heading_text,
                        content=content,
                        url=full_url
                    )
                    data.append(page_info)
            return data

        def _scrape_dynamic_info_pages(urls: List[str], max_workers=10):
            all_page_info = []
            lock = threading.Lock()
            url_idx_tuples = list(enumerate(urls))
            ordered_results = [None] * len(urls)
            
            def _fetch_and_extract_with_index(idx_url_tuple):
                idx, url = idx_url_tuple
                page_info = _fetch_and_extract(url)
                return (idx, page_info)
            
            def _fetch_and_extract(url):
                print(f"Scraping {url}...")
                try:
                    response = requests.get(url)
                    if response.status_code != 200:
                        print(f"Failed to fetch {url} - {response.status_code}")
                        return []
                    page_info = _extract_page_info_with_fragments(url, response.text)
                    return page_info
                except Exception as e:
                    print(f"Error scraping {url}: {e}")
                    return []
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                for idx, page_info in executor.map(_fetch_and_extract_with_index, url_idx_tuples):
                    ordered_results[idx] = page_info
            for page_info in ordered_results:
                if page_info:
                    all_page_info.extend(page_info)
            return [page_info for page_info in all_page_info if page_info is not None]
        
        res = _scrape_dynamic_info_pages(urls)
        print("INFO PAGE DATA: ", res)
        return res

    def get_api_reference_data(self, urls: List[str]) -> Sequence[ApiReferenceData]:
        
        def _extract_mime_type(soup, section="request"):
            h2 = soup.find("h2", id=section)
            if not h2:
                return ""
            container = h2.find_next("div", class_="openapi-tabs__mime-container")
            if not container:
                return ""
            li = container.select_one('ul.openapi-tabs__mime > li[aria-selected="true"]') \
                 or container.select_one('ul.openapi-tabs__mime > li')
            return li.text.strip() if li else ""

        def _extract_authentication_type(soup):
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
            description_tag = soup.select_one('p')
            description = description_tag.text.strip() if description_tag else ""
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

        def _extract_request_body_schema(soup):
            request_body_schema = ""
            body_sections = soup.find_all('details', class_=lambda x: x and ('mime' in x or 'body' in x.lower())) or \
                        soup.find_all('details', string=re.compile(r'Body', re.IGNORECASE))
            if not body_sections:
                body_sections = [section for section in soup.find_all('details') 
                            if section.find('summary') and 'body' in section.find('summary').get_text('\n').lower()]
            if body_sections:
                for body_section in body_sections:
                    body_text = body_section.get_text('\n', strip=True)
                    if body_text and len(body_text) > 10:
                        request_body_schema += body_text + "\n\n"
                        break
            if request_body_schema:
                return request_body_schema.strip()
            else:
                return ""

        def _extract_response_schema(soup):
            response_schema = ""
            response_sections = soup.find_all('details', class_=lambda x: x and 'response' in x) or \
                            [section for section in soup.find_all('details') 
                            if section.find('summary') and ('response' in section.find('summary').get_text('\n').lower() or 
                                                            'schema' in section.find('summary').get_text('\n').lower())]
            if response_sections:
                for response_section in response_sections:
                    response_text = response_section.get_text('\n',strip=True)
                    if response_text and len(response_text) > 50:
                        response_schema += response_text + "\n\n"
                        break
            if response_schema:
                return response_schema.strip()
            else:
                return ""

        def _extract_query_parameters(soup):
            query_params_content = ""
            param_sections = [section for section in soup.find_all('details') 
                            if section.find('summary') and 
                            ('parameter' in section.find('summary').get_text('\n').lower() or 
                            'query' in section.find('summary').get_text('\n').lower())]
            if param_sections:
                for param_section in param_sections:
                    param_text = param_section.get_text('\n',strip=True)
                    if param_text and len(param_text) > 10:
                        query_params_content += param_text + "\n\n"
                        break
            if query_params_content:
                return query_params_content.strip()
            else:
                return ""

        def _extract_code_samples(page):
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
        
        def _scrape_single_page_with_page(url: str, page):
            print(f"Scraping {url}...")
            try:
                page.goto(url, wait_until="networkidle")
            except Exception as e:
                print(f"Failed to load {url}: {e}")
                return None

            page.wait_for_timeout(3000)
            html_content = page.content()
            soup = BeautifulSoup(html_content, 'html.parser')
            api_ref_data = _extract_api_reference(url, html_content)
            request_parameters = _extract_query_parameters(soup)
            request_body = _extract_request_body_schema(soup)
            response_body = _extract_response_schema(soup)
            code_samples = _extract_code_samples(page)
            api_ref = ApiReferenceData(
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
                request_parameters=request_parameters,
                request_body=request_body,
                response_body=response_body,
                python_code_sample=code_samples["python"],
                go_code_sample=code_samples["go"],
                java_code_sample=code_samples["java"],
                typescript_code_sample=code_samples["javascript"],
                curl_code_sample=code_samples["curl"]
            )
            return api_ref
        
        def _scrape_dynamic_api_pages(urls: List[str], max_workers=10):
            results = [None] * len(urls)
            lock = threading.Lock()
            url_idx_tuples = list(enumerate(urls))
            
            def _scrape_with_browser(url_idx_tuple: Tuple[int, str]):
                idx, url = url_idx_tuple
                with sync_playwright() as p:
                    browser = p.chromium.launch(headless=True)
                    page = browser.new_page()
                    try:
                        data = _scrape_single_page_with_page(url, page)
                        if not data:
                            print(f"Failed to extract data from {url}")
                    except Exception as e:
                        print(f"Error scraping {url}: {e}")
                        data = None
                    finally:
                        browser.close()
                return (idx, data)
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                for idx, data in executor.map(_scrape_with_browser, url_idx_tuples):
                    if data:
                        with lock:
                            results[idx] = data
            return [api_ref for api_ref in results if api_ref is not None]
        
        res = _scrape_dynamic_api_pages(urls)
        print("API REFERENCE DATA: ", res)
        return res

    def get_source_data(self, since=None) -> Sequence[Union[PageInfoData, ApiReferenceData]]:
        all_urls = self._get_all_sitemap_urls(self.dev_docs_base_url + "/sitemap.xml")
        info_page_urls = []
        api_ref_urls = []
        
        print(f"Checking {len(all_urls)} URLs for API reference pages...")
        for url in all_urls:
            try:
                response = requests.get(url)
                if response.status_code != 200:
                    print(f"Failed to fetch {url} - {response.status_code}")
                    continue
                html = response.text
                if self._is_api_reference_page(html):
                    api_ref_urls.append(url)
                else:
                    info_page_urls.append(url)
            except Exception as e:
                print(f"Error checking {url}: {e}")
                continue
        print(f"Found {len(api_ref_urls)} API reference pages and {len(info_page_urls)} info pages.")
        
        return self.get_info_page_data(info_page_urls) + self.get_api_reference_data(api_ref_urls)
