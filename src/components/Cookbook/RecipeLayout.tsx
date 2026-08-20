import React, { useRef, useState } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import {
  RECIPE_STATUS_LABELS,
  RECIPE_SURFACE_LABELS,
  type CookbookPlugin,
  type RecipeRecord,
} from '../../types/recipe';
import BrowserFrame from '../BrowserFrame';
import PluginRunButton from './PluginRunButton';
import { AdaptiveBrandIcon, CATEGORY_ICONS } from './categories';
import { BRAND_ICON_SRC } from './brandIcons';
import { RecipeAuthCard } from './RecipeAuth';
import { humanizeVariantLabel, variantScopeGroups } from './authContexts';
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

  // Link the recipe directory rather than a single codeAsset: recipes with a
  // path or language split have several, and linking only the first hid the
  // others once the separate code-assets card went away.
  const hasSource = recipe.codeAssets.length > 0;
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

      {hasSource ? (
        <a
          className={styles.secondaryAction}
          href={`${COOKBOOK_REPO_URL}/recipes/${recipe.id}`}
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
                  <ArchNodeIcon node={node} />
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

/**
 * The queries a reader should actually try, from the registry's `demoQueries`.
 *
 * Data-driven like `RecipePrereqs`, and for the same reason: these are the exact
 * queries the verify harness runs, so a page that restated them in prose would
 * drift from what is actually checked. Until this existed, `demoQueries` was
 * compiled into recipes.json and rendered nowhere -- a reader finished a recipe
 * with no idea what to test.
 */
export function RecipeDemoQueries(): React.ReactElement | null {
  const recipe = useRecipe('RecipeDemoQueries');
  if (recipe.demoQueries.length === 0) return null;

  return (
    <RecipeSection label="Try it">
      <div className={styles.prereqList}>
        {recipe.demoQueries.map((demo) => (
          <div className={styles.prereqRow} key={demo.query}>
            {getIcon('Search', 'feather', {
              width: 18,
              height: 18,
              color: 'var(--gdt-primary)',
            })}
            <div>
              <p>
                <strong>{demo.query}</strong>
              </p>
              <p>{demo.expectedBehavior}</p>
            </div>
          </div>
        ))}
      </div>
      {recipe.lastVerified && (
        <p>
          <em>
            Each of these was run against a live Glean instance on{' '}
            {recipe.lastVerified}.
          </em>
        </p>
      )}
    </RecipeSection>
  );
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

interface RecipePreviewProps {
  url: string;
  alt: string;
  caption: string;
}

function RecipePreview({
  url,
  alt,
  caption,
}: RecipePreviewProps): React.ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openPreview = (): void => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };

  const closePreview = (): void => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  };

  return (
    <>
      <button
        className={styles.previewThumbnail}
        type="button"
        aria-label={`Open full-size preview: ${alt}`}
        aria-haspopup="dialog"
        onClick={openPreview}
      >
        <img src={url} alt={alt} width="1280" height="720" />
        <span className={styles.previewThumbnailHint} aria-hidden="true">
          {getIcon('Maximize2', 'feather', { width: 15, height: 15 })}
          View preview
        </span>
      </button>

      <dialog
        ref={dialogRef}
        className={styles.previewDialog}
        aria-label={alt}
        onClick={(event) => {
          if (event.target === event.currentTarget) closePreview();
        }}
      >
        <div className={styles.previewDialogSurface}>
          <button
            className={styles.previewDialogClose}
            type="button"
            aria-label="Close full-size preview"
            onClick={closePreview}
          >
            {getIcon('X', 'feather', { width: 18, height: 18 })}
          </button>
          <BrowserFrame
            url="localhost:3000"
            className={styles.previewDialogFrame}
          >
            <img
              className={styles.previewDialogImage}
              src={url}
              alt={alt}
              width="1280"
              height="720"
            />
          </BrowserFrame>
          <p className={styles.previewDialogCaption}>{caption}</p>
        </div>
      </dialog>
    </>
  );
}

/**
 * Recipe detail template per design handoff 4b: gradient header banner
 * (title, meta pills) and a main + sticky-rail grid. The native theme
 * breadcrumb (rendered above this component) handles back-navigation to
 * /cookbook. Body sections come from the recipe MDX via the section
 * components.
 */
/**
 * Architecture node glyph, resolved the same way a recipe card's is: a brand
 * mark first, then the Glean set, then the category default.
 *
 * Its own component because the brand path needs `useBaseUrl`, which cannot be
 * called from inside the nodes' `.map()`.
 */
function ArchNodeIcon({
  node,
}: {
  node: RecipeRecord['architecture'][number];
}): React.ReactNode {
  const brand = node.icon ? BRAND_ICON_SRC[node.icon] : undefined;
  const brandUrl = useBaseUrl(brand?.adaptive === false ? brand.src : '');

  // An emphasized node falls back to Glean's own mark, unless it names a brand
  // icon of its own — a trigger node wants the Glean Trigger lockup, not the
  // plain wordmark.
  if (node.emphasized && !brand) {
    return getIcon('glean-logo', 'glean', {
      width: 20,
      height: 20,
      color: 'currentColor',
    });
  }
  if (brand?.adaptive === false) {
    return (
      <img
        src={brandUrl}
        alt=""
        width={18}
        height={18}
        style={{ objectFit: 'contain' }}
      />
    );
  }
  if (brand) {
    return <AdaptiveBrandIcon src={brand.src} width={18} height={18} />;
  }
  if (node.icon) {
    return getIcon(node.icon, 'glean', {
      width: 18,
      height: 18,
      color: 'currentColor',
    });
  }
  // A node with neither icon nor category keeps the feather Box it always had.
  return node.category
    ? getIcon(CATEGORY_ICONS[node.category] ?? 'glean-app', 'glean', {
        width: 18,
        height: 18,
        color: 'currentColor',
      })
    : getIcon('Box', 'feather', {
        width: 18,
        height: 18,
        color: 'currentColor',
      });
}

export default function RecipeLayout({
  recipe,
  plugin,
  children,
}: RecipeLayoutProps): React.ReactElement {
  const previewFile = recipe.preview?.path.split('/').at(-1);
  const previewUrl = previewFile
    ? `/img/cookbook/previews/${recipe.id}/${previewFile}`
    : null;

  return (
    <RecipeContext.Provider value={recipe}>
      <div className={styles.page}>
        <div className={styles.banner}>
          <div
            className={`${styles.bannerLayout} ${
              recipe.preview && previewUrl ? styles.bannerLayoutWithPreview : ''
            }`}
          >
            <div>
              <div className={styles.bannerMain}>
                <h1 className={styles.bannerTitle}>{recipe.title}</h1>
                <p className={styles.bannerDesc}>{recipe.description}</p>
              </div>
              <div className={styles.metaRow}>
                {metaPill(
                  'Clock',
                  recipe.timeEstimate.replace(/\s*\(.*\)$/, ''),
                )}
                {metaPill('TrendingUp', recipe.level)}
              </div>
            </div>

            {recipe.preview && previewUrl ? (
              <RecipePreview
                url={previewUrl}
                alt={recipe.preview.alt}
                caption={recipe.preview.caption}
              />
            ) : null}
          </div>
        </div>

        <div className={styles.columns}>
          <div className={styles.main}>{children}</div>

          <div className={styles.rail}>
            <ActionCard plugin={plugin} recipe={recipe} />

            <RecipeAuthCard recipe={recipe} />

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

            <RequiredScopesCard recipe={recipe} />
          </div>
        </div>
      </div>
    </RecipeContext.Provider>
  );
}

function RequiredScopesCard({
  recipe,
}: {
  recipe: RecipeRecord;
}): React.ReactElement | null {
  const groups = variantScopeGroups(recipe);

  if (groups) {
    return (
      <div className={styles.railCard}>
        <div className={styles.railLabel}>Required scopes</div>
        <div className={styles.authBody}>
          {groups.map((group) => (
            <div key={group.label}>
              <p>
                <strong>{group.label}</strong>
              </p>
              <div className={styles.scopes}>
                {group.scopes.map((scope) => (
                  <span className={styles.scopeChip} key={scope}>
                    {scope}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recipe.requiredScopes.length === 0) {
    return null;
  }

  return (
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
  );
}
