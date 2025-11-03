import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { spawnSync } from 'node:child_process';

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
    const res = spawnSync(bin, ['diff', '--format', 'json', baseFile, headFile], {
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: false,
            encoding: 'utf8',
        });

        if (res.status !== 0) {
            return null;
        }

        const out = (res.stdout || '').toString();
        if (!out.trim()) return null;
        try {
            return JSON.parse(out);
        } catch {
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


