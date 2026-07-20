import { z } from 'zod';

/**
 * Recipe schema — the single source of truth for the Cookbooks section.
 *
 * A recipe is authored as one MDX file in `docs/cookbook/`. The page-level
 * Docusaurus fields (`title`, `description`) double as the recipe's title and
 * summary; everything else lives in a nested `recipe:` frontmatter block so
 * recipe fields never collide with Docusaurus frontmatter.
 *
 * Consumed by:
 * - `scripts/compile-recipes.ts` → `src/data/recipes.json` (build-failing validation)
 * - the Cookbook components (index cards, filters, detail right rail)
 * - the glean-cookbook plugin (scaffold actions, ai_prompt)
 *
 * `schemas/recipe.schema.json` is generated from this file via
 * `pnpm recipes:schema` — do not edit that artifact by hand.
 */

export const RECIPE_SURFACES = [
  'mcp',
  'platform-api',
  'web-sdk',
  'connector-sdk',
  'indexing-api',
  'sdk-client',
  'actions',
  'agents',
] as const;

export const RECIPE_STATUSES = ['showcase', 'production-pattern'] as const;

export const RECIPE_SURFACE_LABELS: Record<
  (typeof RECIPE_SURFACES)[number],
  string
> = {
  mcp: 'MCP',
  'platform-api': 'Platform API',
  'web-sdk': 'Web SDK',
  'connector-sdk': 'Connector SDK',
  'indexing-api': 'Indexing API',
  'sdk-client': 'API clients',
  actions: 'Actions',
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
  repo_path: z.string().min(1),
  language: z.string().min(1),
  description: z.string().min(1),
});

/** One row in the flagship "Combines N recipes" list. */
export const recipeCombinesSchema = z.strictObject({
  title: z.string().min(1),
  surface: z.string().min(1),
  category: z.enum(RECIPE_CATEGORIES),
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
  surfaces: z.array(z.enum(RECIPE_SURFACES)).min(1),
  status: z.enum(RECIPE_STATUSES),
  category: z.enum(RECIPE_CATEGORIES),
  level: z.enum(RECIPE_LEVELS),
  levels: z.strictObject({
    minimal: z.boolean(),
    wow: z.boolean(),
  }),
  time_estimate: z.string().min(1),
  required_scopes: z.array(z.string().min(1)),
  prerequisites: z.array(z.string().min(1)).min(1),
  demo_queries: z.array(z.string().min(1)).default([]),
  code_assets: z.array(recipeCodeAssetSchema).default([]),
  scaffold_actions: z.array(z.enum(RECIPE_SCAFFOLD_ACTIONS)).default([]),
  combines: z.array(recipeCombinesSchema).optional(),
  architecture: z.array(recipeArchitectureNodeSchema).optional(),
  ai_prompt: z.string().min(1),
  llm_context: z.string().min(1).optional(),
  last_verified: z.iso.date().optional(),
  go_dependency: z.boolean().default(false),
  featured: z.boolean().default(false),
  tags: z.array(z.string().min(1)).default([]),
});

/**
 * Frontmatter of a recipe MDX file: Docusaurus page fields we rely on plus
 * the nested recipe block. Other Docusaurus frontmatter keys are allowed.
 */
export const recipeFrontmatterSchema = z.looseObject({
  title: z.string().min(1),
  description: z.string().min(1),
  recipe: recipeMetaSchema,
});

export type RecipeCodeAsset = z.infer<typeof recipeCodeAssetSchema>;
export type RecipeMeta = z.infer<typeof recipeMetaSchema>;
export type RecipeFrontmatter = z.infer<typeof recipeFrontmatterSchema>;

/** The flat, compiled record consumed by components and the plugin. */
export type RecipeRecord = RecipeMeta & {
  title: string;
  summary: string;
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
 * Validates a recipe MDX file's frontmatter and composes the flat record.
 * `expectedId` is the file's basename; it must match `recipe.id` so slugs,
 * filenames, and permalinks never drift.
 */
export function parseRecipeFrontmatter(
  frontmatter: unknown,
  expectedId?: string,
): RecipeValidationResult {
  const parsed = recipeFrontmatterSchema.safeParse(frontmatter);
  if (!parsed.success) {
    return { success: false, errors: formatIssues(parsed.error) };
  }

  const { title, description, recipe } = parsed.data;
  if (expectedId !== undefined && recipe.id !== expectedId) {
    return {
      success: false,
      errors: [
        `recipe.id: "${recipe.id}" must match the file name "${expectedId}"`,
      ],
    };
  }

  return {
    success: true,
    record: {
      ...recipe,
      title,
      summary: description,
      permalink: `/cookbook/${recipe.id}`,
    },
  };
}
