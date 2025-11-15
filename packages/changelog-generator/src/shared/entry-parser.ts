import matter from 'gray-matter';
import { processChangelogContent } from './markdown.js';

export interface ParsedChangelogEntry {
  id: string;
  slug: string;
  title: string;
  date: string;
  categories: Array<string>;
  summary: string;
  fullContent: string;
  hasTruncation: boolean;
  fileName: string;
}

export function parseChangelogEntry(
  fileName: string,
  rawContent: string,
): ParsedChangelogEntry {
  const { data, content } = matter(rawContent);

  const dateMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  if (!dateMatch) {
    throw new Error(`Invalid changelog filename format: ${fileName}`);
  }

  const [, dateStr, slug] = dateMatch;
  const date = new Date(dateStr);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date in filename: ${dateStr}`);
  }

  const processedContent = processChangelogContent(content);

  const categories = data.categories || [];

  return {
    id: `${dateStr}-${slug}`,
    slug,
    title: data.title,
    date: dateStr,
    categories,
    summary: processedContent.summary,
    fullContent: processedContent.fullContent,
    hasTruncation: processedContent.hasTruncation,
    fileName,
  };
}
