import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import { usePreviewContent } from '../../lib/usePreviewContent';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import BeakerIcon from '@site/src/components/BeakerIcon';
import { VIDEO_TYPE_LABELS, type VideoRecord } from '../../types/video';
import {
  formatDuration,
  formatUpdated,
  seriesEpisodes,
  seriesLength,
  spokenDuration,
  videoStage,
} from './videoData';
import styles from './Videos.module.css';

const feather = (name: string, size = 16): React.ReactNode =>
  getIcon(name, 'feather', {
    width: size,
    height: size,
    color: 'currentColor',
  });

export function ExperimentalBadge(): React.ReactElement {
  return (
    <span className={styles.experimentalBadge}>
      <BeakerIcon className={styles.experimentalIcon} />
      Experimental
    </span>
  );
}

/** "Platform APIs · 3 of 7" */
export function seriesLabel(video: VideoRecord): string | null {
  if (!video.series) return null;
  return `${video.series.label} · ${video.series.position} of ${seriesLength(video)}`;
}

interface VideoPosterProps {
  video: VideoRecord;
  onPlay: () => void;
  /** Visible hint on the poster, e.g. "Watch walkthrough". */
  hint?: string;
  variant?: 'card' | 'banner' | 'feature' | 'compact';
  /**
   * Cards expose the play action on their title button too; the poster then
   * stays mouse-only so keyboard and screen reader users get one action.
   */
  decorative?: boolean;
  /** Render as a plain span, for use inside another button (the callout). */
  asSpan?: boolean;
}

export function VideoPoster({
  video,
  onPlay,
  hint,
  variant = 'card',
  decorative = false,
  asSpan = false,
}: VideoPosterProps): React.ReactElement {
  const poster = useBaseUrl(video.media.poster);
  const className = `${styles.poster} ${styles[`poster_${variant}`] ?? ''}`;
  const inner = (
    <>
      <img
        alt=""
        decoding="async"
        height={720}
        loading="lazy"
        src={poster}
        width={1280}
      />
      <span className={styles.playButton} aria-hidden="true">
        {feather('Play', variant === 'compact' ? 14 : 18)}
      </span>
      <span className={styles.durationChip} aria-hidden="true">
        {hint ? `${hint} · ` : ''}
        {formatDuration(video.durationSeconds)}
      </span>
    </>
  );
  if (asSpan) {
    return (
      <span aria-hidden="true" className={className}>
        {inner}
      </span>
    );
  }
  return (
    <button
      aria-haspopup={decorative ? undefined : 'dialog'}
      aria-hidden={decorative || undefined}
      aria-label={
        decorative
          ? undefined
          : `Play video: ${video.title}, ${spokenDuration(video.durationSeconds)}`
      }
      className={className}
      onClick={onPlay}
      tabIndex={decorative ? -1 : undefined}
      type="button"
    >
      {inner}
    </button>
  );
}

interface VideoDialogProps {
  video: VideoRecord | null;
  onClose: () => void;
  onNavigate: (video: VideoRecord) => void;
}

/**
 * Player dialog. Same native-<dialog> pattern as the recipe preview
 * (RecipeLayout), so Esc, focus trapping, and focus return come from the
 * platform. The <video> mounts only while open, and plays on open (opening is
 * the user gesture).
 */
export function VideoDialog({
  video,
  onClose,
  onNavigate,
}: VideoDialogProps): React.ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const location = useLocation();
  const previewsEnabled = usePreviewContent();
  const src = useBaseUrl(video?.media.src ?? '');
  const poster = useBaseUrl(video?.media.poster ?? '');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (video && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    if (!video && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [video]);

  useEffect(() => {
    videoRef.current?.play().catch(() => {
      // Autoplay can be refused (e.g. data-saver); controls remain.
    });
  }, [video?.id]);

  const close = useCallback(() => {
    videoRef.current?.pause();
    onClose();
  }, [onClose]);

  // Every embed opens this dialog, so it is the one place that links to the
  // index; on the index itself the link would be a no-op.
  const onIndex = /^\/videos\/?$/.test(location.pathname);
  const episodes = video ? seriesEpisodes(video, previewsEnabled) : [];
  const index = video ? episodes.findIndex((v) => v.id === video.id) : -1;
  const prev = index > 0 ? episodes[index - 1] : undefined;
  const next =
    index >= 0 && index < episodes.length - 1 ? episodes[index + 1] : undefined;
  const recipeHref = video?.related.recipe
    ? `/cookbook/${video.related.recipe}`
    : null;
  const showRecipe = recipeHref && recipeHref !== video?.related.doc;
  const experimental = video ? videoStage(video) === 'experimental' : false;

  return (
    <dialog
      aria-label={video ? `Video: ${video.title}` : 'Video'}
      className={styles.dialog}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      ref={dialogRef}
    >
      {video ? (
        <div className={styles.dialogSurface}>
          <button
            aria-label="Close video"
            className={styles.dialogClose}
            onClick={close}
            type="button"
          >
            {feather('X', 18)}
          </button>

          <div className={styles.player}>
            <video
              controls
              height={video.media.height}
              key={video.id}
              playsInline
              poster={poster}
              preload="metadata"
              ref={videoRef}
              src={src}
              width={video.media.width}
            />
          </div>

          {video.visibility === 'preview' ? (
            <p className={styles.previewNotice}>
              {feather('EyeOff', 14)}
              <span>
                <strong>Unlisted preview.</strong>{' '}
                {video.previewReason ?? 'Not yet published.'}
              </span>
            </p>
          ) : null}

          <div className={styles.dialogDetails}>
            <div className={styles.dialogCopy}>
              {seriesLabel(video) ? (
                <span className={styles.position}>{seriesLabel(video)}</span>
              ) : null}
              <h2 className={styles.dialogTitle}>
                {video.title}
                {experimental ? <ExperimentalBadge /> : null}
              </h2>
              <p className={styles.dialogSummary}>{video.summary}</p>
              <div className={styles.meta}>
                <span className={styles.metaItem}>
                  {feather('Clock', 14)}
                  {formatDuration(video.durationSeconds)}
                </span>
                <span className={styles.dot}>·</span>
                <span>{VIDEO_TYPE_LABELS[video.type]}</span>
                <span className={styles.dot}>·</span>
                <span>Updated {formatUpdated(video.updated)}</span>
              </div>
            </div>
            <div className={styles.dialogActions}>
              <Link
                className={styles.primaryAction}
                onClick={close}
                to={video.related.doc}
              >
                {video.related.docLabel}
                {feather('ArrowRight', 16)}
              </Link>
              {showRecipe ? (
                <Link
                  className={styles.secondaryAction}
                  onClick={close}
                  to={recipeHref}
                >
                  {feather('BookOpen', 16)}
                  Try the recipe
                </Link>
              ) : null}
            </div>
          </div>

          <details className={styles.transcript}>
            <summary>Transcript</summary>
            {video.transcript.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </details>

          <div className={styles.dialogFooter}>
            <span className={styles.footerStart}>
              <span className={styles.disclosure}>
                Narrated with an AI-generated voice.
              </span>
              {onIndex ? null : (
                <Link
                  className={styles.allVideosLink}
                  onClick={close}
                  to="/videos"
                >
                  All videos
                  {feather('ArrowRight', 13)}
                </Link>
              )}
            </span>
            {episodes.length > 1 ? (
              <div className={styles.episodeNav}>
                <button
                  aria-label={prev ? `Previous: ${prev.title}` : 'Previous'}
                  className={styles.navButton}
                  disabled={!prev}
                  onClick={() => prev && onNavigate(prev)}
                  type="button"
                >
                  {feather('ChevronLeft', 15)}
                  Prev
                </button>
                <button
                  aria-label={next ? `Next: ${next.title}` : 'Next'}
                  className={styles.navButton}
                  disabled={!next}
                  onClick={() => next && onNavigate(next)}
                  type="button"
                >
                  Next
                  {feather('ChevronRight', 15)}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </dialog>
  );
}

/** State for one dialog: `open(video)` from any trigger, render `dialog`. */
export function useVideoDialog(
  onChange?: (video: VideoRecord | null) => void,
): {
  open: (video: VideoRecord) => void;
  dialog: React.ReactElement;
} {
  const [current, setCurrent] = useState<VideoRecord | null>(null);
  const set = useCallback(
    (video: VideoRecord | null) => {
      setCurrent(video);
      onChange?.(video);
    },
    [onChange],
  );
  return {
    open: set,
    dialog: (
      <VideoDialog
        onClose={() => set(null)}
        onNavigate={(video) => set(video)}
        video={current}
      />
    ),
  };
}
