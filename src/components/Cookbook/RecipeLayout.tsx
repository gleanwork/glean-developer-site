import React, { useState } from 'react';
import Link from '@docusaurus/Link';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import {
  RECIPE_STATUS_LABELS,
  RECIPE_SURFACE_LABELS,
  type RecipeRecord,
} from '../../types/recipe';
import { CategoryTile, CATEGORY_ICONS } from './categories';
import styles from './RecipeLayout.module.css';
import catStyles from './categories.module.css';

/** Base URL for runnable recipe code — the glean-cookbook repo (private until launch). */
export const COOKBOOK_REPO_URL =
  'https://github.com/gleanwork/glean-cookbook/tree/main';

/** Set by RecipeLayout; lets MDX section components read the recipe record. */
export const RecipeContext = React.createContext<RecipeRecord | null>(null);

function useRecipe(component: string): RecipeRecord {
  const recipe = React.useContext(RecipeContext);
  if (!recipe) {
    throw new Error(`${component} must be used inside a recipe page`);
  }
  return recipe;
}

function metaPill(icon: string, text: string): React.ReactElement {
  return (
    <span className={styles.metaPill} key={text}>
      {getIcon(icon, 'feather', {
        width: 14,
        height: 14,
        color: 'currentColor',
      })}
      {text}
    </span>
  );
}

function ActionCard({ recipe }: { recipe: RecipeRecord }): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(recipe.ai_prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable; prompt remains accessible via the recipe page.
    }
  };

  const starter = recipe.code_assets[0];

  return (
    <div className={styles.actionCard}>
      <button
        className={styles.primaryAction}
        onClick={copyPrompt}
        type="button"
      >
        {getIcon('Play', 'feather', {
          width: 16,
          height: 16,
          color: 'currentColor',
        })}
        {copied ? 'Prompt copied!' : 'Run minimal demo'}
      </button>
      {starter ? (
        <a
          className={styles.secondaryAction}
          href={`${COOKBOOK_REPO_URL}/${starter.repo_path}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {getIcon('Plus', 'feather', {
            width: 16,
            height: 16,
            color: 'currentColor',
          })}
          Scaffold starter code
        </a>
      ) : (
        <button
          className={styles.secondaryAction}
          onClick={copyPrompt}
          type="button"
        >
          {getIcon('Plus', 'feather', {
            width: 16,
            height: 16,
            color: 'currentColor',
          })}
          Scaffold starter code
        </button>
      )}
      <p className={styles.actionHint}>
        Copies a prompt your AI assistant can build from.
      </p>
    </div>
  );
}

/** Section label — 12px uppercase blue, per handoff 4b. */
export function RecipeSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className={styles.section}>
      <div className={styles.sectionLabel}>{label}</div>
      {children}
    </div>
  );
}

/** Architecture flow diagram on the dotted canvas, from frontmatter nodes. */
export function RecipeArchitecture(): React.ReactElement | null {
  const recipe = useRecipe('RecipeArchitecture');
  const nodes = recipe.architecture ?? [];
  if (nodes.length === 0) return null;

  return (
    <RecipeSection label="Architecture">
      <div className={styles.archCanvas}>
        <div className={styles.archFlow}>
          {nodes.map((node, i) => (
            <React.Fragment key={node.label}>
              {i > 0 ? (
                <span className={styles.archArrow}>
                  {getIcon('ArrowRight', 'feather', {
                    width: 22,
                    height: 22,
                    color: 'currentColor',
                  })}
                </span>
              ) : null}
              <div
                className={`${styles.archNode} ${
                  node.emphasized ? styles.archNodeEmphasized : ''
                }`}
              >
                <span
                  className={`${styles.archNodeIcon} ${
                    node.category
                      ? catStyles[`tile_${node.category}`]
                      : styles.archNodeIconNeutral
                  }`}
                >
                  {node.emphasized
                    ? getIcon('glean-logo', 'glean', {
                        width: 20,
                        height: 20,
                        color: 'currentColor',
                      })
                    : node.icon
                      ? getIcon(node.icon, 'glean', {
                          width: 18,
                          height: 18,
                          color: 'currentColor',
                        })
                      : node.category
                        ? getIcon(
                            CATEGORY_ICONS[node.category] ?? 'glean-app',
                            'glean',
                            {
                              width: 18,
                              height: 18,
                              color: 'currentColor',
                            },
                          )
                        : getIcon('Box', 'feather', {
                            width: 18,
                            height: 18,
                            color: 'currentColor',
                          })}
                </span>
                <span className={styles.archLabel}>{node.label}</span>
                <span className={styles.archCaption}>{node.caption}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </RecipeSection>
  );
}

/** Prerequisite rows with green checks, from frontmatter. */
export function RecipePrereqs(): React.ReactElement {
  const recipe = useRecipe('RecipePrereqs');
  return (
    <RecipeSection label="Prerequisites">
      <div className={styles.prereqList}>
        {recipe.prerequisites.map((item) => (
          <div className={styles.prereqRow} key={item}>
            {getIcon('CheckCircle', 'feather', {
              width: 18,
              height: 18,
              color: 'var(--gdt-success)',
            })}
            <span>{item}</span>
          </div>
        ))}
      </div>
    </RecipeSection>
  );
}

/** Numbered vertical timeline; each child is one step. */
export function RecipeSteps({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const steps = React.Children.toArray(children);
  return (
    <RecipeSection label="Steps">
      <div className={styles.stepsWrap}>
        <div className={styles.stepsRail} />
        {steps.map((step, i) => (
          <div className={styles.stepRow} key={i}>
            <span className={styles.stepNum}>{i + 1}</span>
            <div className={styles.stepBody}>{step}</div>
          </div>
        ))}
      </div>
    </RecipeSection>
  );
}

/** Subtle inline note (replaces stock admonitions inside recipe bodies). */
export function RecipeNote({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <div className={styles.note}>{children}</div>;
}

/** Warm "Take it further" callout; children are the extension bullets. */
export function TakeItFurther({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const items = React.Children.toArray(children);
  return (
    <div className={styles.further}>
      <div className={styles.furtherHeader}>
        {getIcon('Zap', 'feather', {
          width: 18,
          height: 18,
          color: 'var(--gdt-warning-fg)',
        })}
        <span>Take it further</span>
      </div>
      <div className={styles.furtherList}>
        {items.map((item, i) => (
          <div className={styles.furtherRow} key={i}>
            {getIcon('ArrowRight', 'feather', {
              width: 18,
              height: 18,
              color: 'var(--gdt-warning-fg)',
            })}
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RecipeLayoutProps {
  recipe: RecipeRecord;
  children: React.ReactNode;
}

/**
 * Recipe detail template per design handoff 4b: gradient header banner
 * (breadcrumb, category tile, title, meta pills) and a main + sticky-rail
 * grid. Body sections come from the recipe MDX via the section components.
 */
export default function RecipeLayout({
  recipe,
  children,
}: RecipeLayoutProps): React.ReactElement {
  return (
    <RecipeContext.Provider value={recipe}>
      <div className={styles.page}>
        <div className={styles.banner}>
          <div className={styles.breadcrumb}>
            <Link to="/cookbook">Cookbook</Link>
            <span className={styles.breadcrumbSep}>/</span>
            {recipe.title}
          </div>
          <div className={styles.bannerMain}>
            <CategoryTile category={recipe.category} iconSize={26} size={52} />
            <div>
              <h1 className={styles.bannerTitle}>{recipe.title}</h1>
              <p className={styles.bannerDesc}>{recipe.summary}</p>
            </div>
          </div>
          <div className={styles.metaRow}>
            {metaPill('Clock', recipe.time_estimate.replace(/\s*\(.*\)$/, ''))}
            {metaPill('TrendingUp', recipe.level)}
          </div>
        </div>

        <div className={styles.columns}>
          <div className={styles.main}>{children}</div>

          <div className={styles.rail}>
            <ActionCard recipe={recipe} />

            <div className={styles.railCard}>
              <div className={styles.railLabel}>At a glance</div>
              <div className={styles.glanceRows}>
                <div className={styles.glanceRow}>
                  <span className={styles.glanceKey}>Surfaces</span>
                  <span className={styles.glanceVal}>
                    {recipe.surfaces
                      .map((s) => RECIPE_SURFACE_LABELS[s])
                      .join(', ')}
                  </span>
                </div>
                <div className={styles.glanceRow}>
                  <span className={styles.glanceKey}>Status</span>
                  <span className={styles.glanceVal}>
                    {RECIPE_STATUS_LABELS[recipe.status]}
                  </span>
                </div>
                <div className={`${styles.glanceRow} ${styles.glanceRowLast}`}>
                  <span className={styles.glanceKey}>Time</span>
                  <span className={styles.glanceVal}>
                    {recipe.time_estimate}
                  </span>
                </div>
              </div>
            </div>

            {recipe.required_scopes.length > 0 ? (
              <div className={styles.railCard}>
                <div className={styles.railLabel}>Required scopes</div>
                <div className={styles.scopes}>
                  {recipe.required_scopes.map((scope) => (
                    <span className={styles.scopeChip} key={scope}>
                      {scope}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {recipe.code_assets.length > 0 ? (
              <div className={styles.railCard}>
                <div className={styles.railLabel}>Code assets</div>
                <div className={styles.assets}>
                  {recipe.code_assets.map((asset) => (
                    <a
                      className={styles.assetRow}
                      href={`${COOKBOOK_REPO_URL}/${asset.repo_path}`}
                      key={asset.repo_path}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <span>{asset.description}</span>
                      {getIcon('ExternalLink', 'feather', {
                        width: 14,
                        height: 14,
                        color: 'currentColor',
                      })}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </RecipeContext.Provider>
  );
}
