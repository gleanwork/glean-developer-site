#!/usr/bin/env node

/**
 * Rewrite an OpenAPI spec's `servers` to a single fully-variable server URL.
 *
 * The upstream specs template a Glean-hosted hostname shape, but a tenant's
 * server URL is an opaque HTTPS origin and may use a vanity or custom domain.
 * A wholly-variable server URL makes the API Explorer's base-URL field a
 * free-form input without implying a particular deployment hostname.
 *
 * Usage: node openapi-server-url.mjs spec.yaml [output.yaml]
 */

import fs from 'fs';
import yaml from 'js-yaml';

const [input, output = input] = process.argv.slice(2);

if (!input) {
  console.error('Usage: node openapi-server-url.mjs spec.yaml [output.yaml]');
  process.exit(1);
}

const spec = yaml.load(fs.readFileSync(input, 'utf8'));

spec.servers = [
  {
    url: '{serverUrl}',
    description:
      'Replace {serverUrl} with your complete Glean API server URL. Find it at ' +
      'https://developers.glean.com/get-started/authentication#finding-your-server-url.',
    variables: {
      serverUrl: {
        default: '{serverUrl}',
        description:
          'Your complete Glean API HTTPS origin. Glean-hosted, vanity, custom, ' +
          'and non-Glean-hosted domains are supported.',
      },
    },
  },
];

fs.writeFileSync(output, yaml.dump(spec, { lineWidth: -1, noRefs: true }));
console.log(`servers rewritten to {serverUrl} in ${output}`);
