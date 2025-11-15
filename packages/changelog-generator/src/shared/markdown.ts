import { marked } from 'marked';

marked.setOptions({
  breaks: true,
  gfm: true,
} as any);

export function markdownToHtml(markdown: string): string {
  const result = marked(markdown);
  return typeof result === 'string' ? result : '';
}

export interface ProcessedContent {
  summary: string;
  fullContent: string;
  hasTruncation: boolean;
}

export function processChangelogContent(content: string): ProcessedContent {
  const truncateMarkers = [
    '{/* truncate */}',
    '<!-- truncate -->',
    '<!-- more -->',
  ];

  for (const marker of truncateMarkers) {
    if (content.includes(marker)) {
      const parts = content.split(marker);
      return {
        summary: markdownToHtml(parts[0].trim()),
        fullContent: markdownToHtml(content.replace(marker, '').trim()),
        hasTruncation: true,
      };
    }
  }

  const paragraphs = content.split('\n\n');
  if (paragraphs.length > 1) {
    return {
      summary: markdownToHtml(paragraphs[0].trim()),
      fullContent: markdownToHtml(content),
      hasTruncation: true,
    };
  } else if (content.length > 200) {
    const truncatedContent = content.substring(0, 200).trim();
    const lastSpaceIndex = truncatedContent.lastIndexOf(' ');
    const cleanTruncation =
      lastSpaceIndex > 0
        ? truncatedContent.substring(0, lastSpaceIndex)
        : truncatedContent;

    return {
      summary: markdownToHtml(cleanTruncation + '...'),
      fullContent: markdownToHtml(content),
      hasTruncation: true,
    };
  }

  return {
    summary: markdownToHtml(content),
    fullContent: markdownToHtml(content),
    hasTruncation: false,
  };
}
