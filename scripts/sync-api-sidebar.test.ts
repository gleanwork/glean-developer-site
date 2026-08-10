import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const testDirs: string[] = [];

function createFixture(options?: { ambiguous?: boolean; unresolved?: boolean }) {
  const root = fs.mkdtempSync(path.join(process.cwd(), '.sidebar-sync-test-'));
  testDirs.push(root);
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs/api/client-api'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs/api/indexing-api'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs/api/platform-api'), { recursive: true });
  fs.mkdirSync(path.join(root, 'openapi/indexing'), { recursive: true });
  fs.mkdirSync(path.join(root, 'openapi/platform'), { recursive: true });
  fs.mkdirSync(path.join(root, 'openapi/client/split-apis'), {
    recursive: true,
  });
  fs.copyFileSync(
    path.join(process.cwd(), 'scripts/sync-api-sidebar.mjs'),
    path.join(root, 'scripts/sync-api-sidebar.mjs'),
  );
  fs.writeFileSync(
    path.join(root, 'sidebars.ts'),
    `const sidebars = [
  {
    type: 'category',
    label: 'Guides',
    items: [
      {
        type: 'category',
        label: 'Chat',
        items: [
          {
            type: 'doc',
            id: 'guides/chat/overview',
            label: 'Overview',
          },
        ],
      },
    ],
  },
  {
    type: 'category',
    label: 'Platform API Reference',
    items: [
      {
        type: 'doc',
        id: 'api/platform-api/platform-overview',
        label: 'Overview',
      },
      {
        type: 'category',
        label: 'Search',
        items: [
          {
            type: 'doc',
            id: 'api/platform-api/platform-search',
            label: 'Search',
            className: 'api-method post',
          },
        ],
      },
      {
        type: 'category',
        label: 'Skills',
        items: [
          {
            type: 'doc',
            id: 'api/platform-api/platform-skills-list',
            label: 'List skills',
            className: 'api-method get',
          },
        ],
      },
      {
        type: 'link',
        href: 'https://developers.glean.com/oas/platform',
        label: 'OpenAPI Spec',
      },
    ],
  },
];

export default sidebars;
`,
  );

  const operations = [
    ['post', '/chat', 'Chat', 'Create a chat response', 'platform-chat-create'],
    [
      'get',
      '/search/filters',
      'Search',
      'List search filters',
      'platform-search-filters',
    ],
    [
      'post',
      '/skills/import',
      'Skills',
      'Import skills from GitHub',
      'platform-skills-import',
    ],
    [
      'post',
      '/skills/sources/preview',
      'Skills',
      'Preview a GitHub skill source',
      'platform-skills-preview-source',
    ],
    [
      'patch',
      '/skills/{skill_id}',
      'Skills',
      'Update skill',
      'platform-skills-update',
    ],
    [
      'delete',
      '/skills/{skill_id}',
      'Skills',
      'Delete skill',
      'platform-skills-delete',
    ],
    [
      'post',
      '/skills/{skill_id}/sync',
      'Skills',
      'Sync a GitHub-imported skill',
      'platform-skills-sync',
    ],
  ] as const;

  for (const [method, , , summary, operationId] of operations) {
    fs.writeFileSync(
      path.join(root, `docs/api/platform-api/${operationId}.api.mdx`),
      `---
id: ${operationId}
title: "${summary}"
sidebar_label: "${summary}"
sidebar_class_name: "${method} api-method"
---
`,
    );
  }
  if (options?.unresolved) {
    fs.writeFileSync(
      path.join(root, 'docs/api/platform-api/platform-unknown.api.mdx'),
      `---
id: platform-unknown
title: "Unknown"
sidebar_label: "Unknown"
sidebar_class_name: "get api-method"
---
`,
    );
  }

  const paths = new Map<
    string,
    Array<{
      method: string;
      tag: string;
      summary: string;
      operationId: string;
    }>
  >();
  for (const [method, apiPath, tag, summary, operationId] of operations) {
    const pathOperations = paths.get(apiPath) ?? [];
    pathOperations.push({ method, tag, summary, operationId });
    paths.set(apiPath, pathOperations);
  }
  fs.writeFileSync(
    path.join(root, 'openapi/platform/platform-capitalized.yaml'),
    `openapi: 3.0.0
paths:
${[...paths.entries()]
  .map(
    ([apiPath, pathOperations]) => `  ${apiPath}:
${pathOperations
  .map(
    ({ method, tag, summary, operationId }) => `    ${method}:
      tags:
        - ${tag}
      summary: ${summary}
      operationId: ${operationId}`,
  )
  .join('\n')}`,
  )
  .join('\n')}
`,
  );
  fs.writeFileSync(
    path.join(root, 'openapi/indexing/indexing-capitalized.yaml'),
    options?.ambiguous
      ? `openapi: 3.0.0
paths:
  /conflicting:
    post:
      tags:
        - Search
      summary: Conflicting chat operation
      operationId: platform-chat-create
`
      : 'openapi: 3.0.0\npaths: {}\n',
  );

  return root;
}

function run(root: string, mode: '--check' | '--fix') {
  return spawnSync(
    process.execPath,
    [path.join(root, 'scripts/sync-api-sidebar.mjs'), mode],
    {
      cwd: root,
      encoding: 'utf8',
    },
  );
}

afterEach(() => {
  for (const dir of testDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('sync-api-sidebar', () => {
  it('inserts operationId-named Platform docs into scoped categories', () => {
    const root = createFixture();

    expect(run(root, '--check').status).toBe(1);
    const result = run(root, '--fix');
    const sidebar = fs.readFileSync(path.join(root, 'sidebars.ts'), 'utf8');

    expect(result.status).toBe(0);
    expect(sidebar).toContain("label: 'Chat'");
    expect(sidebar).toContain(
      "id: 'api/platform-api/platform-chat-create'",
    );
    expect(sidebar).toContain(
      "id: 'api/platform-api/platform-search-filters'",
    );
    for (const operation of [
      'import',
      'preview-source',
      'update',
      'delete',
      'sync',
    ]) {
      expect(sidebar).toContain(
        `id: 'api/platform-api/platform-skills-${operation}'`,
      );
    }
    expect(
      sidebar.indexOf("id: 'api/platform-api/platform-skills-list'"),
    ).toBeLessThan(
      sidebar.indexOf("id: 'api/platform-api/platform-skills-delete'"),
    );
    expect(
      sidebar.indexOf("id: 'api/platform-api/platform-chat-create'"),
    ).toBeLessThan(sidebar.indexOf("label: 'OpenAPI Spec'"));
    expect(sidebar.match(/id: 'guides\/chat\/overview'/g)).toHaveLength(1);
    expect(run(root, '--check').status).toBe(0);
  });

  it('is idempotent after inserting missing entries', () => {
    const root = createFixture();

    expect(run(root, '--fix').status).toBe(0);
    const first = fs.readFileSync(path.join(root, 'sidebars.ts'), 'utf8');
    const second = run(root, '--fix');

    expect(second.status).toBe(0);
    expect(second.stdout).toContain('already complete');
    expect(fs.readFileSync(path.join(root, 'sidebars.ts'), 'utf8')).toBe(first);
  });

  it('fails without changing sidebars when an operation is unresolved', () => {
    const root = createFixture({ unresolved: true });
    const original = fs.readFileSync(path.join(root, 'sidebars.ts'), 'utf8');

    const result = run(root, '--fix');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('platform-unknown');
    expect(fs.readFileSync(path.join(root, 'sidebars.ts'), 'utf8')).toBe(
      original,
    );
  });

  it('fails without changing sidebars when operationId tags are ambiguous', () => {
    const root = createFixture({ ambiguous: true });
    const original = fs.readFileSync(path.join(root, 'sidebars.ts'), 'utf8');

    const result = run(root, '--fix');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('platform-chat-create');
    expect(result.stderr).toContain('ambiguous');
    expect(fs.readFileSync(path.join(root, 'sidebars.ts'), 'utf8')).toBe(
      original,
    );
  });
});
