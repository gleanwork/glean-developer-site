import { inject } from '@vercel/analytics';
import { redactEvent } from '@site/src/lib/analytics';

// Production builds only, matching @docusaurus/plugin-vercel-analytics, which
// this replaces. inject() is a no-op during server rendering.
if (process.env.NODE_ENV === 'production') {
  inject({ mode: 'production', beforeSend: redactEvent });
}
