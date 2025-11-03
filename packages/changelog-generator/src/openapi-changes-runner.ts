import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const dbg: any = require('debug');
const dbgOpenApiChanges = dbg('changelog:openapi-changes');

export type OpenApiChangesResult = any;

export function runOpenApiChanges(
    baseSpecYaml: string,
    headSpecYaml: string,
    binPath?: string,
): OpenApiChangesResult | null {
    const bin = binPath && binPath.length > 0 ? binPath : 'openapi-changes';

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openapi-changes-'));
    const baseFile = path.join(tmpDir, 'base.yaml');
    const headFile = path.join(tmpDir, 'head.yaml');
    fs.writeFileSync(baseFile, baseSpecYaml);
    fs.writeFileSync(headFile, headSpecYaml);

    try {
        const res = spawnSync(bin, ['--format=json', baseFile, headFile], {
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: false,
            encoding: 'utf8',
        });

        if (res.error) {
            dbgOpenApiChanges('binary execution error: %s (bin=%s)', res.error.message, bin);
            if ((res.error as any).code === 'ENOENT') {
                dbgOpenApiChanges('binary not found on PATH. Install @pb33f/openapi-changes or set CHANGELOG_OPENAPI_DIFF_BIN');
            }
            return null;
        }

        if (res.status !== 0) {
            const stderr = (res.stderr || '').toString().trim();
            if (stderr) {
                dbgOpenApiChanges('binary exited with status %d: %s', res.status, stderr);
            } else {
                dbgOpenApiChanges('binary exited with status %d (no stderr output)', res.status);
            }
            return null;
        }

        const out = (res.stdout || '').toString();
        if (!out.trim()) {
            dbgOpenApiChanges('binary returned empty output');
            return null;
        }
        try {
            return JSON.parse(out);
        } catch (e) {
            dbgOpenApiChanges('failed to parse JSON output: %s', (e as Error).message);
            return null;
        }
    } finally {
        try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch {
            // ignore cleanup errors
        }
    }
}


