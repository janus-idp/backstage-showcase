#!/bin/bash
#
# Runs the plugin-sanity job on the newest release branches that carry the
# harness, each on its own ref, so every release index is checked against the
# backend it ships with. GitHub only fires `schedule` on the default branch,
# so main's scheduled run calls this.
#
# Waits for every dispatched run and exits non-zero if any of them failed.
#
# Usage (GH_TOKEN needs actions:write on the repository):
#   GITHUB_REPOSITORY=owner/repo ./e2e-tests/local-harness/dispatch-release-plugin-sanity.sh [count]
set -euo pipefail

: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
RELEASE_COUNT="${1:-2}"
WORKFLOW="e2e-cluster-free.yaml"
HARNESS_MARKER="e2e-tests/local-harness/populate-catalog-index.sh"
SUMMARY="${GITHUB_STEP_SUMMARY:-/dev/null}"

# Only a 404 means "no harness"; any other API error must fail the job rather
# than read as "nothing to check".
has_harness() {
  local out
  out=$(gh api "repos/${GITHUB_REPOSITORY}/contents/${HARNESS_MARKER}?ref=$1" --silent 2>&1) && return 0
  [[ "${out}" == *"HTTP 404"* ]] && return 1
  echo "${out}" >&2
  exit 1
}

all_branches=$(gh api --paginate "repos/${GITHUB_REPOSITORY}/branches" --jq '.[].name')
mapfile -t candidates < <(grep -E '^release-[0-9]+\.[0-9]+$' <<< "${all_branches}" | sort -rV)

branches=()
for branch in "${candidates[@]}"; do
  # Branches older than the harness have nothing to run; the list is sorted
  # newest first, so the first one without it ends the search.
  has_harness "${branch}" || break
  branches+=("${branch}")
  ((${#branches[@]} < RELEASE_COUNT)) || break
done

if ((${#branches[@]} == 0)); then
  echo "No release branch carries ${HARNESS_MARKER}; nothing to dispatch."
  exit 0
fi

declare -A run_ids
for branch in "${branches[@]}"; do
  run_ids[${branch}]=$(gh api -X POST "repos/${GITHUB_REPOSITORY}/actions/workflows/${WORKFLOW}/dispatches" \
    -f ref="${branch}" -F return_run_details=true --jq '.workflow_run_id')
  echo "Dispatched plugin-sanity on ${branch}: https://github.com/${GITHUB_REPOSITORY}/actions/runs/${run_ids[${branch}]}"
done

echo "### Release plugin-sanity" >> "${SUMMARY}"
failed=0
for branch in "${branches[@]}"; do
  run_id="${run_ids[${branch}]}"
  gh run watch "${run_id}" --repo "${GITHUB_REPOSITORY}" --interval 60 > /dev/null || true
  # Report the real conclusion, so a run cancelled by a manual dispatch on the
  # same branch (shared concurrency group) does not read as a plugin failure.
  result=$(gh run view "${run_id}" --repo "${GITHUB_REPOSITORY}" --json conclusion --jq '.conclusion')
  [[ "${result}" == "success" ]] || failed=1
  echo "${branch}: ${result}"
  echo "- \`${branch}\`: ${result} ([run](https://github.com/${GITHUB_REPOSITORY}/actions/runs/${run_id}))" >> "${SUMMARY}"
done

exit "${failed}"
