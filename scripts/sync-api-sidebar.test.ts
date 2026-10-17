import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const testDirs: string[] = [];

function createFixture(options?: {
  ambiguous?: boolean;
  camelCaseOpId?: boolean;
  preseed?: boolean;
  unresolved?: boolean;
}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sidebar-sync-test-'));
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
  fs.symlinkSync(
    process.env.SIDEBAR_TEST_NODE_MODULES ??
      path.join(process.cwd(), 'node_modules'),
    path.join(root, 'node_modules'),
    'dir',
  );
  fs.copyFileSync(
    path.join(process.cwd(), '.prettierrc.json'),
    path.join(root, '.prettierrc.json'),
  );
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
            id: 'guides/chat/chatbot-example',
            label: 'Chatbot Example',
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
          },${
            options?.preseed
              ? `
          {
            type: 'doc',
            id: 'api/platform-api/platform-search-filters',
            label: 'List search filters',
            className: 'api-method get',
          },`
              : ''
          }
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
          },${
            options?.preseed
              ? `
          {
            type: 'doc',
            id: 'api/platform-api/platform-skills-delete',
            label: 'Delete skill',
            className: 'api-method delete',
          },`
              : ''
          }
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
  fs.writeFileSync(
    path.join(root, 'docs/api/platform-api/platform-overview.mdx'),
    '---\ntitle: "Platform API Overview"\n---\n',
  );
  for (const [operationId, title, method] of [
    ['platform-search', 'Search', 'post'],
    ['platform-skills-list', 'List skills', 'get'],
  ]) {
    fs.writeFileSync(
      path.join(root, `docs/api/platform-api/${operationId}.api.mdx`),
      `---
id: ${operationId}
title: "${title}"
sidebar_label: "${title}"
sidebar_class_name: "${method} api-method"
---
`,
    );
  }

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
  if (options?.camelCaseOpId) {
    fs.writeFileSync(
      path.join(root, 'docs/api/platform-api/get-platform-thing.api.mdx'),
      `---
id: get-platform-thing
title: "Get platform thing"
sidebar_label: "Get platform thing"
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
  if (options?.camelCaseOpId) {
    paths.set('/things/{id}', [
      {
        method: 'get',
        tag: 'Search',
        summary: 'Retrieve the thing',
        operationId: 'getPlatformThing',
      },
    ]);
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

type GroupedOperation = {
  apiPath: string;
  tag: string;
  operationId: string;
  title: string;
};

const groupedOperations: GroupedOperation[] = [
  {
    apiPath: '/api/agents/search',
    tag: 'Agents',
    operationId: 'platform-agents-search',
    title: 'Search agents',
  },
  {
    apiPath: '/api/chat',
    tag: 'Chat',
    operationId: 'platform-chat-create',
    title: 'Create a chat response',
  },
  {
    apiPath: '/api/admin/agents',
    tag: 'Admin Agents',
    operationId: 'platform-admin-agents-list',
    title: 'List all agents',
  },
];

function heading(name: string) {
  return `{
        type: 'html',
        value: '${name.replace(/&/g, '&amp;')}',
        className: 'sidebar-api-group',
        customProps: { tagGroup: '${name}' },
      },`;
}

function family(label: string, operationIds: string[], tag?: string) {
  return `{
        type: 'category',
        label: '${label}',${tag ? `\n        customProps: { tag: '${tag}' },` : ''}
        items: [${operationIds
          .map(
            (id) => `
          {
            type: 'doc',
            id: 'api/platform-api/${id}',
            label: '${id}',
            className: 'api-method get',
          },`,
          )
          .join('')}
        ],
      },`;
}

function createGroupedFixture(options: {
  items: string[];
  tagGroups?: Array<[string, string[]]>;
}) {
  const root = createFixture();
  const tagGroups = options.tagGroups ?? [
    ['Agents & AI', ['Agents', 'Chat']],
    ['Administration', ['Admin Agents']],
  ];
  for (const file of fs.readdirSync(path.join(root, 'docs/api/platform-api'))) {
    if (file.endsWith('.api.mdx')) {
      fs.rmSync(path.join(root, 'docs/api/platform-api', file));
    }
  }
  for (const { operationId, title } of groupedOperations) {
    fs.writeFileSync(
      path.join(root, `docs/api/platform-api/${operationId}.api.mdx`),
      `---
id: ${operationId}
title: "${title}"
sidebar_label: "${title}"
sidebar_class_name: "get api-method"
---
`,
    );
  }
  fs.writeFileSync(
    path.join(root, 'openapi/platform/platform-capitalized.yaml'),
    `openapi: 3.1.0
x-tagGroups:
${tagGroups
  .map(
    ([name, tags]) =>
      `  - name: ${name}\n    tags:\n${tags.map((tag) => `      - ${tag}`).join('\n')}`,
  )
  .join('\n')}
paths:
${groupedOperations
  .map(
    ({ apiPath, tag, operationId, title }) => `  ${apiPath}:
    get:
      tags:
        - ${tag}
      summary: ${title}
      operationId: ${operationId}`,
  )
  .join('\n')}
`,
  );
  fs.writeFileSync(
    path.join(root, 'sidebars.ts'),
    `const sidebars = [
  {
    type: 'category',
    label: 'Platform API Reference',
    items: [
      ${options.items.join('\n      ')}
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
    const original = fs.readFileSync(path.join(root, 'sidebars.ts'), 'utf8');
    const platformMarker = "    label: 'Platform API Reference',";
    const guides = original.slice(0, original.indexOf(platformMarker));

    expect(run(root, '--check').status).toBe(1);
    const result = run(root, '--fix');
    const sidebar = fs.readFileSync(path.join(root, 'sidebars.ts'), 'utf8');

    expect(result.status).toBe(0);
    expect(sidebar.match(/label: 'Chat'/g)).toHaveLength(2);
    expect(sidebar.slice(0, sidebar.indexOf(platformMarker))).toBe(guides);
    expect(sidebar).toContain("id: 'api/platform-api/platform-chat-create'");
    expect(sidebar).toContain("id: 'api/platform-api/platform-search-filters'");
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
      sidebar.indexOf("id: 'api/platform-api/platform-search'"),
    ).toBeLessThan(
      sidebar.indexOf("id: 'api/platform-api/platform-search-filters'"),
    );
    expect(
      sidebar.indexOf("id: 'api/platform-api/platform-skills-list'"),
    ).toBeLessThan(
      sidebar.indexOf("id: 'api/platform-api/platform-skills-delete'"),
    );
    const skillPositions = [
      'platform-skills-list',
      'platform-skills-delete',
      'platform-skills-import',
      'platform-skills-preview-source',
      'platform-skills-sync',
      'platform-skills-update',
    ].map((id) => sidebar.indexOf(`id: 'api/platform-api/${id}'`));
    expect(skillPositions).toEqual([...skillPositions].sort((a, b) => a - b));
    expect(sidebar).toMatch(
      /label: 'Chat',[\s\S]*?id: 'api\/platform-api\/platform-chat-create',[\s\S]*?\n {10}\},\n {8}\],\n {6}\},\n {6}\{\n {8}type: 'link',\n {8}href: 'https:\/\/developers\.glean\.com\/oas\/platform',\n {8}label: 'OpenAPI Spec',/,
    );
    expect(sidebar.match(/id: 'guides\/chat\/chatbot-example'/g)).toHaveLength(
      1,
    );
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

  it('resolves camelCase operationIds to kebab-case doc basenames', () => {
    const root = createFixture({ camelCaseOpId: true });

    expect(run(root, '--fix').status).toBe(0);
    const sidebar = fs.readFileSync(path.join(root, 'sidebars.ts'), 'utf8');

    expect(sidebar).toContain("id: 'api/platform-api/get-platform-thing'");
    expect(
      sidebar.indexOf("id: 'api/platform-api/platform-search'"),
    ).toBeLessThan(
      sidebar.indexOf("id: 'api/platform-api/get-platform-thing'"),
    );
  });

  it('does not duplicate Platform entries already present in the sidebar', () => {
    const root = createFixture({ preseed: true });

    expect(run(root, '--fix').status).toBe(0);
    const sidebar = fs.readFileSync(path.join(root, 'sidebars.ts'), 'utf8');

    for (const id of [
      'platform-chat-create',
      'platform-search-filters',
      'platform-skills-import',
      'platform-skills-preview-source',
      'platform-skills-update',
      'platform-skills-delete',
      'platform-skills-sync',
    ]) {
      expect(
        sidebar.match(new RegExp(`id: 'api/platform-api/${id}'`, 'g')),
      ).toHaveLength(1);
    }
  });

  it('inserts Client docs into the scoped reference category with a linked overview', () => {
    const root = createFixture();
    const sidebarPath = path.join(root, 'sidebars.ts');
    fs.writeFileSync(
      sidebarPath,
      fs.readFileSync(sidebarPath, 'utf8').replace(
        '\n];',
        `
  {
    type: 'category',
    label: 'Client API Reference',
    items: [
      {
        type: 'category',
        label: 'Chat',
        link: {
          type: 'doc',
          id: 'api/client-api/chat/overview',
        },
        items: [],
      },
    ],
  },
];`,
      ),
    );
    fs.mkdirSync(path.join(root, 'docs/api/client-api/chat'), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(root, 'docs/api/client-api/chat/overview.mdx'),
      '---\ntitle: "Chat"\n---\n',
    );
    fs.writeFileSync(
      path.join(root, 'docs/api/client-api/chat/create.api.mdx'),
      `---
title: "Create chat"
sidebar_label: "Create chat"
sidebar_class_name: "post api-method"
---
`,
    );
    fs.writeFileSync(
      path.join(root, 'openapi/client/split-apis/chat.yaml'),
      `openapi: 3.0.0
paths:
  /chat:
    post:
      tags:
        - Chat
      summary: Create chat
      operationId: create
`,
    );

    expect(run(root, '--fix').status).toBe(0);
    const sidebar = fs.readFileSync(sidebarPath, 'utf8');

    expect(sidebar).toContain("id: 'api/client-api/chat/create'");
    expect(sidebar.indexOf("id: 'api/client-api/chat/overview'")).toBeLessThan(
      sidebar.indexOf("id: 'api/client-api/chat/create'"),
    );
  });

  it('inserts Indexing docs into Indexing API Reference when guide labels overlap', () => {
    const root = createFixture();
    const sidebarPath = path.join(root, 'sidebars.ts');
    fs.writeFileSync(
      sidebarPath,
      fs.readFileSync(sidebarPath, 'utf8').replace(
        '\n];',
        `
  {
    type: 'category',
    label: 'Indexing API',
    items: [
      {
        type: 'category',
        label: 'Guides',
        items: [
          {
            type: 'category',
            label: 'Custom Metadata',
            items: [],
          },
        ],
      },
      {
        type: 'category',
        label: 'Indexing API Reference',
        items: [
          {
            type: 'category',
            label: 'Custom Metadata',
            items: [],
          },
        ],
      },
    ],
  },
];`,
      ),
    );
    fs.writeFileSync(
      path.join(root, 'docs/api/indexing-api/update-metadata.api.mdx'),
      `---
title: "Update metadata"
sidebar_label: "Update metadata"
sidebar_class_name: "put api-method"
---
`,
    );
    fs.writeFileSync(
      path.join(root, 'openapi/indexing/indexing-capitalized.yaml'),
      `openapi: 3.0.0
paths:
  /metadata:
    put:
      tags:
        - Custom Metadata
      summary: Update metadata
      operationId: update-metadata
`,
    );

    expect(run(root, '--fix').status).toBe(0);
    const sidebar = fs.readFileSync(sidebarPath, 'utf8');
    const referenceStart = sidebar.indexOf("label: 'Indexing API Reference'");
    const inserted = sidebar.indexOf("id: 'api/indexing-api/update-metadata'");

    expect(referenceStart).toBeGreaterThan(-1);
    expect(inserted).toBeGreaterThan(referenceStart);
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

describe('Platform API tag groups', () => {
  const groupedItems = [
    heading('Agents & AI'),
    family('Agents', ['platform-agents-search']),
    family('Chat', ['platform-chat-create']),
    heading('Administration'),
    family('Agents', ['platform-admin-agents-list'], 'Admin Agents'),
  ];

  it('passes --check when families follow x-tagGroups', () => {
    const root = createGroupedFixture({ items: groupedItems });

    const result = run(root, '--check');

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  it('fails --check when a family sits under the wrong heading', () => {
    const root = createGroupedFixture({
      items: [
        heading('Agents & AI'),
        family('Agents', ['platform-agents-search']),
        heading('Administration'),
        family('Chat', ['platform-chat-create']),
        family('Agents', ['platform-admin-agents-list'], 'Admin Agents'),
      ],
    });

    const result = run(root, '--check');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "Platform family 'Chat' (tag 'Chat') belongs under 'Agents & AI', but sits under 'Administration'",
    );
  });

  it('fails --check when an operation sits in another tag family', () => {
    const root = createGroupedFixture({
      items: [
        heading('Agents & AI'),
        family('Agents', [
          'platform-agents-search',
          'platform-admin-agents-list',
        ]),
        family('Chat', ['platform-chat-create']),
        heading('Administration'),
      ],
    });

    const result = run(root, '--check');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "'api/platform-api/platform-admin-agents-list' has tag 'Admin Agents', but sits in Platform family 'Agents' (tag 'Agents')",
    );
  });

  it('fails --check when an operation tag is not in x-tagGroups', () => {
    const root = createGroupedFixture({
      items: groupedItems,
      tagGroups: [
        ['Agents & AI', ['Agents']],
        ['Administration', ['Admin Agents']],
      ],
    });

    const result = run(root, '--check');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "Platform tag 'Chat' is used by an operation but is not in any x-tagGroups entry",
    );
  });

  it('fails --check when headings are out of x-tagGroups order', () => {
    const root = createGroupedFixture({
      items: [
        heading('Administration'),
        family('Agents', ['platform-admin-agents-list'], 'Admin Agents'),
        heading('Agents & AI'),
        family('Agents', ['platform-agents-search']),
        family('Chat', ['platform-chat-create']),
      ],
    });

    const result = run(root, '--check');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "Platform heading 'Agents & AI' is out of order",
    );
  });

  it('--fix inserts a new family in alphabetical order within its tag group', () => {
    const root = createGroupedFixture({
      tagGroups: [
        ['Agents & AI', ['Agents', 'Chat', 'Skills']],
        ['Administration', ['Admin Agents']],
      ],
      items: [
        heading('Agents & AI'),
        family('Agents', ['platform-agents-search']),
        family('Skills', []),
        heading('Administration'),
        family('Agents', ['platform-admin-agents-list'], 'Admin Agents'),
      ],
    });

    const result = run(root, '--fix');
    const sidebar = fs.readFileSync(path.join(root, 'sidebars.ts'), 'utf8');

    expect(result.status).toBe(0);
    const chat = sidebar.indexOf("label: 'Chat'");
    expect(chat).toBeGreaterThan(
      sidebar.indexOf("id: 'api/platform-api/platform-agents-search'"),
    );
    expect(chat).toBeLessThan(sidebar.indexOf("label: 'Skills'"));
  });

  it('--fix inserts a new family at the end of its tag group', () => {
    const root = createGroupedFixture({
      items: [
        heading('Agents & AI'),
        family('Agents', ['platform-agents-search']),
        heading('Administration'),
        family('Agents', ['platform-admin-agents-list'], 'Admin Agents'),
      ],
    });

    const result = run(root, '--fix');
    const sidebar = fs.readFileSync(path.join(root, 'sidebars.ts'), 'utf8');

    expect(result.status).toBe(0);
    const userAgents = sidebar.indexOf(
      "id: 'api/platform-api/platform-agents-search'",
    );
    const chat = sidebar.indexOf("label: 'Chat'");
    const administration = sidebar.indexOf("tagGroup: 'Administration'");
    expect(chat).toBeGreaterThan(userAgents);
    expect(chat).toBeLessThan(administration);
    expect(sidebar).toContain("id: 'api/platform-api/platform-chat-create'");
    expect(run(root, '--check').status).toBe(0);
  });

  it('--fix routes an operation to the family with its customProps.tag', () => {
    const root = createGroupedFixture({
      items: [
        heading('Agents & AI'),
        family('Agents', ['platform-agents-search']),
        family('Chat', ['platform-chat-create']),
        heading('Administration'),
        family('Agents', [], 'Admin Agents'),
      ],
    });

    const result = run(root, '--fix');
    const sidebar = fs.readFileSync(path.join(root, 'sidebars.ts'), 'utf8');

    expect(result.status).toBe(0);
    expect(
      sidebar.indexOf("id: 'api/platform-api/platform-admin-agents-list'"),
    ).toBeGreaterThan(sidebar.indexOf("tag: 'Admin Agents'"));
    expect(run(root, '--check').status).toBe(0);
  });
});

describe('production API reference ordering', () => {
  it('keeps Platform API reference families alphabetized within each tag group', () => {
    const sidebar = fs.readFileSync(
      path.join(process.cwd(), 'sidebars.ts'),
      'utf8',
    );
    const referenceStart = sidebar.indexOf("label: 'Platform API Reference'");
    const referenceEnd = sidebar.indexOf("label: 'Client API'", referenceStart);
    const reference = sidebar.slice(referenceStart, referenceEnd);
    const groups: string[][] = [[]];
    for (const [, isHeading, label] of reference.matchAll(
      /^(?:\s{14}label|\s{16}(tagGroup)): '([^']+)'/gm,
    )) {
      if (isHeading) {
        groups.push([]);
      } else if (label !== 'OpenAPI Spec') {
        groups[groups.length - 1].push(label);
      }
    }

    expect(groups.length).toBeGreaterThan(1);
    for (const labels of groups) {
      expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
    }
  });
});
