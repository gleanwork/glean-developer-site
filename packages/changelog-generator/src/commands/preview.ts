import { analyze } from '../shared/github.js';

export async function previewCommand(repoRoot: string): Promise<void> {
  const result = await analyze(repoRoot);
  process.stdout.write(JSON.stringify(result, null, 2));
}
