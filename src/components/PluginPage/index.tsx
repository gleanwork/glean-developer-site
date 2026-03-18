import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { Steps, Step } from '@theme/Steps';
import CodeBlock from '@theme/CodeBlock';
import Frame from '@theme/Frame';
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
  logo: string;
  accentColor: string;
  steps: PluginStep[];
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

      <h2>Installation</h2>

      {/* Steps */}
      <Steps>
        {steps.map((step, i) => (
          <Step key={i} title={step.label} titleSize="h2">
            <p>{step.description}</p>
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
            {step.type === 'list' && (
              <ol>
                {step.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ol>
            )}
            {step.type === 'command' &&
              step.commands.map((cmd, j) => (
                <div key={j}>
                  <p className={styles.commandLabel}>{cmd.title}</p>
                  <CodeBlock language="bash">{cmd.code}</CodeBlock>
                </div>
              ))}
            {step.image && (
              <Frame>
                <img src={useBaseUrl(step.image)} alt={step.label} />
              </Frame>
            )}
          </Step>
        ))}
      </Steps>
    </div>
  );
}
