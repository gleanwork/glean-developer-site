#!/usr/bin/env bash
# Exercises report-run.sh against a stub `gh` that records its calls.
# Run: bash scripts/indexing/ci/test-report-run.sh
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# Stub gh: log every call; `issue list` prints $STUB_OPEN_ISSUE (or nothing).
mkdir -p "$tmp/bin"
cat > "$tmp/bin/gh" <<'EOF'
#!/usr/bin/env bash
echo "gh $*" >> "$STUB_LOG"
if [ "$1 $2" = "issue list" ]; then printf '%s' "${STUB_OPEN_ISSUE:-}"; fi
if [ "$1 $2" = "issue create" ]; then
  while [ $# -gt 0 ]; do [ "$1" = "--body-file" ] && cp "$2" "$STUB_BODY"; shift; done
fi
EOF
chmod +x "$tmp/bin/gh"

fails=0
run_case() {
  local name="$1" result="$2" open="$3" step="$4" expect="$5"
  : > "$tmp/log"
  PATH="$tmp/bin:$PATH" STUB_LOG="$tmp/log" STUB_BODY="$tmp/body" \
    STUB_OPEN_ISSUE="$open" RESULT="$result" FAILED_STEP="$step" \
    RUN_URL="https://example.test/run/1" bash "$here/report-run.sh" > /dev/null
  if grep -q -- "$expect" "$tmp/log"; then
    echo "ok   $name"
  else
    echo "FAIL $name: expected a call matching '$expect', got:"
    sed 's/^/       /' "$tmp/log"
    fails=$((fails + 1))
  fi
}

run_case "first failure opens an issue" failure "" "Check Glean credentials" "gh issue create"
if grep -q "expired \`GLEAN_INDEXING_API_TOKEN\`" "$tmp/body"; then
  echo "ok   issue body names the likely cause"
else
  echo "FAIL issue body missing cause"
  fails=$((fails + 1))
fi
run_case "repeat failure comments instead" failure "42" "Index documents" "gh issue comment 42"
run_case "recovery closes the issue" success "42" "" "gh issue close 42"

: > "$tmp/log"
PATH="$tmp/bin:$PATH" STUB_LOG="$tmp/log" STUB_OPEN_ISSUE="" RESULT=success RUN_URL=x \
  bash "$here/report-run.sh" > /dev/null
if grep -q -E "issue (create|comment|close)" "$tmp/log"; then
  echo "FAIL success with no open issue should do nothing"; fails=$((fails + 1))
else
  echo "ok   success with no open issue does nothing"
fi

: > "$tmp/log"
PATH="$tmp/bin:$PATH" STUB_LOG="$tmp/log" RESULT=cancelled RUN_URL=x \
  bash "$here/report-run.sh" > /dev/null
if [ -s "$tmp/log" ]; then
  echo "FAIL cancelled run should not call gh"; fails=$((fails + 1))
else
  echo "ok   cancelled run is ignored"
fi

exit "$fails"
