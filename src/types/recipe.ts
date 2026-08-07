import { z } from 'zod';

/**
 * Dev-site adapter for the cookbook-owned recipe contract.
 *
 * Recipe records are authored only in `glean-cookbook` at
 * `recipes/<id>/recipe.json`, compiled into that repo's `registry.json`, and synced
 * locally to `data/cookbook-registry.json` (see `scripts/sync-registry.mjs`).
 * `docs/cookbook/{id}.mdx` is generated from the same registry entry and is
 * matched by filename === id.
 *
 * Consumed by:
 * - `scripts/compile-recipes.ts` → `src/data/recipes.json` (build-failing validation)
 * - the Cookbook components (index cards, filters, detail right rail)
 * - the glean-cookbook plugin (scaffold actions, aiPrompt)
 *
 * Field names are camelCase since this is a genuine JSON data store shared
 * across repos and consumers, not Docusaurus frontmatter.
 *
 * The canonical JSON Schema lives in glean-cookbook. `pnpm recipes:schema`
 * projects this adapter back to JSON Schema so CI can detect structural drift.
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

/**
 * How a recipe actually gets built — declared as data so the plugin can
 * generate the right kind of guidance instead of always regenerating code
 * from a hand-written description of it.
 * - `scaffold`: deterministic, runnable steps — copying already-verified
 *   files, invoking an existing CLI (e.g. `@gleanwork/configure-mcp-server`),
 *   running an install command. No fixed target codebase shape needed;
 *   there's nothing for an LLM to re-derive.
 * - `integrate`: genuinely needs AI judgment because there's no fixed
 *   target — reads and adapts to the user's own existing code/environment
 *   (e.g. embedding into an app whose structure isn't known in advance).
 * - `third-party-build`: the deliverable is a prompt handed off to another
 *   AI tool (Lovable, Replit) that builds the actual app — nothing of ours
 *   to scaffold or adapt.
 */
export const RECIPE_BUILD_METHODS = [
  'scaffold',
  'integrate',
  'third-party-build',
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

export const RECIPE_STEP_KINDS = [
  'choose',
  'scaffold',
  'install',
  'configure',
  'authenticate',
  'verify-fixture',
  'verify-live',
  'run',
  'manual',
  'handoff',
] as const;

export const recipeQuestionSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  prompt: z.string().min(1),
  required: z.boolean().default(true),
});

const recipeVerificationFields = {
  expectedDuration: z.string().min(1),
  startsOwnServer: z.boolean().default(false),
};

export const recipeVerificationSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('automated'),
    command: z.string().min(1),
    ...recipeVerificationFields,
  }),
  ...(['user-browser', 'third-party', 'manual-admin', 'manual'] as const).map(
    (kind) =>
      z.strictObject({
        kind: z.literal(kind),
        command: z.string().min(1).optional(),
        ...recipeVerificationFields,
      }),
  ),
]);

export const recipeRunSchema = z.union([
  z.strictObject({
    command: z.string().min(1),
    url: z.string().min(1).optional(),
    userBrowser: z.literal(false).default(false),
  }),
  z.strictObject({
    command: z.string().min(1).optional(),
    url: z.string().min(1),
    userBrowser: z.boolean().default(false),
  }),
  z.strictObject({
    kind: z.literal('existing-app'),
    userBrowser: z.literal(true),
  }),
]);

export const recipeExecutionSchema = z.strictObject({
  questions: z.array(recipeQuestionSchema).default([]),
  auth: z
    .array(
      z.strictObject({
        kind: z.enum([
          'none',
          'browser-cookie',
          'oauth-with-token-fallback',
          'host-managed',
          'hosted-secret',
          'external-api-key',
          'indexing-token',
        ]),
        scopes: z.array(z.string().min(1)).default([]),
        setupCommand: z.string().min(1).optional(),
        configFile: z.string().min(1).optional(),
        backendVariable: z.string().min(1).optional(),
        credentialVariable: z.string().min(1).optional(),
      }),
    )
    .min(1),
  verification: recipeVerificationSchema,
  run: recipeRunSchema.optional(),
});

/**
 * One step in a `buildMethod: 'scaffold'` recipe's real, runnable sequence.
 * `command` is a literal, copy-pasteable string when the step is one (a
 * scaffold invocation, an install command, a CLI call) — omitted for
 * guidance-only steps that have no command (e.g. "ask which path you want").
 * Rendered by both the generated plugin skill and the recipe's dev site page
 * from this one source, instead of two independently hand-authored copies.
 */
export const recipeStepSchema = z.strictObject({
  kind: z.enum(RECIPE_STEP_KINDS).optional(),
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  command: z.string().min(1).optional(),
});

export const recipeCodeAssetSchema = z.strictObject({
  repoPath: z.string().min(1),
  language: z.string().min(1),
  description: z.string().min(1),
  execution: recipeExecutionSchema.optional(),
  /** Steps specific to this variant, for recipes with more than one (e.g. Web SDK vs. Chat API). */
  steps: z.array(recipeStepSchema).min(1).optional(),
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

export const recipeContentSchema = z.strictObject({
  problem: z.string().min(1),
  takeItFurther: z.array(z.string().min(1)),
  guardrails: z
    .array(
      z.strictObject({
        title: z.string().min(1),
        rule: z.string().min(1),
      }),
    )
    .optional(),
  limitations: z
    .array(
      z.strictObject({
        title: z.string().min(1),
        description: z.string().min(1),
      }),
    )
    .optional(),
});

/**
 * One demo query paired with the checkable behavior a correct build must
 * produce for it — the eval data an agent (or a recipe's own `verify`
 * script) runs against a real, live build before declaring the recipe done.
 * `expectedBehavior` is prose for a human/agent to judge against, not a
 * machine-parsed assertion — recipes with an executable verify script
 * encode their own concrete checks in code, using this as the source query.
 */
export const recipeDemoQuerySchema = z.strictObject({
  query: z.string().min(1),
  expectedBehavior: z.string().min(1),
  /**
   * Set when this query's answer is expected to *differ* by the caller's
   * permissions — one user gets a cited answer, another gets nothing. A verify
   * script needs to know which query that is, and it can't be inferred from
   * `expectedBehavior`: that's prose, and matching on it misfires (a query
   * whose behavior reads "permissions don't restrict it" matched a naive
   * /permission/ test and then demanded a refusal for a public document).
   */
  permissionDifferentiated: z.boolean().optional(),
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
  /** How this recipe actually gets built — drives whether it renders from `steps` or from `aiPrompt`. */
  buildMethod: z.enum(RECIPE_BUILD_METHODS),
  /** Language(s) this recipe can be built in. Omit for recipes with no applicable build language (pure config, or a third-party no-code tool's own stack). Multiple entries means the AI should ask which one. */
  languages: z.array(z.enum(RECIPE_LANGUAGES)).min(1).optional(),
  prerequisites: z.array(z.string().min(1)).min(1),
  demoQueries: z.array(recipeDemoQuerySchema).default([]),
  codeAssets: z.array(recipeCodeAssetSchema).default([]),
  scaffoldActions: z.array(z.enum(RECIPE_SCAFFOLD_ACTIONS)).default([]),
  /** Top-level runnable steps for `buildMethod: 'scaffold'` recipes with no variant split; variant-specific steps live on `codeAssets[].steps` instead. */
  steps: z.array(recipeStepSchema).min(1).optional(),
  /** Customer setup contract when execution is not attached to a specific code asset. */
  execution: recipeExecutionSchema.optional(),
  combines: z.array(recipeCombinesSchema).optional(),
  architecture: z.array(recipeArchitectureNodeSchema).optional(),
  content: recipeContentSchema,
  aiPrompt: z.string().min(1),
  llmContext: z.string().min(1).optional(),
  lastVerified: z.iso.date().optional(),
  goDependency: z.boolean().default(false),
  featured: z.boolean().default(false),
  tags: z.array(z.string().min(1)).default([]),
});

export type RecipeCodeAsset = z.infer<typeof recipeCodeAssetSchema>;
export type RecipeDemoQuery = z.infer<typeof recipeDemoQuerySchema>;
export type RecipeMeta = z.infer<typeof recipeMetaSchema>;

/** The flat, compiled record consumed by components and the plugin. */
export type RecipeRecord = RecipeMeta & {
  /** Site-relative permalink to the recipe page, e.g. `/cookbook/embed-search-chat`. */
  permalink: string;
};

/** Shape of the generated `src/data/recipes.json`. */
/**
 * Where the cookbook plugin lives, synced from the marketplace manifest
 * pluginpack generates in glean-cookbook (see scripts/sync-registry.mjs).
 * Recipe pages print these verbatim in install and invocation commands, so
 * they're derived rather than hardcoded — renaming the plugin upstream must
 * not leave this site printing the old namespace.
 */
export type CookbookPlugin = {
  /** Marketplace name users install from: `<plugin>@<marketplaceName>`. */
  marketplaceName: string;
  /** Plugin name, and the skill namespace on hosts that namespace them. */
  pluginName: string;
  /** GitHub `owner/repo` slug users add as a marketplace source. */
  repo: string;
};

export type RecipesData = {
  /**
   * Marker emitted as the first key of the generated file, so anyone opening it
   * sees that it is generated before they see recipe data. Unused at runtime.
   */
  _generated?: string;
  recipes: RecipeRecord[];
  surfaces: string[];
  generatedAt: string;
  totalRecipes: number;
  plugin: CookbookPlugin;
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
