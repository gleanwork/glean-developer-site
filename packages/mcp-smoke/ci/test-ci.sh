#!/usr/bin/env bash
# Exercises summarize-results.sh and report.sh; report.sh runs against a stub
# `gh` that records its calls.
# Run: bash packages/mcp-smoke/ci/test-ci.sh
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
fails=0

pass() { echo "ok   $1"; }
fail() {
  echo "FAIL $1"
  fails=$((fails + 1))
}

# --- summarize-results.sh -------------------------------------------------

# Minimal Playwright JSON report: one spec failed on every retry, one flaked
# (failed, then passed), one passed. Only the first should be reported.
cat > "$tmp/results.json" <<'EOF'
{
  "suites": [
    {
      "title": "mcp.smoke.ts",
      "specs": [
        {
          "title": "docs_search returns developer docs results from Glean",
          "ok": false,
          "tests": [{ "results": [
            { "status": "failed", "error": { "message": "Error: first attempt" } },
            { "status": "failed", "error": { "message": "Error: SSE error: Non-200 status code (500)\n    at stack" } }
          ] }]
        },
        {
          "title": "docs_fetch returns page content",
          "ok": true,
          "tests": [{ "results": [
            { "status": "failed", "error": { "message": "Error: blip" } },
            { "status": "passed" }
          ] }]
        },
        { "title": "exposes docs_search and docs_fetch", "ok": true, "tests": [{ "results": [{ "status": "passed" }] }] }
      ]
    }
  ]
}
EOF
got="$(bash "$here/summarize-results.sh" "$tmp/results.json")"
want="docs_search returns developer docs results from Glean: Error: SSE error: Non-200 status code (500)"
if [ "$got" = "$want" ]; then pass "summary lists failed tests with their last error's first line"; else fail "summary: got '$got'"; fi

echo '{"suites":[{"specs":[{"title":"a","ok":true,"tests":[]}]}]}' > "$tmp/green.json"
got="$(bash "$here/summarize-results.sh" "$tmp/green.json")"
if [ -z "$got" ]; then pass "summary is empty when everything passed"; else fail "green summary: got '$got'"; fi

got="$(bash "$here/summarize-results.sh" "$tmp/missing.json")"
case "$got" in *"did not run"*) pass "missing report is summarized as not run" ;; *) fail "missing report: got '$got'" ;; esac

# --- report.sh ------------------------------------------------------------

# Stub gh: log every call. `issue list` prints $STUB_OPEN_ISSUE; `issue view`
# prints $STUB_LAST_REASON (what the real --jq extracts from the markers).
mkdir -p "$tmp/bin"
cat > "$tmp/bin/gh" <<'EOF'
#!/usr/bin/env bash
echo "gh $*" >> "$STUB_LOG"
case "$1 $2" in
  "issue list") printf '%s' "${STUB_OPEN_ISSUE:-}" ;;
  "issue view") printf '%s' "${STUB_LAST_REASON:-}" ;;
  "issue create" | "issue comment")
    while [ $# -gt 0 ]; do [ "$1" = "--body-file" ] && cp "$2" "$STUB_BODY"; shift; done ;;
esac
EOF
chmod +x "$tmp/bin/gh"

report() { # result open-issue reason last-reason
  : > "$tmp/log"
  rm -f "$tmp/body"
  PATH="$tmp/bin:$PATH" STUB_LOG="$tmp/log" STUB_BODY="$tmp/body" \
    STUB_OPEN_ISSUE="$2" STUB_LAST_REASON="$4" RESULT="$1" REASON="$3" \
    RUN_URL="https://example.test/run/1" MCP_URL="https://example.test/mcp" \
    bash "$here/report.sh" > /dev/null
}
called() { grep -q -- "$1" "$tmp/log"; }

crash="docs_search returns developer docs results from Glean: Error: SSE error: Non-200 status code (500)"

report failure "" "$crash" ""
if called "gh issue create"; then pass "first failure opens an issue"; else fail "first failure: $(cat "$tmp/log")"; fi
if grep -q "Runtime Logs" "$tmp/body" && grep -q "<!-- mcp-smoke-reason: $crash -->" "$tmp/body"; then
  pass "issue body names the likely cause and records the reason"
else
  fail "issue body: $(cat "$tmp/body")"
fi

report failure "42" "$crash" "$crash"
if called "gh issue view 42" && ! called "gh issue comment"; then
  pass "same failure while open does not comment"
else
  fail "same failure: $(cat "$tmp/log")"
fi

report failure "42" "exposes docs_search and docs_fetch: Error: SSE error: Non-200 status code (404)" "$crash"
if called "gh issue comment 42" && grep -q "not routed" "$tmp/body"; then
  pass "changed failure comments with the new cause"
else
  fail "changed failure: $(cat "$tmp/log")"
fi

report failure "" 'bad `tick` -- here' ""
if grep -q "<!-- mcp-smoke-reason: bad tick - here -->" "$tmp/body"; then
  pass "reason is sanitized for markdown and the HTML comment"
else
  fail "sanitize: $(grep mcp-smoke-reason "$tmp/body")"
fi

report success "42" "" ""
if called "gh issue close 42"; then pass "recovery closes the issue"; else fail "recovery: $(cat "$tmp/log")"; fi

report success "" "" ""
if called "issue (create|comment|close)"; then fail "success with no open issue should do nothing"; else pass "success with no open issue does nothing"; fi

report cancelled "" "" ""
if [ -s "$tmp/log" ]; then fail "cancelled run should not call gh"; else pass "cancelled run is ignored"; fi

exit "$fails"
