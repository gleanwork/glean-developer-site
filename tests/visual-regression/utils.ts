import * as cheerio from 'cheerio';
import * as fs from 'fs';

export function extractSitemapPathnames(sitemapPath: string): Array<string> {
  if (!fs.existsSync(sitemapPath)) {
    throw new Error(
      `Sitemap not found at ${sitemapPath}. Make sure to build the site first with 'pnpm build'`
    );
  }

  const sitemap = fs.readFileSync(sitemapPath).toString();
  const $ = cheerio.load(sitemap, { xmlMode: true });
  const urls: Array<string> = [];
  
  $('loc').each(function handleLoc() {
    urls.push($(this).text());
  });
  
  return urls.map((url) => new URL(url).pathname);
}

export function pathnameToSnapshotName(pathname: string): string {
  return pathname.replace(/^\/|\/$/g, '') || 'index';
}

