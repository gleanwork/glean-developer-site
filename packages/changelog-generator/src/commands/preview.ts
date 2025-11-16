import { analyze } from '../shared/github.js';

/**
 * Analyzes GitHub releases to preview what changelog entries would be created.
 * Outputs a JSON report to stdout containing entry content and metadata.
 * This is a read-only operation - no files are created or modified.
 */
export async function previewCommand(repoRoot: string): Promise<void> {
  const result = await analyze(repoRoot);
  process.stdout.write(JSON.stringify(result, null, 2));
}
