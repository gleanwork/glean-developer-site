import type { RecipeRecord } from '../../types/recipe';

type Execution = NonNullable<RecipeRecord['execution']>;
export type AuthEntry = Execution['auth'][number];
export type AuthKind = AuthEntry['kind'];

export type AuthContext = {
  label?: string;
  entries: AuthEntry[];
};

const VARIANT_LABEL_WORDS: Record<string, string> = {
  sdk: 'SDK',
  api: 'API',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
};

export function humanizeVariantLabel(repoPath: string): string {
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

function fallbackEntries(recipe: RecipeRecord): AuthEntry[] {
  const kinds: AuthKind[] = [];
  for (const method of recipe.authMethod) {
    if (method === 'web-sdk-cookie') {
      kinds.push('browser-cookie');
    } else if (method === 'client-api-oauth-or-token') {
      kinds.push('oauth-with-token-fallback');
    } else if (method === 'indexing-token') {
      kinds.push('indexing-token');
    }
  }
  return [...new Set(kinds)].map((kind) => ({
    kind,
    scopes: recipe.requiredScopes,
  }));
}

function variantContexts(recipe: RecipeRecord): AuthContext[] {
  return (recipe.codeAssets ?? []).flatMap((asset) =>
    asset.execution
      ? [
          {
            label: humanizeVariantLabel(asset.repoPath),
            entries: asset.execution.auth,
          },
        ]
      : [],
  );
}

function renderKey(context: AuthContext): string {
  return context.entries
    .map(
      (entry) =>
        `${entry.kind}:${entry.scopes.join(',')}:${entry.setupCommand ?? ''}`,
    )
    .join('|');
}

export function authContexts(recipe: RecipeRecord): AuthContext[] {
  if (recipe.execution) {
    return [{ entries: recipe.execution.auth }];
  }
  const variants = variantContexts(recipe);
  if (variants.length === 0) {
    return [{ entries: fallbackEntries(recipe) }];
  }
  const distinct = new Set(variants.map(renderKey));
  return distinct.size === 1 ? [{ entries: variants[0].entries }] : variants;
}

export function variantScopeGroups(
  recipe: RecipeRecord,
): { label: string; scopes: string[] }[] | undefined {
  const variants = variantContexts(recipe);
  if (variants.length < 2) {
    return undefined;
  }
  const groups = variants.map((context) => ({
    label: context.label ?? '',
    scopes: [...new Set(context.entries.flatMap((entry) => entry.scopes))],
  }));
  const distinct = new Set(groups.map((group) => group.scopes.join(',')));
  return distinct.size === 1 ? undefined : groups;
}
