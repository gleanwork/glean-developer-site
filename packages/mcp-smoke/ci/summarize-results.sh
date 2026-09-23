#!/usr/bin/env bash
# Print a one-line summary of the failed smoke tests in a Playwright JSON
# report: "<test>: <first line of its last error>", joined with "; ".
#
# The summary goes into the alert issue and decides whether a failure is new
# (see report.sh), so it has to stay the same across runs of one outage:
# first error lines only, no stacks or timings.
#
# Usage: summarize-results.sh <results.json>
# Prints nothing when every test passed. A missing or unreadable report means
# the tests never ran, and that is summarized as such.
set -euo pipefail

results="${1:?usage: summarize-results.sh <results.json>}"

if [ ! -s "$results" ] || ! jq -e . "$results" > /dev/null 2>&1; then
  echo "smoke tests did not run (no Playwright report); see the run log"
  exit 0
fi

jq -r '
  [ .. | objects | select(has("specs")) | .specs[]
    | select(.ok == false)
    | "\(.title): \(
        [.tests[].results[-1].error.message // empty][0] // "no error message"
        | split("\n")[0]
      )"
  ] | unique | join("; ")
' "$results"
