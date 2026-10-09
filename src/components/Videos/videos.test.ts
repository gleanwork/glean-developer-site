import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import recipesData from '@site/src/data/recipes.json';
import videosJson from '@site/src/data/videos.json';
import { videosFileSchema } from '../../types/video';
import {
  ALL_VIDEOS,
  VIDEO_TRACKS,
  findVideo,
  formatDuration,
  galleryVideos,
  isVideoAvailable,
  seriesLength,
  spokenDuration,
  stageDrift,
} from './videoData';

const root = path.resolve(__dirname, '../../..');

function docFile(docId: string): string | undefined {
  return ['.mdx', '.md']
    .map((ext) => path.join(root, 'docs', `${docId}${ext}`))
    .find((file) => existsSync(file));
}

describe('videos registry', () => {
  it('matches the schema', () => {
    expect(() => videosFileSchema.parse(videosJson)).not.toThrow();
  });

  it('has unique ids and known tracks', () => {
    const ids = ALL_VIDEOS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    const tracks = new Set(VIDEO_TRACKS.map((t) => t.id));
    for (const video of ALL_VIDEOS) expect(tracks).toContain(video.track);
  });

  it('numbers each series 1..n with no gaps', () => {
    const bySeries = new Map<string, number[]>();
    for (const video of ALL_VIDEOS) {
      if (!video.series) continue;
      const positions = bySeries.get(video.series.id) ?? [];
      positions.push(video.series.position);
      bySeries.set(video.series.id, positions);
    }
    for (const positions of bySeries.values()) {
      expect([...positions].sort((a, b) => a - b)).toEqual(
        positions.map((_, i) => i + 1),
      );
    }
  });

  it('links only to recipes that exist', () => {
    const recipeIds = new Set(recipesData.recipes.map((r) => r.id));
    for (const video of ALL_VIDEOS) {
      if (video.related.recipe) {
        expect(recipeIds, video.id).toContain(video.related.recipe);
      }
    }
  });

  it('attaches public videos to a page on this site', () => {
    for (const video of ALL_VIDEOS.filter((v) => v.visibility === 'public')) {
      expect(
        video.related.docId,
        `${video.id} needs an attach page`,
      ).toBeDefined();
      expect(docFile(video.related.docId ?? ''), video.id).toBeDefined();
    }
  });

  it('embeds each public video on the page it attaches to', () => {
    for (const video of ALL_VIDEOS.filter((v) => v.visibility === 'public')) {
      const docId = video.related.docId ?? '';
      if (docId.startsWith('cookbook/')) continue; // recipe banner, by registry
      if (docId === 'libraries/indexing-sdk/index') continue; // VideoCta in the hero
      const source = readFileSync(docFile(docId) ?? '', 'utf8');
      expect(source, video.id).toContain(`<VideoCallout id="${video.id}"`);
    }
  });

  it('has a poster for every video', () => {
    for (const video of ALL_VIDEOS) {
      if (/^https:\/\//.test(video.media.poster)) continue; // hosted
      expect(
        existsSync(path.join(root, 'static', video.media.poster)),
        `${video.id}: run pnpm videos:sync`,
      ).toBe(true);
    }
  });

  // A local sync (GLEAN_DEVELOPER_VIDEOS_DIR) points at git-ignored copies in
  // static/, so committing it would ship videos with no media.
  it.runIf(process.env.CI)(
    'is synced from hosted media, not a local preview',
    () => {
      for (const video of ALL_VIDEOS) {
        expect(video.media.src, video.id).toMatch(/^https:\/\//);
        expect(video.media.poster, video.id).toMatch(/^https:\/\//);
      }
    },
  );

  it('never publishes a video whose narrated stage contradicts the docs', () => {
    // A video that says "experimental" for a GA API (or the reverse) stays
    // `preview` until it is re-rendered.
    for (const video of ALL_VIDEOS.filter((v) => v.visibility === 'public')) {
      expect(stageDrift(video), video.id).toEqual([]);
    }
  });

  it('explains every unlisted video', () => {
    for (const video of ALL_VIDEOS.filter((v) => v.visibility === 'preview')) {
      expect(video.previewReason, video.id).toBeTruthy();
    }
  });
});

describe('video helpers', () => {
  const preview = ALL_VIDEOS.find((v) => v.visibility === 'preview');
  const pub = ALL_VIDEOS.find((v) => v.visibility === 'public');

  it('shows preview videos only when previews are enabled', () => {
    expect(pub && isVideoAvailable(pub, false)).toBe(true);
    if (!preview) return;
    expect(isVideoAvailable(preview, false)).toBe(false);
    expect(isVideoAvailable(preview, true)).toBe(true);
  });

  it('keeps doc-page-only videos out of the gallery but playable on their page', () => {
    const docsMcp = findVideo('docs-mcp');
    expect(docsMcp?.gallery).toBe(false);
    expect(galleryVideos(true).map((v) => v.id)).not.toContain('docs-mcp');
    for (const video of ALL_VIDEOS.filter((v) => v.gallery === false)) {
      expect(docFile(video.related.docId ?? ''), video.id).toBeTruthy();
    }
  });

  it('formats durations for display and for screen readers', () => {
    expect(formatDuration(50)).toBe('0:50');
    expect(formatDuration(82)).toBe('1:22');
    expect(spokenDuration(82)).toBe('1 minute 22 seconds');
    expect(spokenDuration(60)).toBe('1 minute');
  });

  it('counts unlisted episodes in the series length', () => {
    const episode = ALL_VIDEOS.find((v) => v.series?.id === 'platform-apis');
    expect(episode && seriesLength(episode)).toBe(7);
  });
});
