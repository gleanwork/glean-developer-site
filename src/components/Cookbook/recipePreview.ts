import { isContentVisible } from '../../lib/previewContent';
import type { RecipeRecord } from '../../types/recipe';

/**
 * Preview recipes show only when previews are enabled (`usePreviewContent`),
 * the same rule as preview videos. See `src/lib/previewContent.ts`.
 */
export function isRecipeAvailable(
  recipe: Pick<RecipeRecord, 'visibility'>,
  previewsEnabled: boolean,
): boolean {
  return isContentVisible(recipe, previewsEnabled);
}
