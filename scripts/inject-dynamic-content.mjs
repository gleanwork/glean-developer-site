#!/usr/bin/env node

/**
 * Script to inject detailed API content into llms-full.txt file.
 * Scrapes all API pages from sitemap and captures hierarchical JSON structure.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { chromium } from 'playwright';
import * as cheerio from 'cheerio';

const parseXML = promisify(parseString);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LLMContentInjector {
  constructor(llmsFilePath, baseUrl = 'https://developers.glean.com') {
    this.llmsFilePath = llmsFilePath;
    this.baseUrl = baseUrl;
  }

  async _getAllSitemapUrls(sitemapUrl) {
    /**Get all URLs from the sitemap.*/
    try {
      const response = await fetch(sitemapUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch sitemap: ${response.status}`);
      }

      const xmlContent = await response.text();
      const result = await parseXML(xmlContent);

      const urls = [];
      if (result.urlset && result.urlset.url) {
        for (const urlEntry of result.urlset.url) {
          if (urlEntry.loc && urlEntry.loc[0]) {
            urls.push(urlEntry.loc[0]);
          }
        }
      }

      return urls;
    } catch (error) {
      throw new Error(`Failed to fetch sitemap: ${error.message}`);
    }
  }

  _isApiReferencePage(html) {
    const $ = cheerio.load(html);
    return $('pre.openapi__method-endpoint').length > 0;
  }

  _extractHierarchicalSchema($, sectionType = 'request') {
    /**Extract hierarchical JSON schema from the DOM structure.*/
    const schema = {};
    let detailsElements = [];

    if (sectionType === 'responses') {
        const tabsContainer = $('.row.theme-api-markdown > .openapi-left-panel__container > .openapi-tabs__container');
        // console.log(`DEBUG: Found ${tabsContainer.length} tabs containers in responses section`);

        const schemaContainer = tabsContainer.find('.openapi-tabs__schema-container').first();
        // console.log(`DEBUG: Found ${schemaContainer.length} schema containers in responses section`);
        
        if (schemaContainer.length) {
            detailsElements = schemaContainer
            .find('details.openapi-markdown__details.response')
            .first();
            // console.log(`DEBUG: Found ${detailsElements.length} details elements in responses section`);
        }
    } else {
      const tabsContainer = $('.row.theme-api-markdown > .openapi-left-panel__container > .tabs-container');
      // console.log(`DEBUG: Found ${tabsContainer.length} tabs containers in requests section`);
      if (tabsContainer.length) {
        detailsElements = tabsContainer
        .find('details.openapi-markdown__details')
        .first();
        // console.log(`DEBUG: Found ${detailsElements.length} details elements in requests section`);
      }
    }

      const $details = $(detailsElements);
      // console.log(`DEBUG: Found details element: "${$details.html()}"`);
      let propertyDivs = [];

      const ulContainer = $details.find('ul');
        if (ulContainer.length) {
          const firstDiv = ulContainer.children('div').first();
          if (firstDiv.length && firstDiv.attr('id')) { // no wrapper div
            propertyDivs = ulContainer.children('div').toArray();
          } else if (firstDiv.length && firstDiv.attr('class')) { // no wrapper div, no id tailored names
            propertyDivs = ulContainer.children('div.openapi-schema__list-item').addBack().toArray();
          } else if (firstDiv.length && firstDiv.children('div').length > 0) { // one big wrapper div
            propertyDivs = firstDiv.children('div').toArray();
          }
        }

        //console.log(`DEBUG: Found ${propertyDivs.length} property divs`);
        // if (propertyDivs.length > 0) {
        //   console.log('First propertyDiv HTML:', $(propertyDivs[0]).html());
        // }

        for (const propDiv of propertyDivs) {
          const $propDiv = $(propDiv);
          const nestedDetails = $propDiv.find(
            'details.openapi-markdown__details',
          );

          if (nestedDetails.length) {
            const propertyData = this._parsePropertyFromDetails(
              $,
              nestedDetails.first(),
            );
            if (propertyData && Object.keys(propertyData).length > 0) {
              Object.assign(schema, propertyData);
            }
          } else {
            const schemaItem = $propDiv
              .find('.openapi-schema__list-item')
              .first();
            if (schemaItem.length) {
              const container = schemaItem
                .find('.openapi-schema__container')
                .first();
              if (container.length) {
                const propertyElem = container
                  .find('strong.openapi-schema__property')
                  .first();
                if (propertyElem.length) {
                  const propertyName = propertyElem.text().trim();
                  const simpleProperty = this._parseSimplePropertyFromItem(
                    $,
                    schemaItem,
                  );
                  if (
                    simpleProperty &&
                    Object.keys(simpleProperty).length > 0
                  ) {
                    schema[propertyName] = simpleProperty;
                  }
                }
              }
            }
          }
        }

    return schema;
  }

  _extractDescriptionWithTables($, descElem) {
    /**Extract description text including formatted table data, possible values, and examples.*/
    if (!descElem || !descElem.length) {
      return '';
    }

    const descriptionParts = [];

    const textContent = descElem.text().trim();
    if (textContent) {
      descriptionParts.push(textContent);
    }

    let tables = descElem.find('table');
    const parent = descElem.parent();
    if (!tables.length && parent.length) {
      tables = parent.find('table');
    }

    tables.each((_, table) => {
      const tableText = this._formatTableData($, $(table));
      if (tableText) {
        descriptionParts.push(tableText);
      }
    });

    const searchContainers = [];
    if (parent.length) {
      searchContainers.push(parent);
      const parentParent = parent.parent();
      if (parentParent.length) {
        searchContainers.push(parentParent);
      }
    }

    let possibleValues = [];
    let example = '';

    for (const container of searchContainers) {
      if (!possibleValues.length || !example) {
        const [pv, ex] = this._extractEnumAndExample($, container);
        if (!possibleValues.length && pv.length) {
          possibleValues = pv;
        }
        if (!example && ex) {
          example = ex;
        }
      }
    }

    if (possibleValues.length) {
      const valuesStr = possibleValues.map((val) => `\`${val}\``).join(', ');
      descriptionParts.push(`Possible values: ${valuesStr}`);
    }

    if (example) {
      descriptionParts.push(`Example: \`${example}\``);
    }

    return descriptionParts.join('\n\n');
  }

  _formatTableData($, table) {
    /**Convert HTML table to readable text format.*/
    if (!table || !table.length) {
      return '';
    }

    const formattedRows = [];

    const tbody = table.find('tbody');
    if (tbody.length) {
      tbody.find('tr').each((_, tr) => {
        const cells = [];
        $(tr)
          .find('td, th')
          .each((_, cell) => {
            cells.push($(cell).text().trim());
          });
        if (cells.length >= 2) {
          const enumValue = cells[0];
          const description = cells[1];
          formattedRows.push(`${enumValue}: ${description}`);
        }
      });
    } else {
      const allRows = table.find('tr').toArray();
      for (let i = 1; i < allRows.length; i++) {
        const cells = [];
        $(allRows[i])
          .find('td, th')
          .each((_, cell) => {
            cells.push($(cell).text().trim());
          });
        if (cells.length >= 2) {
          const enumValue = cells[0];
          const description = cells[1];
          formattedRows.push(`${enumValue}: ${description}`);
        }
      }
    }

    return formattedRows.length ? formattedRows.join('\n') : '';
  }

  _extractEnumAndExample($, contentDiv) {
    /**Extract possible values and examples from content div.*/
    let possibleValues = [];
    let example = '';

    // Find possible values
    const possibleValuesText = contentDiv.text();
    if (possibleValuesText.includes('Possible values:')) {
      const codes = contentDiv.find('code');
      if (codes.length) {
        codes.each((_, code) => {
          possibleValues.push($(code).text().trim());
        });
      } else {
        const enumMatch = possibleValuesText.match(/\[(.*?)\]/);
        if (enumMatch) {
          const enumStr = enumMatch[1];
          possibleValues = enumStr
            .split(',')
            .map((v) => v.trim().replace(/[`"']/g, ''));
        }
      }
    }

    // Find example
    if (possibleValuesText.includes('Example:')) {
      const codeElem = contentDiv.find('code').first();
      if (codeElem.length) {
        example = codeElem.text().trim();
      }
    }

    return [possibleValues, example];
  }

  _parsePropertyFromDetails($, details) {
    /**Parse a property from an openapi-markdown__details element.*/
    const summary = details.find('summary');
    if (!summary.length) {
      return {};
    }

    const propertyElem = summary.find('.openapi-schema__property').first();
    if (!propertyElem.length) {
      return {};
    }

    const propertyName = propertyElem.text().trim();

    const typeElem = summary.find('.openapi-schema__name').first();
    const propertyType = typeElem.length ? typeElem.text().trim() : 'object';

    const requiredElem = summary.find('.openapi-schema__required').first();
    const isRequired = requiredElem.length > 0;

    let description = '';
    let contentDiv = summary.next('div');
    // console.log(`DEBUG: Found content div: "${contentDiv}"`);
    if (contentDiv.length) {
    // Only look for direct child <p> elements, not nested ones that belong to child properties
        const directP = contentDiv.children('p').first();
        if (directP.length) {
            description = this._extractDescriptionWithTables($, directP);
        } else {
            // Check if there's a description in the collapsibleContent div
            const collapsibleContent = contentDiv.find('.collapsibleContent_i85q').first();
            if (collapsibleContent.length) {
            // Look for the description pattern: div with margin styles containing a <p>
            const marginDiv = collapsibleContent.find('div[style*="margin-top: 0.5rem; margin-bottom: 0.5rem"]').first();
            if (marginDiv.length) {
                const descP = marginDiv.find('p').first();
                if (descP.length) {
                description = this._extractDescriptionWithTables($, descP);
                }
            }
            }
        }
    }

    let isArray = false;
    const arrayIndicator = details.find('li');
    if (arrayIndicator.length) {
      const arrayDiv = arrayIndicator.find('div');
      if (arrayDiv.length && arrayDiv.text().includes('Array [')) {
        isArray = true;
      }
    }

    const children = {};
    const summaryId = summary.attr('id') || '';
    if (summaryId) {
      const childPattern = `${summaryId}-`;
      const childDivs = details.find(`div[id^="${childPattern}"]`);

      childDivs.each((_, childDiv) => {
        const $childDiv = $(childDiv);
        const parentDetails = $childDiv.closest(
          'details.openapi-markdown__details',
        );
        if (parentDetails.length && !parentDetails.is(details)) {
          return;
        }

        const childDetails = $childDiv.find(
          'details.openapi-markdown__details',
        );
        if (childDetails.length) {
          const nestedData = this._parsePropertyFromDetails(
            $,
            childDetails.first(),
          );
          Object.assign(children, nestedData);
        } else {
          const schemaItem = $childDiv
            .find('.openapi-schema__list-item')
            .first();
          if (schemaItem.length) {
            const container = schemaItem
              .find('.openapi-schema__container')
              .first();
            if (container.length) {
              const propertyElem = container
                .find('strong.openapi-schema__property')
                .first();
              if (propertyElem.length) {
                const childName = propertyElem.text().trim();
                const childProperty = this._parseSimplePropertyFromItem(
                  $,
                  schemaItem,
                );
                if (childProperty && Object.keys(childProperty).length > 0) {
                  children[childName] = childProperty;
                }
              }
            }
          }
        }
      });
    }

    const propertyData = {
      type: propertyType,
      description: description,
      required: isRequired,
      is_array: isArray,
    };

    if (Object.keys(children).length > 0) {
      propertyData.properties = children;
    }

    return { [propertyName]: propertyData };
  }

  _parseSimplePropertyFromItem($, schemaItem) {
    /**Parse a simple property from openapi-schema__list-item.*/
    const container = schemaItem.find('.openapi-schema__container');
    if (!container.length) {
      return {};
    }

    const propertyElem = container
      .find('strong.openapi-schema__property')
      .first();
    if (!propertyElem.length) {
      return {};
    }

    const typeElem = container.find('.openapi-schema__name').first();
    const fieldType = typeElem.length ? typeElem.text().trim() : 'unknown';

    const requiredElem = container.find('.openapi-schema__required').first();
    const isRequired = requiredElem.length > 0;

    let description = '';
    // Only look for direct child <p> elements, not nested ones
    const descElem = schemaItem.children('p').first();
    if (descElem.length) {
      description = this._extractDescriptionWithTables($, descElem);
    } else {
      // If no direct child <p>, check for <p> immediately following the container
      const directP = container.next('p');
      if (directP.length) {
        description = this._extractDescriptionWithTables($, directP);
      }
    }

    return {
      type: fieldType,
      description: description,
      required: isRequired,
    };
  }

  _extractRequestParameters($, paramType) {
    /**Extract query or path parameters from the request section.*/
    const h2Section = $('h2#request');
    if (!h2Section.length) {
      return {};
    }

    const headerText = `${paramType.charAt(0).toUpperCase() + paramType.slice(1)} Parameters`;

    const detailsElements = [];
    let currentSibling = h2Section.next();
    while (currentSibling.length) {
      if (currentSibling.is('details.openapi-markdown__details')) {
        detailsElements.push(currentSibling);
      } else if (currentSibling.is('div.tabs-container')) {
        break;
      }
      currentSibling = currentSibling.next();
    }

    for (const details of detailsElements) {
      const $details = $(details);
      const summary = $details.find('summary');
      if (summary.length) {
        const h3 = summary.find(
          'h3.openapi-markdown__details-summary-header-params',
        );
        if (h3.length) {
          const h3Text = h3.text();
          if (h3Text.includes(headerText)) {
            const parameters = {};
            const ulContainer = $details.find('ul');
            if (ulContainer.length) {
              const paramItems = ulContainer.find('.openapi-params__list-item');

              paramItems.each((_, item) => {
                const $item = $(item);
                const container = $item
                  .find('.openapi-schema__container')
                  .first();
                if (container.length) {
                  const propElem = container
                    .find('strong.openapi-schema__property')
                    .first();
                  if (!propElem.length) {
                    return;
                  }
                  const paramName = propElem.text().trim();

                  const typeElem = container
                    .find('.openapi-schema__type')
                    .first();
                  const paramTypeStr = typeElem.length
                    ? typeElem.text().trim()
                    : 'string';

                  const requiredElem = container
                    .find('.openapi-schema__required')
                    .first();
                  const isRequired = requiredElem.length > 0;

                  const descElem = $item.find('p').first();
                  const description = descElem.length
                    ? descElem.text().trim()
                    : '';

                  parameters[paramName] = {
                    type: paramTypeStr,
                    description: description,
                    required: isRequired,
                  };
                }
              });
            }

            return parameters;
          }
        }
      }
    }

    return {};
  }

  _extractMimeType($, section = 'request') {
    /**Extract MIME type from the API page.*/
    if (section === 'responses') {
      const tabsContainer = $('.row.theme-api-markdown > .openapi-left-panel__container > .openapi-tabs__container');
      const mimeContainer = tabsContainer.find('.openapi-tabs__mime-container').first();
      // console.log(`DEBUG: Found mime container: "${mimeContainer}"`);
      
      if (mimeContainer.length) {
        const activeMimeItem = mimeContainer.find('li.openapi-tabs__mime-item.active').first();
        if (activeMimeItem.length) {
          // console.log(`DEBUG: Found active mime item: "${activeMimeItem.text().trim()}"`);
          return activeMimeItem.text().trim();
        }
        
        const firstMimeItem = mimeContainer.find('li.openapi-tabs__mime-item').first();
        if (firstMimeItem.length) {
          // console.log(`DEBUG: Found first mime item: "${firstMimeItem}"`);
          return firstMimeItem.text().trim();
        }
      }
    } else {
      const tabsContainer = $('.row.theme-api-markdown > .openapi-left-panel__container > .tabs-container');
      const mimeContainer = tabsContainer.find('.openapi-tabs__mime-container').first();
      
      if (mimeContainer.length) {
        const activeMimeItem = mimeContainer.find('li.openapi-tabs__mime-item.active').first();
        if (activeMimeItem.length) {
          return activeMimeItem.text().trim();
        }
        
        const firstMimeItem = mimeContainer.find('li.openapi-tabs__mime-item').first();
        if (firstMimeItem.length) {
          return firstMimeItem.text().trim();
        }
      }
    }
    
    return 'application/json';
  }

  async _extractCodeSamples(page) {
    /**Extract code samples from the page using Playwright.*/
    const codeSamples = {
      python_code_sample: '',
      go_code_sample: '',
      java_code_sample: '',
      typescript_code_sample: '',
      curl_code_sample: '',
    };

    const languages = {
      python: 'python_code_sample',
      go: 'go_code_sample',
      java: 'java_code_sample',
      javascript: 'typescript_code_sample',
      curl: 'curl_code_sample',
    };

    for (const [lang, key] of Object.entries(languages)) {
      try {
        const tabSelector = `.openapi-tabs__code-item--${lang}`;
        const tabCount = await page.locator(tabSelector).count();
        if (tabCount > 0) {
          await page.click(tabSelector);
          await page.waitForTimeout(500);

          const codeLines = [];
          const contentSpans = page.locator(
            '.openapi-explorer__code-block-code-line-content',
          );
          const spanCount = await contentSpans.count();

          for (let i = 0; i < spanCount; i++) {
            const spanElement = contentSpans.nth(i);
            const isVisible = await spanElement.isVisible();
            if (isVisible) {
              const lineContent = await spanElement.innerText();
              if (lineContent.trim()) {
                codeLines.push(lineContent);
              }
            }
          }
          if (codeLines.length > 0) {
            const codeText = codeLines.join('\n');
            codeSamples[key] = codeText;
          }
        }
      } catch (e) {
        continue;
      }
    }

    return codeSamples;
  }

  async _scrapeApiPageWithBrowser(url, page) {
    /**Scrape a single API page using provided Playwright page instance.*/
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Set longer timeout and use more reliable wait strategy
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
        await page.waitForTimeout(3000);

        const htmlContent = await page.content();
        const $ = cheerio.load(htmlContent);

        const title = $('h1').text().trim() || '';

        const authElem = $('h4.openapi-security__summary-header');
        const authentication = authElem.length ? authElem.text().trim() : '';

        const requestSchema = this._extractHierarchicalSchema($, 'request');
        const responseSchema = this._extractHierarchicalSchema($, 'responses');

        const queryParameters = this._extractRequestParameters($, 'query');
        const pathParameters = this._extractRequestParameters($, 'path');

        const requestMimeType = this._extractMimeType($, 'request');
        const responseMimeType = this._extractMimeType($, 'responses');

        const codeSamples = await this._extractCodeSamples(page);

        const result = {
          title: title,
          url: url,
          authentication: authentication,
          request_schema: requestSchema,
          response_schema: responseSchema,
          query_parameters: queryParameters,
          path_parameters: pathParameters,
          request_mime_type: requestMimeType,
          response_mime_type: responseMimeType,
          ...codeSamples,
        };

        return result;
      } catch (error) {
        console.log(
          `Attempt ${attempt}/${maxRetries} failed for ${url}: ${error.message}`,
        );
        if (attempt === maxRetries) {
          throw new Error(
            `Error scraping ${url} after ${maxRetries} attempts: ${error.message}`,
          );
        }
        await page.waitForTimeout(1000 * attempt); // Exponential backoff
      }
    }
    // If we get here, all retries failed
    throw new Error(`Failed to scrape ${url} after all retries`);
  }

  async _scrapeApiPagesParallel(urls, maxWorkers = 5) {
    /**Scrape multiple API pages in parallel using Promise.all with chunking.*/
    const results = [];

    // Process URLs in chunks to avoid overwhelming the system
    for (let i = 0; i < urls.length; i += maxWorkers) {
      const chunk = urls.slice(i, i + maxWorkers);
      const browser = await chromium.launch({ headless: true });

      try {
        const chunkPromises = chunk.map(async (url) => {
          const page = await browser.newPage();
          try {
            return await this._scrapeApiPageWithBrowser(url, page);
          } finally {
            await page.close();
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
      } finally {
        await browser.close();
      }
    }

    return results;
  }

  _formatEnhancedContent(apiData) {
    /**Format the API data into clean markdown for injection.*/
    const contentParts = [];

    if (apiData.authentication) {
      contentParts.push('## Authentication');
      contentParts.push(apiData.authentication);
      contentParts.push('');
    }

    const hasRequestContent =
      (apiData.request_schema &&
        Object.keys(apiData.request_schema).length > 0) ||
      (apiData.query_parameters &&
        Object.keys(apiData.query_parameters).length > 0) ||
      (apiData.path_parameters &&
        Object.keys(apiData.path_parameters).length > 0);

    if (hasRequestContent) {
      contentParts.push('## Request');
      contentParts.push('');

      if (
        apiData.path_parameters &&
        Object.keys(apiData.path_parameters).length > 0
      ) {
        contentParts.push('### Path Parameters');
        contentParts.push('');
        for (const [paramName, paramInfo] of Object.entries(
          apiData.path_parameters,
        )) {
          const requiredText = paramInfo.required ? ' (required)' : '';
          contentParts.push(
            `- **${paramName}** (${paramInfo.type})${requiredText}: ${paramInfo.description}`,
          );
        }
        contentParts.push('');
      }

      if (
        apiData.query_parameters &&
        Object.keys(apiData.query_parameters).length > 0
      ) {
        contentParts.push('### Query Parameters');
        contentParts.push('');
        for (const [paramName, paramInfo] of Object.entries(
          apiData.query_parameters,
        )) {
          const requiredText = paramInfo.required ? ' (required)' : '';
          contentParts.push(
            `- **${paramName}** (${paramInfo.type})${requiredText}: ${paramInfo.description}`,
          );
        }
        contentParts.push('');
      }

      if (
        apiData.request_schema &&
        Object.keys(apiData.request_schema).length > 0
      ) {
        const mimeType = apiData.request_mime_type || 'application/json';
        contentParts.push(`- **Content-Type:** ${mimeType}`);

        contentParts.push('');
        contentParts.push('### Request Body');
        contentParts.push('');

        contentParts.push('```json');
        contentParts.push(JSON.stringify(apiData.request_schema, null, 2));
        contentParts.push('```');
        contentParts.push('');
      }
    }

    if (
      apiData.response_schema &&
      Object.keys(apiData.response_schema).length > 0
    ) {
      contentParts.push('## Response');

      const responseMimeType = apiData.response_mime_type || 'application/json';
      contentParts.push(`- **Content-Type:** ${responseMimeType}`);

      contentParts.push('');
      contentParts.push('### Response Body');
      contentParts.push('');

      contentParts.push('```json');
      contentParts.push(JSON.stringify(apiData.response_schema, null, 2));
      contentParts.push('```');
      contentParts.push('');
    }

    const codeSamples = {
      Python: apiData.python_code_sample || '',
      Go: apiData.go_code_sample || '',
      Java: apiData.java_code_sample || '',
      TypeScript: apiData.typescript_code_sample || '',
      cURL: apiData.curl_code_sample || '',
    };

    const hasCode = Object.values(codeSamples).some((code) => code);
    if (hasCode) {
      contentParts.push('## Code Examples');
      contentParts.push('');

      for (const [lang, code] of Object.entries(codeSamples)) {
        if (code) {
          contentParts.push(`### ${lang}`);
          contentParts.push(`\`\`\`${lang.toLowerCase()}`);
          contentParts.push(code);
          contentParts.push('```');
          contentParts.push('');
        }
      }
    }

    return contentParts.join('\n');
  }

  async _findApiSectionsInLlmsFile() {
    /**Parse the llms-full.txt file to find API sections to enhance.*/
    const content = await fs.readFile(this.llmsFilePath, 'utf-8');

    const pattern =
      /# ([^\n]+)\n\n```\n([A-Z]+) \n(\/[^\n]+)\n```\n\n([^\n]+)/g;
    const matches = [...content.matchAll(pattern)];

    const apiSections = [];
    for (const match of matches) {
      const title = match[1].trim();
      const method = match[2].trim();
      const endpoint = match[3].trim();
      const description = match[4].trim();

      const startPos = match.index;
      const nextHeaderPattern = /\n# [^\n]+\n/g;
      nextHeaderPattern.lastIndex = match.index + match[0].length;
      const nextHeaderMatch = nextHeaderPattern.exec(content);
      const endPos = nextHeaderMatch
        ? match.index + match[0].length + nextHeaderMatch.index
        : content.length;

      apiSections.push({
        title: title,
        method: method,
        endpoint: endpoint,
        description: description,
        start_pos: startPos,
        end_pos: endPos,
        original_content: content.slice(startPos, endPos),
      });
    }

    return apiSections;
  }

  async run(limit = null) {
    const allUrls = await this._getAllSitemapUrls(
      `${this.baseUrl}/sitemap.xml`,
    );

    const apiUrls = [];

    for (const url of allUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const html = await response.text();
          if (this._isApiReferencePage(html)) {
            apiUrls.push(url);
          }
        }
      } catch (error) {
        continue;
      }
    }

    const urlsToProcess = limit ? apiUrls.slice(0, limit) : apiUrls;

    const apiSections = await this._findApiSectionsInLlmsFile();

    const enhancedApis = {};
    try {
      const scrapedData = await this._scrapeApiPagesParallel(urlsToProcess, 5);

      for (const apiData of scrapedData) {
        for (const section of apiSections) {
          if (
            section.title.toLowerCase().includes(apiData.title.toLowerCase()) ||
            apiData.title.toLowerCase().includes(section.title.toLowerCase())
          ) {
            enhancedApis[section.title] = apiData;
            break;
          }
        }
      }
    } catch (error) {
      console.error(`Error scraping API pages: ${error.message}`);
      return;
    }

    const originalContent = await fs.readFile(this.llmsFilePath, 'utf-8');

    let enhancedContent = originalContent;
    let offset = 0;
    let injectionsCount = 0;

    for (const section of apiSections) {
      if (section.title in enhancedApis) {
        const apiData = enhancedApis[section.title];
        const enhancedSection = this._formatEnhancedContent(apiData);

        const sectionContent = section.original_content;

        const responsesMatch = sectionContent.match(/\n## Responses[^\n]*\n/);
        if (responsesMatch) {
          const injectionPoint =
            section.start_pos + offset + responsesMatch.index;
          enhancedContent =
            enhancedContent.slice(0, injectionPoint) +
            '\n' +
            enhancedSection +
            '\n' +
            enhancedContent.slice(injectionPoint);
          offset += enhancedSection.length + 2;
          injectionsCount++;
        } else {
          console.log(
            `⚠ No "## Responses" section found in "${section.title}"`,
          );
        }
      }
    }

    const outputFile = this.llmsFilePath.replace('.txt', '-enhanced-node.txt');
    await fs.writeFile(outputFile, enhancedContent, 'utf-8');
  }
}

if (process.argv.length < 3) {
  console.error('Usage: node inject-content.mjs <llms-file> [limit]');
  process.exit(1);
}

const llmsFile = process.argv[2];
const limit = process.argv[3] ? parseInt(process.argv[3]) : null;

const injector = new LLMContentInjector(llmsFile);
try {
  await injector.run(limit);
  console.log('Successfully injected dynamic content into llms-full.txt');
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
