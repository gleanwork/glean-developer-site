import type React from 'react';
import Link from '@docusaurus/Link';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import { VIDEO_TYPE_LABELS, type VideoRecord } from '../../types/video';
import { formatDuration, spokenDuration, videoStage } from './videoData';
import { ExperimentalBadge, seriesLabel, VideoPoster } from './VideoPlayer';
import styles from './Videos.module.css';

interface VideoCardProps {
  video: VideoRecord;
  onPlay: (video: VideoRecord) => void;
}

/**
 * Video card: RecipeCard's tokens (padding, radius, border, hover, type
 * scale, footer divider) with a 16:9 poster on top.
 *
 * Two actions, so it is an <article>, not one big link: the title button plays
 * (the poster is a mouse-only alias of it), the footer link goes to the docs.
 */
export default function VideoCard({
  video,
  onPlay,
}: VideoCardProps): React.ReactElement {
  const series = seriesLabel(video);
  return (
    <article className={styles.card}>
      <VideoPoster decorative onPlay={() => onPlay(video)} video={video} />
      <div className={styles.cardBody}>
        {series || videoStage(video) === 'experimental' ? (
          <div className={styles.cardTags}>
            {series ? <span className={styles.position}>{series}</span> : null}
            {videoStage(video) === 'experimental' ? (
              <ExperimentalBadge />
            ) : null}
          </div>
        ) : null}
        <h3 className={styles.cardTitle}>
          <button
            aria-haspopup="dialog"
            aria-label={`Play video: ${video.title}, ${spokenDuration(video.durationSeconds)}`}
            className={styles.cardTitleButton}
            onClick={() => onPlay(video)}
            type="button"
          >
            {video.title}
          </button>
        </h3>
        <p className={styles.cardSummary}>{video.summary}</p>
        <div className={styles.cardFooter}>
          <span className={styles.metaItem}>
            {getIcon('Clock', 'feather', {
              width: 14,
              height: 14,
              color: 'currentColor',
            })}
            {formatDuration(video.durationSeconds)}
          </span>
          <span className={styles.dot}>·</span>
          <span>{VIDEO_TYPE_LABELS[video.type]}</span>
          <span className={styles.chips}>
            {(video.languages ?? []).map((language) => (
              <span className={styles.chip} key={language}>
                {language}
              </span>
            ))}
          </span>
        </div>
        <Link className={styles.relatedLink} to={video.related.doc}>
          {video.related.docLabel}
          {getIcon('ArrowRight', 'feather', {
            width: 14,
            height: 14,
            color: 'currentColor',
          })}
        </Link>
      </div>
    </article>
  );
}
