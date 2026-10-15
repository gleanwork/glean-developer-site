import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import * as yaml from 'js-yaml';
import {
  extractPlatformEndpoints,
  familyKey,
  serializePlatformEndpoints,
} from './platform-endpoints-lib';

const PREFIX = 'api/platform-api';
const REPO_ROOT = path.resolve(__dirname, '..');

function loadSpec(spec: string) {
  return yaml.load(spec) as any;
}

describe('familyKey', () => {
  it.each([
    ['Agents', 'agents'],
    ['IdP Groups', 'idp-groups'],
    ['Usage & Billing', 'usage-billing'],
  ])('slugs %s as %s', (tag, key) => {
    expect(familyKey(tag)).toBe(key);
  });
});

describe('extractPlatformEndpoints', () => {
  it('groups operations by their first tag, in spec order', () => {
    const spec = loadSpec(`
openapi: "3.0.0"
info: { title: Test, version: "1" }
paths:
  /api/agents/search:
    post:
      operationId: platform-agents-search
      summary: Search agents
      tags: [Agents]
  /api/admin/idp-groups:
    get:
      operationId: platform-admin-idp-groups-list
      summary: List IdP groups
      tags: [IdP Groups]
  /api/agents/{agent_id}:
    get:
      operationId: platform-agents-get
      summary: Get agent
      tags: [Agents, Admin]
`);

    expect(extractPlatformEndpoints(spec, PREFIX)).toEqual({
      families: {
        agents: {
          tag: 'Agents',
          endpoints: [
            {
              method: 'POST',
              path: '/api/agents/search',
              summary: 'Search agents',
              docId: 'api/platform-api/platform-agents-search',
            },
            {
              method: 'GET',
              path: '/api/agents/{agent_id}',
              summary: 'Get agent',
              docId: 'api/platform-api/platform-agents-get',
            },
          ],
        },
        'idp-groups': {
          tag: 'IdP Groups',
          endpoints: [
            {
              method: 'GET',
              path: '/api/admin/idp-groups',
              summary: 'List IdP groups',
              docId: 'api/platform-api/platform-admin-idp-groups-list',
            },
          ],
        },
      },
    });
  });

  it('skips untagged operations and non-method path keys', () => {
    const spec = loadSpec(`
openapi: "3.0.0"
info: { title: Test, version: "1" }
paths:
  /api/search:
    parameters: []
    post:
      operationId: platform-search
      summary: Search
  /api/users:
    get:
      operationId: platform-users-list
      summary: List users
      tags: [Users]
`);

    const { families } = extractPlatformEndpoints(spec, PREFIX);
    expect(Object.keys(families)).toEqual(['users']);
    expect(families.users.endpoints).toHaveLength(1);
  });
});

describe('src/data/platform-endpoints.json', () => {
  it('matches the committed Platform spec (run `pnpm generate:platform-endpoints`)', () => {
    const spec = yaml.load(
      fs.readFileSync(
        path.join(REPO_ROOT, 'openapi/platform/platform-capitalized.yaml'),
        'utf8',
      ),
    ) as any;
    const committed = fs.readFileSync(
      path.join(REPO_ROOT, 'src/data/platform-endpoints.json'),
      'utf8',
    );

    expect(JSON.parse(committed)).toEqual(
      JSON.parse(
        serializePlatformEndpoints(extractPlatformEndpoints(spec, PREFIX)),
      ),
    );
  });

  it('has an overview page for every family that renders its endpoints', () => {
    const { families } = JSON.parse(
      fs.readFileSync(
        path.join(REPO_ROOT, 'src/data/platform-endpoints.json'),
        'utf8',
      ),
    );
    const docsDir = path.join(REPO_ROOT, 'docs/api/platform-api');

    const howTo =
      'See "Platform API family overview pages" in AGENTS.md; ' +
      'search-overview.mdx is the reference example.';

    for (const [key, family] of Object.entries<{ tag: string }>(families)) {
      const file = `docs/api/platform-api/${key}-overview.mdx`;
      const page = path.join(docsDir, `${key}-overview.mdx`);

      expect(
        fs.existsSync(page),
        `The spec has a "${family.tag}" tag but ${file} does not exist. ${howTo}`,
      ).toBe(true);

      const source = fs.readFileSync(page, 'utf8');
      expect(
        source.includes('<ApiOverview') &&
          source.includes(`apiFamily="${key}"`) &&
          source.includes('apiType="platform-api"'),
        `${file} must render <ApiOverview apiFamily="${key}" apiType="platform-api" />. ${howTo}`,
      ).toBe(true);
    }
  });
});
