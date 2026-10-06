import type React from 'react';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import { VIDEO_TYPE_LABELS } from '../../types/video';
import {
  findVideo,
  formatDuration,
  isVideoAvailable,
  videoStage,
} from './videoData';
import { usePreviewContent } from '../../lib/usePreviewContent';
import { ExperimentalBadge, useVideoDialog, VideoPoster } from './VideoPlayer';
import styles from './Videos.module.css';

function useAvailableVideo(id: string) {
  const previewsEnabled = usePreviewContent();
  const video = findVideo(id);
  return video && isVideoAvailable(video, previewsEnabled) ? video : undefined;
}

/**
 * MDX: `<VideoCallout id="platform-triggers" />` under a page's intro.
 * One action (play), so the whole callout is a single button. Renders nothing
 * for an unknown or unlisted video, so pages can carry it before release.
 */
export function VideoCallout({
  id,
}: {
  id: string;
}): React.ReactElement | null {
  const video = useAvailableVideo(id);
  const { open, dialog } = useVideoDialog();
  if (!video) return null;
  return (
    <>
      <button
        aria-haspopup="dialog"
        className={styles.callout}
        onClick={() => open(video)}
        type="button"
      >
        <VideoPoster
          asSpan
          onPlay={() => open(video)}
          variant="compact"
          video={video}
        />
        <span className={styles.calloutBody}>
          <span className={styles.calloutEyebrow}>
            {getIcon('PlayCircle', 'feather', {
              width: 13,
              height: 13,
              color: 'currentColor',
            })}
            Watch · {formatDuration(video.durationSeconds)}
          </span>
          <span className={styles.calloutTitle}>
            {video.title}
            {videoStage(video) === 'experimental' ? (
              <ExperimentalBadge />
            ) : null}
          </span>
          <span className={styles.calloutSummary}>{video.summary}</span>
          <span className={styles.calloutMeta}>
            {VIDEO_TYPE_LABELS[video.type]}
          </span>
        </span>
      </button>
      {dialog}
    </>
  );
}

/**
 * A banner CTA for designed overview pages. Pass the host page's own
 * secondary-button class so it matches exactly.
 */
export function VideoCta({
  id,
  className,
  label = 'Watch the overview',
}: {
  id: string;
  className?: string;
  label?: string;
}): React.ReactElement | null {
  const video = useAvailableVideo(id);
  const { open, dialog } = useVideoDialog();
  if (!video) return null;
  return (
    <>
      <button
        aria-haspopup="dialog"
        className={className ?? styles.secondaryAction}
        onClick={() => open(video)}
        type="button"
      >
        {getIcon('PlayCircle', 'feather', {
          width: 17,
          height: 17,
          color: 'currentColor',
        })}
        {label} · {formatDuration(video.durationSeconds)}
      </button>
      {dialog}
    </>
  );
}

/** Recipe banner slot: the walkthrough video in place of the image preview. */
export function RecipeVideo({ id }: { id: string }): React.ReactElement | null {
  const video = useAvailableVideo(id);
  const { open, dialog } = useVideoDialog();
  if (!video) return null;
  return (
    <>
      <VideoPoster
        hint="Watch walkthrough"
        onPlay={() => open(video)}
        variant="banner"
        video={video}
      />
      {dialog}
    </>
  );
}
