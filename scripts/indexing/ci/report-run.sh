#!/usr/bin/env bash
# Track the nightly devdocs indexing run in a GitHub issue.
#
#   failure  -> open an issue, or comment on the one already open
#   success  -> close the open issue, if any
#
# One issue per outage: repeated nightly failures comment on it instead of
# opening a new one, so a broken token does not mean 30 issues a month.
#
# Required environment:
#   GH_TOKEN, GH_REPO   used by the gh CLI
#   RESULT              needs.<job>.result: success | failure | cancelled | skipped
#   RUN_URL             link to this workflow run
#   FAILED_STEP         name of the first failed step (may be empty)
set -euo pipefail

LABEL="indexing-failure"
TITLE="Nightly developer docs indexing is failing"

case "$RESULT" in
  success | failure) ;;
  *)
    echo "Run result is '$RESULT'; nothing to report."
    exit 0
    ;;
esac

open_issue="$(gh issue list --label "$LABEL" --state open --limit 1 --json number --jq '.[0].number // empty')"

if [ "$RESULT" = "success" ]; then
  if [ -n "$open_issue" ]; then
    gh issue close "$open_issue" --comment "Indexing recovered: $RUN_URL"
    echo "Closed #$open_issue"
  else
    echo "Indexing succeeded; no open issue."
  fi
  exit 0
fi

step="${FAILED_STEP:-unknown step}"
case "$step" in
  "Check Glean credentials")
    cause="Glean rejected the credentials. The usual cause is an expired \`GLEAN_INDEXING_API_TOKEN\`; also check \`GLEAN_SERVER_URL\` is the full backend URL (\`https://<instance>-be.glean.com\`)."
    ;;
  "Test connector against the build (mocked Glean)")
    cause="The connector failed against the site build with Glean mocked, so nothing was uploaded. Check the build output (\`build/mcp/docs.json\`) and the minimum page-count guard."
    ;;
  "Build site")
    cause="The site build failed, so there was nothing to index."
    ;;
  "Configure datasource" | "Index documents" | "Force reindex")
    cause="The upload to Glean failed. See the step log for the API error."
    ;;
  *)
    cause="See the run log."
    ;;
esac

if [ -n "$open_issue" ]; then
  gh issue comment "$open_issue" --body "Still failing at **$step**: $RUN_URL"
  echo "Commented on #$open_issue"
  exit 0
fi

gh label create "$LABEL" --color B60205 \
  --description "Nightly devdocs indexing workflow is failing" 2>/dev/null || true

body_file="$(mktemp)"
cat > "$body_file" <<EOF
The scheduled **Index Developer Docs** workflow failed, so developers.glean.com is not being re-indexed into the \`devdocs\` datasource.

- **Run:** $RUN_URL
- **Failed step:** $step
- **Likely cause:** $cause

Re-run with \`dry_run: true\` from the Actions tab to check a fix without uploading anything. This issue gets a comment on each further failure and closes itself after the next successful nightly run.
EOF

gh issue create --title "$TITLE" --label "$LABEL" --body-file "$body_file"
