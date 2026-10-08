import experimentalData from '@site/src/data/experimental.json';
import videosJson from '@site/src/data/videos.json';
import { isContentVisible } from '../../lib/previewContent';
import {
  getPlatformStatuses,
  type PlatformStage,
} from '../home/platformStatus';
import {
  videosFileSchema,
  type VideoRecord,
  type VideoTrack,
} from '../../types/video';

// Parse at module load so a malformed registry fails the build, not a reader.
const parsed = videosFileSchema.parse(videosJson);

export const VIDEO_TRACKS: readonly VideoTrack[] = parsed.tracks;
export const ALL_VIDEOS: readonly VideoRecord[] = parsed.videos;

/** Stage per Platform API capability, derived from the generated spec data. */
const DOC_STAGES: Record<string, PlatformStage> = Object.fromEntries(
  getPlatformStatuses(experimentalData.endpoints).map((s) => [
    s.label,
    s.stage,
  ]),
);

/**
 * The badge a card shows: "Experimental" when everything the video covers is
 * experimental *in the docs today*. A series overview that spans GA and
 * experimental APIs is not badged. Graduation removes the badge automatically.
 */
export function videoStage(video: VideoRecord): PlatformStage | null {
  const capabilities = Object.keys(video.narratedStages ?? {});
  if (capabilities.length === 0) return null;
  return capabilities.every((c) => DOC_STAGES[c] === 'experimental')
    ? 'experimental'
    : 'ga';
}

/** Capabilities whose stage in the video no longer matches the docs. */
export function stageDrift(video: VideoRecord): string[] {
  return Object.entries(video.narratedStages ?? {})
    .filter(([capability, narrated]) => DOC_STAGES[capability] !== narrated)
    .map(([capability]) => capability);
}

/**
 * Preview videos show only when previews are enabled (`usePreviewContent`),
 * the same rule as preview recipes. See `src/lib/previewContent.ts`.
 */
export function isVideoAvailable(
  video: VideoRecord,
  previewsEnabled: boolean,
): boolean {
  return isContentVisible(video, previewsEnabled);
}

export function availableVideos(previewsEnabled: boolean): VideoRecord[] {
  return ALL_VIDEOS.filter((video) => isVideoAvailable(video, previewsEnabled));
}

/** What the /videos gallery lists: available videos, minus doc-page-only ones (`gallery: false`). */
export function galleryVideos(previewsEnabled: boolean): VideoRecord[] {
  return availableVideos(previewsEnabled).filter((v) => v.gallery !== false);
}

export function findVideo(id: string): VideoRecord | undefined {
  return ALL_VIDEOS.find((video) => video.id === id);
}

export function videoForRecipe(recipeId: string): VideoRecord | undefined {
  return ALL_VIDEOS.find((video) => video.related.recipe === recipeId);
}

/** Every episode in a series, in authored order, that the reader can see. */
export function seriesEpisodes(
  video: VideoRecord,
  previewsEnabled: boolean,
): VideoRecord[] {
  if (!video.series) return [video];
  const seriesId = video.series.id;
  return availableVideos(previewsEnabled)
    .filter((v) => v.series?.id === seriesId)
    .sort((a, b) => (a.series?.position ?? 0) - (b.series?.position ?? 0));
}

/** Total episodes in a series, counting unlisted ones, so "3 of 7" is stable. */
export function seriesLength(video: VideoRecord): number {
  if (!video.series) return 1;
  const seriesId = video.series.id;
  return ALL_VIDEOS.filter((v) => v.series?.id === seriesId).length;
}

/** 0:50, 1:22 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** "50 seconds", "1 minute 22 seconds" for labels read aloud. */
export function spokenDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const parts = [];
  if (m) parts.push(`${m} minute${m === 1 ? '' : 's'}`);
  if (s) parts.push(`${s} second${s === 1 ? '' : 's'}`);
  return parts.join(' ');
}

/** "5 min" total runtime for a section heading. */
export function totalRuntime(videos: readonly VideoRecord[]): string {
  const total = videos.reduce((sum, v) => sum + v.durationSeconds, 0);
  return `${Math.max(1, Math.round(total / 60))} min`;
}

export function formatUpdated(iso: string): string {
  const [year, month] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 15)).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
