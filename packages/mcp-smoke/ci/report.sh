#!/usr/bin/env bash
# Track the scheduled /mcp smoke check in a GitHub issue.
#
#   failure  -> open an issue; while it is open, comment only when the reason
#               changes (the check runs hourly, and an outage should not mean a
#               comment every hour)
#   success  -> close the open issue, if any
#
# Required environment:
#   GH_TOKEN, GH_REPO   used by the gh CLI
#   RESULT              needs.<job>.result: success | failure | cancelled | skipped
#   RUN_URL             link to this workflow run
#   MCP_URL             the endpoint that was checked
#   REASON              failure summary from summarize-results.sh (may be empty)
set -euo pipefail

LABEL="mcp-failure"
TITLE="developers.glean.com /mcp is failing"

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
    gh issue close "$open_issue" --comment "/mcp recovered: $RUN_URL"
    echo "Closed #$open_issue"
  else
    echo "/mcp is healthy; no open issue."
  fi
  exit 0
fi

# Backticks would break the inline code span below. The HTML-comment copy
# also drops newlines and "--", which would end the comment early.
reason="$(printf '%s' "${REASON:-unknown failure; see the run log}" | tr -d '`' | cut -c1-600)"
marker_reason="$(printf '%s' "$reason" | tr '\n' ' ' | sed 's/--/-/g')"
marker="<!-- mcp-smoke-reason: $marker_reason -->"

case "$reason" in
  *"Non-200 status code (500)"* | *"FUNCTION_INVOCATION_FAILED"*)
    cause="The Vercel function is crashing, often on startup. Open the failing deployment's **Runtime Logs** in Vercel and filter on \`/api/mcp\`."
    ;;
  *"Non-200 status code (404)"*)
    cause="\`/mcp\` is not routed. Check the \`/mcp\` rewrite in \`vercel.json\` and that \`api/mcp.ts\` was deployed."
    ;;
  *"(401)"* | *"(403)"* | *"GLEAN_API_TOKEN"* | *"GLEAN_SERVER_URL"*)
    cause="Glean rejected or is missing credentials. Check \`GLEAN_API_TOKEN\` (a Client API token) and \`GLEAN_SERVER_URL\` in the Vercel project's environment variables."
    ;;
  *"docs_search returns"* | *"docs_fetch returns"*)
    cause="The server is up but search is failing, so the request to Glean is the likely problem. Check the Vercel Runtime Logs for the Glean API error, then \`GLEAN_API_TOKEN\` and \`GLEAN_SERVER_URL\`."
    ;;
  *"did not run"*)
    cause="The check itself broke before reaching \`/mcp\` (install or setup). See the run log."
    ;;
  *)
    cause="See the run log."
    ;;
esac

if [ -n "$open_issue" ]; then
  last="$(gh issue view "$open_issue" --json body,comments \
    --jq '[.body, .comments[].body] | map(capture("<!-- mcp-smoke-reason: (?<r>.*?) -->").r) | last // ""')"
  if [ "$last" = "$marker_reason" ]; then
    echo "#$open_issue already reports this failure; not commenting."
    exit 0
  fi
  body_file="$(mktemp)"
  cat > "$body_file" <<EOF
Still failing, with a different error: \`$reason\`

- **Run:** $RUN_URL
- **Likely cause:** $cause

$marker
EOF
  gh issue comment "$open_issue" --body-file "$body_file"
  echo "Commented on #$open_issue"
  exit 0
fi

gh label create "$LABEL" --color B60205 \
  --description "Scheduled /mcp smoke check is failing" 2>/dev/null || true

body_file="$(mktemp)"
cat > "$body_file" <<EOF
The scheduled **MCP Smoke Test** workflow failed against \`$MCP_URL\`, so agents using the developer docs MCP server are likely getting errors.

- **Run:** $RUN_URL
- **Failure:** \`$reason\`
- **Likely cause:** $cause

The check runs hourly and retries each test twice before failing. This issue gets a comment only when the error changes, and closes itself after the next passing run. To check a fix, run the workflow from the Actions tab, optionally with a preview deployment's \`/mcp\` URL.

$marker
EOF

gh issue create --title "$TITLE" --label "$LABEL" --body-file "$body_file"
