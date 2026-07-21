// Set before initializing the SDK
process.env.X_GLEAN_INCLUDE_EXPERIMENTAL = 'true';

import { Glean } from '@gleanwork/api-client';

const glean = new Glean({
  apiToken: process.env['GLEAN_API_TOKEN'] ?? '',
  serverURL: 'https://your-instance-be.glean.com',
});
