import { z } from 'zod';

/**
 * Recipe schema — the single source of truth for the Cookbooks section.
 *
 * A recipe's metadata lives in `glean-cookbook`'s `registry.json`, synced
 * locally to `data/cookbook-registry.json` (see `scripts/sync-registry.mjs`).
 * The matching `docs/cookbook/{id}.mdx` file is prose-only — no metadata
 * frontmatter — and is matched to its registry entry by filename === id.
 *
 * Consumed by:
 * - `scripts/compile-recipes.ts` → `src/data/recipes.json` (build-failing validation)
 * - the Cookbook components (index cards, filters, detail right rail)
 * - the glean-cookbook plugin (scaffold actions, aiPrompt)
 *
 * Field names are camelCase since this is a genuine JSON data store shared
 * across repos and consumers, not Docusaurus frontmatter.
 *
 * `schemas/recipe.schema.json` is generated from this file via
 * `pnpm recipes:schema` — do not edit that artifact by hand.
 */

export const RECIPE_SURFACES = [
  'mcp',
  /** The Client/REST SDK surface (glean.client.*) — chat, search, agents
   * as shaped for building your own UI. Distinct from 'platform-api' below. */
  'client-api',
  /** The new data-first retrieval surface (glean.search.query() et al.) —
   * Experimental as of its 2026-07 launch; see llmContext on recipes using it
   * for the X-Glean-Include-Experimental opt-in requirement. */
  'platform-api',
  'web-sdk',
  'connector-sdk',
  'indexing-api',
  'sdk-client',
  'tools',
  'agents',
] as const;

export const RECIPE_STATUSES = ['showcase', 'production-pattern'] as const;

export const RECIPE_SURFACE_LABELS: Record<
  (typeof RECIPE_SURFACES)[number],
  string
> = {
  mcp: 'MCP',
  'client-api': 'Client API',
  'platform-api': 'Platform API',
  'web-sdk': 'Web SDK',
  'connector-sdk': 'Connector SDK',
  'indexing-api': 'Indexing API',
  'sdk-client': 'API clients',
  tools: 'Tools',
  agents: 'Agents',
};

export const RECIPE_STATUS_LABELS: Record<
  (typeof RECIPE_STATUSES)[number],
  string
> = {
  showcase: 'Showcase',
  'production-pattern': 'Production pattern',
};

export const RECIPE_SCAFFOLD_ACTIONS = [
  'scaffold-connector',
  'scaffold-web-sdk-embed',
  'scaffold-mcp-config',
  'scaffold-n8n-workflow',
] as const;

/**
 * What credential a recipe needs — declared as data so the plugin can
 * generate the right auth guidance per recipe instead of one universal flow.
 * - `web-sdk-cookie`: Web SDK default SSO, no explicit credential handling.
 * - `client-api-oauth-or-token`: a Client API bearer credential is needed;
 *   Glean supports getting one via IdP OAuth, Glean OAS, or a Glean Token —
 *   which of those is available is a runtime/tenant question, not a
 *   per-recipe one, so recipes just declare that they need *a* credential.
 * - `indexing-token`: Indexing API operations accept Glean-issued tokens
 *   only — OAuth does not apply here regardless of tenant configuration.
 * - `custom`: the recipe's own aiPrompt already fully specifies a bespoke
 *   credential step (e.g. a per-agent bearer token, a third-party tool's
 *   secret store) — the shared detection chain doesn't apply.
 */
export const RECIPE_AUTH_METHODS = [
  'none',
  'web-sdk-cookie',
  'client-api-oauth-or-token',
  'indexing-token',
  'custom',
] as const;

export const RECIPE_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'go',
  'java',
] as const;

/** Visual category — drives the pastel tile color and icon (design handoff). */
export const RECIPE_CATEGORIES = [
  'search',
  'index',
  'mcp',
  'workflow',
  'agent',
  'portal',
] as const;

export const RECIPE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

export const recipeCodeAssetSchema = z.strictObject({
  repoPath: z.string().min(1),
  language: z.string().min(1),
  description: z.string().min(1),
});

/** One row in the flagship "Combines N recipes" list. */
export const recipeCombinesSchema = z.strictObject({
  title: z.string().min(1),
  surface: z.string().min(1),
  category: z.enum(RECIPE_CATEGORIES),
  /** For compound recipes where each combined step uses a different language. */
  language: z.enum(RECIPE_LANGUAGES).optional(),
});

/** One node in the architecture flow diagram. */
export const recipeArchitectureNodeSchema = z.strictObject({
  label: z.string().min(1),
  caption: z.string().min(1),
  category: z.enum(RECIPE_CATEGORIES).optional(),
  /** Explicit Glean icon name; overrides the category's default glyph. */
  icon: z.string().min(1).optional(),
  emphasized: z.boolean().default(false),
});

export const recipeMetaSchema = z.strictObject({
  id: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be a kebab-case slug'),
  title: z.string().min(1),
  description: z.string().min(1),
  /** Short label for the doc sidebar; falls back to `title` when omitted. */
  sidebarLabel: z.string().min(1).optional(),
  surfaces: z.array(z.enum(RECIPE_SURFACES)).min(1),
  status: z.enum(RECIPE_STATUSES),
  category: z.enum(RECIPE_CATEGORIES),
  level: z.enum(RECIPE_LEVELS),
  levels: z.strictObject({
    minimal: z.boolean(),
    wow: z.boolean(),
  }),
  timeEstimate: z.string().min(1),
  /** Explicit icon name; overrides the category's default glyph on cards and the hero banner. */
  icon: z.string().min(1).optional(),
  requiredScopes: z.array(z.string().min(1)),
  /** Which credential category this recipe needs — drives the plugin's generated auth guidance. */
  authMethod: z.array(z.enum(RECIPE_AUTH_METHODS)).min(1),
  /** Language(s) this recipe can be built in. Omit for recipes with no applicable build language (pure config, or a third-party no-code tool's own stack). Multiple entries means the AI should ask which one. */
  languages: z.array(z.enum(RECIPE_LANGUAGES)).min(1).optional(),
  prerequisites: z.array(z.string().min(1)).min(1),
  demoQueries: z.array(z.string().min(1)).default([]),
  codeAssets: z.array(recipeCodeAssetSchema).default([]),
  scaffoldActions: z.array(z.enum(RECIPE_SCAFFOLD_ACTIONS)).default([]),
  combines: z.array(recipeCombinesSchema).optional(),
  architecture: z.array(recipeArchitectureNodeSchema).optional(),
  aiPrompt: z.string().min(1),
  llmContext: z.string().min(1).optional(),
  lastVerified: z.iso.date().optional(),
  goDependency: z.boolean().default(false),
  featured: z.boolean().default(false),
  tags: z.array(z.string().min(1)).default([]),
});

export type RecipeCodeAsset = z.infer<typeof recipeCodeAssetSchema>;
export type RecipeMeta = z.infer<typeof recipeMetaSchema>;

/** The flat, compiled record consumed by components and the plugin. */
export type RecipeRecord = RecipeMeta & {
  /** Site-relative permalink to the recipe page, e.g. `/cookbook/embed-search-chat`. */
  permalink: string;
};

/** Shape of the generated `src/data/recipes.json`. */
export type RecipesData = {
  recipes: RecipeRecord[];
  surfaces: string[];
  generatedAt: string;
  totalRecipes: number;
};

export type RecipeValidationResult =
  | { success: true; record: RecipeRecord }
  | { success: false; errors: string[] };

function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return `${path}: ${issue.message}`;
  });
}

/**
 * Validates one `registry.json` entry and composes the flat record.
 * `expectedId` is the matching `docs/cookbook/{id}.mdx` file's basename; it
 * must match `id` so slugs, filenames, and permalinks never drift.
 */
export function parseRecipeEntry(
  entry: unknown,
  expectedId?: string,
): RecipeValidationResult {
  const parsed = recipeMetaSchema.safeParse(entry);
  if (!parsed.success) {
    return { success: false, errors: formatIssues(parsed.error) };
  }

  const recipe = parsed.data;
  if (expectedId !== undefined && recipe.id !== expectedId) {
    return {
      success: false,
      errors: [`id: "${recipe.id}" must match the file name "${expectedId}"`],
    };
  }

  return {
    success: true,
    record: {
      ...recipe,
      permalink: `/cookbook/${recipe.id}`,
    },
  };
}
