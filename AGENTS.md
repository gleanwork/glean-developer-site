# AGENTS Instructions

This repository contains a Docusaurus website built with Node.js and pnpm.

## Environment

Versions of tools are handled transparently by mise. No need to manage tool versions explicitly.

Use `pnpm install` to install dependencies locally.

## Programmatic Checks

AVOID RUNNING `pnpm start` - this causes very slow build times, and will interupt the agent workflow.

- Run `pnpm build` to ensure the site builds successfully.
- Formatting is handled by Prettier. Run `pnpm format` to apply the project's style (single quotes and trailing commas).
- Test with `pnpm test`. This will execute `vitest run`. Always execute in run mode (using `pnpm test`) to avoid getting stuck.

## Content Guidelines

- Prefer built-in Docusaurus components when creating pages or examples.
  Custom React components should only be added when a built-in component
  cannot achieve the desired result.
- Prefer default styles rather than creating new ones. Leverage existing CSS classes first, either from infima or via custom defined classes
- Avoid inline CSS styles
