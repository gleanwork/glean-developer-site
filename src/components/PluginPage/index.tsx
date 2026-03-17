import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

type Step = {
  label: string;
  description: string;
} & (
  | { type: 'cta'; ctaText: string; ctaHref: string }
  | { type: 'command'; commands: string[] }
);

type PluginPageProps = {
  name: string;
  tagline: string;
  logo: string;
  accentColor: string;
  gleanConfigureHref: string;
  steps: Step[];
};

export default function PluginPage({
  name,
  tagline,
  logo,
  accentColor,
  steps,
}: PluginPageProps) {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <div
        className={styles.hero}
        style={{ '--plugin-accent': accentColor } as React.CSSProperties}
      >
        <div className={styles.heroInner}>
          <div className={styles.logoRow}>
            <img
              src={useBaseUrl('/img/glean-logo-white.svg')}
              alt="Glean"
              className={styles.gleanLogo}
            />
            <span className={styles.times}>×</span>
            <img
              src={useBaseUrl(logo)}
              alt={name}
              className={styles.pluginLogo}
            />
          </div>
          <h1 className={styles.heroTitle}>Official Glean Plugin for {name}</h1>
          <p className={styles.heroTagline}>{tagline}</p>
        </div>
      </div>

      {/* Steps */}
      <div className={styles.steps}>
        {steps.map((step, i) => (
          <div key={i} className={styles.step}>
            <div className={styles.stepNumber}>{i + 1}</div>
            <div className={styles.stepContent}>
              <h2 className={styles.stepLabel}>{step.label}</h2>
              <p className={styles.stepDescription}>{step.description}</p>
              {step.type === 'cta' && (
                <Link
                  to={step.ctaHref}
                  className={styles.ctaButton}
                  style={{
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                  }}
                >
                  {step.ctaText}
                </Link>
              )}
              {step.type === 'command' && (
                <div className={styles.commandBlock}>
                  {step.commands.map((cmd, j) => (
                    <div key={j} className={styles.commandLine}>
                      <span className={styles.prompt}>$</span>
                      <code>{cmd}</code>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
