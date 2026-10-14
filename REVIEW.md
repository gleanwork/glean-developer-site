# REVIEW.md

Rules for reviewing changes in this repository. People and review agents both follow this file.

## Always check

- **Generated pages stay generated.** `docs/api/**` and `docs/libraries/web-sdk/reference/` come from scripts. A hand edit there is a blocker. Changes go through the generator (`pnpm openapi:regenerate:all`, `pnpm websdk:reference:generate`), and a `@gleanwork/web-sdk` bump regenerates the reference in the same PR.
- **Managed code samples.** A code fence with a `snippet=` annotation is owned by its file under `snippets/`. Edit the file and run `pnpm snippets:sync`. Never edit the fence body.
- **Samples are correct, not only in sync.** Every code sample matches a released SDK or API version. Check the version the sample claims.
- **Built-ins first.** Pages use built-in Docusaurus components, existing CSS classes and default styles. A new custom component, new styles, or inline CSS needs a reason the built-ins cannot meet.
- **Recipes live in the cookbook.** Recipe metadata is authored in `gleanwork/glean-cookbook`, not here. Fix a recipe there.
- **The build passes.** `pnpm build` catches broken links. A PR that moves or renames a page adds a redirect.

## Flag only when

- A reader following the page would get a wrong result: a wrong command, an outdated parameter, a broken link, or a sample that does not run against the released version.
- A change contradicts another page, or the reference it links to.
- A component or style choice breaks the guidance above.

## Skip

- Generated content listed above, and `src/data/changelog.json`.
- Formatting that `pnpm format` already handles.
- Wording preferences that do not change meaning.

## Severity

- **Blocker:** a wrong or unsafe instruction, a hand edit to generated pages, a broken build, or a moved page without a redirect.
- **Should fix:** an outdated sample, a missing redirect for a renamed anchor, or a custom component where a built-in would do.
- **Nit:** anything else. Group nits together and never block on them.
