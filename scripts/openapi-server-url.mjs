#!/usr/bin/env node

/**
 * Rewrite an OpenAPI spec's `servers` to a single fully-variable server URL.
 *
 * The upstream specs template the Glean-hosted shape
 * (https://{instance}-be.glean.com), but customers may also run non-Glean
 * hosted deployments — the SDKs take a full `serverUrl` for the same reason.
 * A wholly-variable server URL makes the API Explorer's base-URL field a
 * free-form input that accepts either shape.
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
      'Replace the placeholder with your Glean API server URL. Copy the ' +
      'complete Server instance (QE) value from ' +
      'https://app.glean.com/admin/about-glean. Glean-hosted deployments use ' +
      'https://{instance}-be.glean.com. How to find it: ' +
      'https://developers.glean.com/get-started/authentication#finding-your-server-url',
    variables: {
      serverUrl: {
        default: 'https://{instance-name}-be.glean.com',
        description:
          'Your Glean API server URL. Glean-hosted deployments use ' +
          'https://{instance}-be.glean.com. Custom domains are also valid. ' +
          'Find it at app.glean.com/admin/about-glean.',
      },
    },
  },
];

fs.writeFileSync(output, yaml.dump(spec, { lineWidth: -1, noRefs: true }));
console.log(`servers rewritten to {serverUrl} in ${output}`);
