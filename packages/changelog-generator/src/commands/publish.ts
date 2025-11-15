import { apply } from '../shared/github.js';

export async function publishCommand(
  repoRoot: string,
  options: { input?: string },
): Promise<void> {
  await apply(repoRoot, options.input);
}
