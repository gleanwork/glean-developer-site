import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import { useHistory, useLocation } from '@docusaurus/router';
import useBrokenLinks from '@docusaurus/useBrokenLinks';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import indexStyles from '../Cookbook/RecipeIndex.module.css';
import { PREVIEW_CONTENT_PARAM } from '../../lib/previewContent';
import { usePreviewContent } from '../../lib/usePreviewContent';
import {
  VIDEO_TYPE_LABELS,
  VIDEO_TYPES,
  type VideoRecord,
} from '../../types/video';
import VideoCard from './VideoCard';
import {
  ExperimentalBadge,
  seriesLabel,
  useVideoDialog,
  VideoPoster,
} from './VideoPlayer';
import {
  availableVideos,
  formatDuration,
  totalRuntime,
  VIDEO_TRACKS,
  videoStage,
} from './videoData';
import styles from './Videos.module.css';

type Filter = string | 'all';

function validFilter(
  value: string | null,
  available: readonly string[],
): Filter {
  return value && available.includes(value) ? value : 'all';
}

function sortVideos(a: VideoRecord, b: VideoRecord): number {
  if (a.series && b.series && a.series.id === b.series.id) {
    return a.series.position - b.series.position;
  }
  return 0;
}

/**
 * /videos: the Cookbook index's twin. Same header, filter bar, and section
 * styles (imported from RecipeIndex.module.css), so the two read as one site.
 * Cards open a dialog rather than navigating; every video's canonical home is
 * the page it explains.
 */
export default function VideoIndex(): React.ReactElement {
  const history = useHistory();
  const location = useLocation();
  const brokenLinks = useBrokenLinks();

  const previewsEnabled = usePreviewContent();
  const videos = useMemo(
    () => availableVideos(previewsEnabled),
    [previewsEnabled],
  );
  const previewCount = videos.filter((v) => v.visibility === 'preview').length;

  const tracks = useMemo(
    () =>
      VIDEO_TRACKS.filter((track) => videos.some((v) => v.track === track.id)),
    [videos],
  );
  const types = useMemo(
    () => VIDEO_TYPES.filter((type) => videos.some((v) => v.type === type)),
    [videos],
  );

  const filtersFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return {
      track: validFilter(
        params.get('track'),
        tracks.map((t) => t.id),
      ),
      type: validFilter(params.get('type'), types),
    };
  };
  const initial = filtersFromUrl();
  const [activeTrack, setActiveTrack] = useState<Filter>(initial.track);
  const [activeType, setActiveType] = useState<Filter>(initial.type);

  useEffect(() => {
    const next = filtersFromUrl();
    setActiveTrack(next.track);
    setActiveType(next.type);
  }, [location.search, tracks, types]);

  const pushParams = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(location.search);
    mutate(params);
    history.push({
      pathname: location.pathname,
      search: params.size > 0 ? `?${params.toString()}` : '',
    });
  };

  const updateFilter = (dimension: 'track' | 'type', value: Filter) => {
    if (dimension === 'track') setActiveTrack(value);
    else setActiveType(value);
    pushParams((params) => {
      if (value === 'all') params.delete(dimension);
      else params.set(dimension, value);
    });
  };

  const resetFilters = () => {
    setActiveTrack('all');
    setActiveType('all');
    pushParams((params) => {
      params.delete('track');
      params.delete('type');
    });
  };

  // `?v=<id>` opens that video, so a link can be shared. Replace, not push:
  // opening a video should not add history entries.
  const syncParam = useCallback(
    (video: VideoRecord | null) => {
      const params = new URLSearchParams(window.location.search);
      if (video) params.set('v', video.id);
      else params.delete('v');
      history.replace({
        pathname: window.location.pathname,
        search: params.size > 0 ? `?${params.toString()}` : '',
      });
    },
    [history],
  );
  const { open, dialog } = useVideoDialog(syncParam);

  const openedFromUrl = useRef(false);
  useEffect(() => {
    if (openedFromUrl.current) return;
    openedFromUrl.current = true;
    const id = new URLSearchParams(location.search).get('v');
    const video = id ? videos.find((v) => v.id === id) : undefined;
    if (video) open(video);
  }, []);

  const visible = videos.filter(
    (v) =>
      (activeTrack === 'all' || v.track === activeTrack) &&
      (activeType === 'all' || v.type === activeType),
  );
  const sections = tracks
    .map((track) => ({
      track,
      all: videos.filter((v) => v.track === track.id),
      shown: visible.filter((v) => v.track === track.id).sort(sortVideos),
    }))
    .filter(({ shown }) => shown.length > 0);
  for (const { track } of sections) brokenLinks.collectAnchor(track.id);

  const featured = [...videos]
    .filter((v) => v.featured !== undefined)
    .sort((a, b) => (a.featured ?? 0) - (b.featured ?? 0))[0];
  const hasActiveFilters = activeTrack !== 'all' || activeType !== 'all';
  const count = visible.length;

  return (
    <div className={indexStyles.wrap}>
      <div className={indexStyles.eyebrow}>Videos</div>
      <h1 className={indexStyles.title}>Short videos for building on Glean</h1>
      <p className={indexStyles.subtitle}>
        One-minute walkthroughs of the Platform APIs, SDKs, and recipes — each
        one linked to the docs and code it covers.
      </p>

      {previewCount > 0 ? (
        <p className={styles.reviewNotice}>
          {getIcon('EyeOff', 'feather', {
            width: 14,
            height: 14,
            color: 'currentColor',
          })}
          Showing {previewCount} unlisted preview video
          {previewCount === 1 ? '' : 's'}. Add{' '}
          <code>?{PREVIEW_CONTENT_PARAM}=false</code> to see the public view.
        </p>
      ) : null}

      {videos.length === 0 ? (
        <div className={indexStyles.empty}>
          <p>Videos are coming soon.</p>
        </div>
      ) : (
        <>
          {featured ? <Featured onPlay={open} video={featured} /> : null}

          <div className={indexStyles.filterBar}>
            <div className={indexStyles.filterControls}>
              <div className={indexStyles.filterGroup}>
                <label
                  className={indexStyles.filterLabel}
                  htmlFor="video-track"
                >
                  Track
                </label>
                <select
                  className={`gdt-select ${
                    activeTrack !== 'all' ? 'gdt-select--active' : ''
                  }`}
                  id="video-track"
                  onChange={(event) =>
                    updateFilter('track', event.target.value)
                  }
                  value={activeTrack}
                >
                  <option value="all">All tracks</option>
                  {tracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={indexStyles.filterGroup}>
                <label className={indexStyles.filterLabel} htmlFor="video-type">
                  Type
                </label>
                <select
                  className={`gdt-select ${
                    activeType !== 'all' ? 'gdt-select--active' : ''
                  }`}
                  id="video-type"
                  onChange={(event) => updateFilter('type', event.target.value)}
                  value={activeType}
                >
                  <option value="all">All types</option>
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {VIDEO_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={indexStyles.filterMeta}>
              <span aria-live="polite" className={indexStyles.count}>
                {count} video{count === 1 ? '' : 's'}
              </span>
              {hasActiveFilters ? (
                <button
                  className={indexStyles.clearButton}
                  onClick={resetFilters}
                  type="button"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>

          {count > 0 ? (
            <div className={indexStyles.sections}>
              {sections.map(({ track, all, shown }) => (
                <section
                  aria-labelledby={`track-${track.id}`}
                  className={indexStyles.recipeSection}
                  id={track.id}
                  key={track.id}
                >
                  <div className={indexStyles.sectionHeading}>
                    <h2 id={`track-${track.id}`}>{track.label}</h2>
                    <span className={indexStyles.sectionRule} />
                    <span className={indexStyles.sectionMeta}>
                      {all.length} video{all.length === 1 ? '' : 's'} ·{' '}
                      {totalRuntime(all)}
                    </span>
                  </div>
                  <p className={indexStyles.sectionDescription}>
                    {track.description}
                  </p>
                  <div className={styles.grid}>
                    {shown.map((video) => (
                      <VideoCard key={video.id} onPlay={open} video={video} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className={indexStyles.empty}>
              <p>No videos match both selected filters.</p>
            </div>
          )}
        </>
      )}
      {dialog}
    </div>
  );
}

/** "Start here": the Cookbook showcase panel, with the poster on the right. */
function Featured({
  video,
  onPlay,
}: {
  video: VideoRecord;
  onPlay: (video: VideoRecord) => void;
}): React.ReactElement {
  const track = VIDEO_TRACKS.find((t) => t.id === video.track);
  const series = seriesLabel(video);
  return (
    <section aria-label="Start here" className={styles.feature}>
      <div className={styles.featureCopy}>
        <div className={styles.featurePill}>
          <span className={styles.featurePillDot} />
          Start here · {track?.label}
        </div>
        <h2 className={styles.featureTitle}>{video.title}</h2>
        <p className={styles.featureDescription}>{video.summary}</p>
        <div className={styles.featureMeta}>
          <span>{formatDuration(video.durationSeconds)}</span>
          <span>{VIDEO_TYPE_LABELS[video.type]}</span>
          {series ? <span>{series}</span> : null}
          {videoStage(video) === 'experimental' ? <ExperimentalBadge /> : null}
        </div>
        <div className={styles.featureActions}>
          <button
            aria-haspopup="dialog"
            className={styles.primaryAction}
            onClick={() => onPlay(video)}
            type="button"
          >
            {getIcon('Play', 'feather', {
              width: 16,
              height: 16,
              color: 'currentColor',
            })}
            Watch · {formatDuration(video.durationSeconds)}
          </button>
          <Link className={styles.secondaryAction} to={video.related.doc}>
            {video.related.docLabel}
            {getIcon('ArrowRight', 'feather', {
              width: 16,
              height: 16,
              color: 'currentColor',
            })}
          </Link>
        </div>
      </div>
      <VideoPoster
        decorative
        onPlay={() => onPlay(video)}
        variant="feature"
        video={video}
      />
    </section>
  );
}
