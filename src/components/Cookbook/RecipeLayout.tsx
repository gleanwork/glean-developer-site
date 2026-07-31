import React, { useState } from 'react';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import {
  RECIPE_STATUS_LABELS,
  RECIPE_SURFACE_LABELS,
  type CookbookPlugin,
  type RecipeRecord,
} from '../../types/recipe';
import PluginRunButton from './PluginRunButton';
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

/**
 * Rail actions, branching on `buildMethod`.
 *
 * `scaffold` recipes have real, verified commands — the page renders them in
 * `RecipeSteps`, and the plugin runs them. Those recipes get the plugin run
 * button; copying `aiPrompt` for them would offer a worse, drift-prone path
 * than the page it sits on.
 *
 * `integrate` and `third-party-build` recipes have no fixed target to copy
 * into (or hand off to Lovable/Replit), so prose genuinely is the mechanism
 * and copy-prompt stays — just labelled for what it does.
 */
function ActionCard({
  recipe,
  plugin,
}: {
  recipe: RecipeRecord;
  plugin: CookbookPlugin;
}): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(recipe.aiPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable; prompt remains accessible via the recipe page.
    }
  };

  const source = recipe.codeAssets[0];
  const isScaffold = recipe.buildMethod === 'scaffold';

  return (
    <div className={styles.actionCard}>
      {isScaffold ? (
        <PluginRunButton plugin={plugin} recipeId={recipe.id} />
      ) : (
        <button
          className={styles.primaryAction}
          onClick={copyPrompt}
          type="button"
        >
          {getIcon('Copy', 'feather', {
            width: 16,
            height: 16,
            color: 'currentColor',
          })}
          {copied ? 'Prompt copied' : 'Copy build prompt'}
        </button>
      )}

      {source ? (
        <a
          className={styles.secondaryAction}
          href={`${COOKBOOK_REPO_URL}/${source.repoPath}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {getIcon('Code', 'feather', {
            width: 16,
            height: 16,
            color: 'currentColor',
          })}
          View source
        </a>
      ) : null}

      <p className={styles.actionHint}>
        {isScaffold
          ? 'Runs the recipe through the Glean cookbook plugin.'
          : recipe.buildMethod === 'third-party-build'
            ? 'Paste into Lovable or Replit to build the app.'
            : 'Paste into Claude Code, Cursor, or Codex.'}
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

const VARIANT_LABEL_WORDS: Record<string, string> = {
  sdk: 'SDK',
  api: 'API',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
};

/** Last path segment of a codeAsset's repoPath, title-cased ("web-sdk" -> "Web SDK"). */
function humanizeVariantLabel(repoPath: string): string {
  return repoPath
    .split('/')
    .pop()!
    .split('-')
    .map(
      (word) =>
        VARIANT_LABEL_WORDS[word] ??
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ');
}

/** One numbered row in a steps timeline. */
function StepRow({
  index,
  step,
}: {
  index: number;
  step: { title: string; description?: string; command?: string };
}): React.ReactElement {
  return (
    <div className={styles.stepRow}>
      <span className={styles.stepNum}>{index}</span>
      <div className={styles.stepBody}>
        <p>
          <strong>{step.title}</strong>
        </p>
        {step.description && <p>{step.description}</p>}
        {step.command && (
          <pre className={styles.stepCommand}>
            <code>{step.command}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

/**
 * Numbered vertical timeline. Recipes with `recipe.steps`/
 * `codeAssets[].steps` (and, for recipes with more than one variant, a
 * tabbed choice) render from that data — the same real, runnable source
 * the generated plugin skill renders from. Recipes not yet migrated to
 * that data fall back to hand-authored JSX children.
 */
export function RecipeSteps({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactElement {
  const recipe = useRecipe('RecipeSteps');
  const variantsWithSteps = (recipe.codeAssets ?? []).filter(
    (asset) => asset.steps && asset.steps.length > 0,
  );
  const hasStepsData =
    (recipe.steps && recipe.steps.length > 0) || variantsWithSteps.length > 0;

  if (!hasStepsData) {
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

  return (
    <RecipeSection label="Steps">
      {recipe.steps && recipe.steps.length > 0 && (
        <div className={styles.stepsWrap}>
          <div className={styles.stepsRail} />
          {recipe.steps.map((step, i) => (
            <StepRow key={step.title} index={i + 1} step={step} />
          ))}
        </div>
      )}
      {variantsWithSteps.length > 1 ? (
        <Tabs>
          {variantsWithSteps.map((asset) => (
            <TabItem
              key={asset.repoPath}
              value={asset.repoPath}
              label={humanizeVariantLabel(asset.repoPath)}
            >
              <div className={styles.stepsWrap}>
                <div className={styles.stepsRail} />
                {asset.steps!.map((step, i) => (
                  <StepRow key={step.title} index={i + 1} step={step} />
                ))}
              </div>
            </TabItem>
          ))}
        </Tabs>
      ) : (
        variantsWithSteps.map((asset) => (
          <div className={styles.stepsWrap} key={asset.repoPath}>
            <div className={styles.stepsRail} />
            {asset.steps!.map((step, i) => (
              <StepRow key={step.title} index={i + 1} step={step} />
            ))}
          </div>
        ))
      )}
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
  /** Plugin coordinates from recipes.json, for the rail's run button. */
  plugin: CookbookPlugin;
  children: React.ReactNode;
}

/**
 * Recipe detail template per design handoff 4b: gradient header banner
 * (category tile, title, meta pills) and a main + sticky-rail grid. The
 * native theme breadcrumb (rendered above this component) handles
 * back-navigation to /cookbook. Body sections come from the recipe MDX via
 * the section components.
 */
export default function RecipeLayout({
  recipe,
  plugin,
  children,
}: RecipeLayoutProps): React.ReactElement {
  return (
    <RecipeContext.Provider value={recipe}>
      <div className={styles.page}>
        <div className={styles.banner}>
          <div className={styles.bannerMain}>
            <CategoryTile
              category={recipe.category}
              iconOverride={recipe.icon}
              iconSize={26}
              size={52}
            />
            <div>
              <h1 className={styles.bannerTitle}>{recipe.title}</h1>
              <p className={styles.bannerDesc}>{recipe.description}</p>
            </div>
          </div>
          <div className={styles.metaRow}>
            {metaPill('Clock', recipe.timeEstimate.replace(/\s*\(.*\)$/, ''))}
            {metaPill('TrendingUp', recipe.level)}
          </div>
        </div>

        <div className={styles.columns}>
          <div className={styles.main}>{children}</div>

          <div className={styles.rail}>
            <ActionCard plugin={plugin} recipe={recipe} />

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
                    {recipe.timeEstimate}
                  </span>
                </div>
              </div>
            </div>

            {recipe.requiredScopes.length > 0 ? (
              <div className={styles.railCard}>
                <div className={styles.railLabel}>Required scopes</div>
                <div className={styles.scopes}>
                  {recipe.requiredScopes.map((scope) => (
                    <span className={styles.scopeChip} key={scope}>
                      {scope}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {recipe.codeAssets.length > 0 ? (
              <div className={styles.railCard}>
                <div className={styles.railLabel}>Code assets</div>
                <div className={styles.assets}>
                  {recipe.codeAssets.map((asset) => (
                    <a
                      className={styles.assetRow}
                      href={`${COOKBOOK_REPO_URL}/${asset.repoPath}`}
                      key={asset.repoPath}
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
