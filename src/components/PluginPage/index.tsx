import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import { getClientIcon } from '@gleanwork/mcp-config-schema/browser';
import TerminalPanel from '../home/TerminalPanel';
import styles from './styles.module.css';

type PluginStep = {
  label: string;
  description: string;
  image?: string;
} & (
  | { type: 'cta'; ctaText: string; ctaHref: string }
  | { type: 'command'; commands: { code: string; title: string }[] }
  | { type: 'list'; items: string[] }
);

type PluginPageProps = {
  name: string;
  tagline: string;
  /** Client id from @gleanwork/mcp-config-schema (claude-code, cursor, codex). */
  clientId: string;
  /** Monochrome brand marks need inverting in dark mode (cursor, codex). */
  mono?: boolean;
  /** Banner heading; defaults to "Glean plugin for <name>". */
  title?: string;
  steps: PluginStep[];
};

function StepBody({ step }: { step: PluginStep }): React.ReactElement {
  const imageUrl = useBaseUrl(step.image ?? '');
  return (
    <>
      <div className={styles.stepLabel}>{step.label}</div>
      <p className={styles.stepDescription}>{step.description}</p>
      {step.type === 'cta' ? (
        <Link className={styles.ctaButton} to={step.ctaHref}>
          {step.ctaText}
          {getIcon('ArrowUpRight', 'feather', {
            width: 16,
            height: 16,
            color: 'currentColor',
          })}
        </Link>
      ) : null}
      {step.type === 'list' ? (
        <ol className={styles.stepList}>
          {step.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      ) : null}
      {step.type === 'command'
        ? step.commands.map((cmd) => (
            <div className={styles.commandBlock} key={cmd.title}>
              <TerminalPanel
                className={styles.terminal}
                code={cmd.code}
                copy
                filename={cmd.title}
              />
            </div>
          ))
        : null}
      {step.image ? (
        <img alt={step.label} className={styles.stepImage} src={imageUrl} />
      ) : null}
    </>
  );
}

/**
 * Plugin install page in the homepage-redesign design language: token-based
 * banner with brand lockup, numbered step rail, terminal command panels.
 */
export default function PluginPage({
  name,
  tagline,
  clientId,
  mono = false,
  title,
  steps,
}: PluginPageProps): React.ReactElement {
  return (
    <div className={`${styles.page} plugin-page-root`}>
      <div className={styles.banner}>
        <span className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          Official Glean plugin
        </span>
        <div className={styles.lockup}>
          <span className={styles.brandTile}>
            {getIcon('glean-logo', 'glean', {
              width: 26,
              height: 26,
              color: 'currentColor',
            })}
          </span>
          <span className={styles.times}>×</span>
          <span
            className={`${styles.brandTile} ${mono ? styles.brandTileMono : ''}`}
            dangerouslySetInnerHTML={{ __html: getClientIcon(clientId) ?? '' }}
          />
        </div>
        <h1 className={styles.bannerTitle}>
          {title ?? `Glean plugin for ${name}`}
        </h1>
        <p className={styles.bannerTagline}>{tagline}</p>
      </div>

      <div className={styles.sectionLabel}>Installation</div>
      <div className={styles.stepsWrap}>
        <div className={styles.stepsRail} />
        {steps.map((step, i) => (
          <div className={styles.stepRow} key={step.label}>
            <span className={styles.stepNum}>{i + 1}</span>
            <div className={styles.stepBody}>
              <StepBody step={step} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
