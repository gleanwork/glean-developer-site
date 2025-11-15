import * as fs from 'node:fs';
import * as path from 'node:path';
import { analyze, apply, writePreview } from '../shared/github.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const dbg: any = require('debug');
const dbgBase = dbg('changelog');
const useDebug =
  typeof dbgBase?.enabled === 'boolean' ? dbgBase.enabled : !!process.env.DEBUG;
const log = (...args: Array<any>) => {
  if (useDebug) {
    dbgBase(...args);
  } else {
    console.log('[changelog]', ...args);
  }
};

export async function syncAllCommand(
  repoRoot: string,
  options: { dryRun?: boolean },
): Promise<void> {
  const analyzed = await analyze(repoRoot);

  if (options.dryRun) {
    const previewDir = writePreview(analyzed, repoRoot);
    process.stdout.write(JSON.stringify(analyzed, null, 2));
    log(`Preview written to: ${previewDir}`);
    if (analyzed.files.length > 0) {
      log('Files:');
      for (const f of analyzed.files) {
        log(`- ${f.path} (${Buffer.byteLength(f.content, 'utf8')} bytes)`);
      }
      for (const f of analyzed.files) {
        log(`===== ${f.path} =====`);
        log('```md\n' + f.content + '\n```');
      }
    }
    return;
  }

  const tmpPath = path.join(repoRoot, '.changelog-generator-output.json');
  fs.writeFileSync(tmpPath, JSON.stringify(analyzed, null, 2));
  await apply(repoRoot, tmpPath);
  fs.rmSync(tmpPath, { force: true });
}
