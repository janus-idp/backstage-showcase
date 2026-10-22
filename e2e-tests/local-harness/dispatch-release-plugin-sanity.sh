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

has_harness() {
  gh api "repos/${GITHUB_REPOSITORY}/contents/${HARNESS_MARKER}?ref=$1" --silent 2> /dev/null
}

mapfile -t candidates < <(
  gh api --paginate "repos/${GITHUB_REPOSITORY}/branches" --jq '.[].name' \
    | grep -E '^release-[0-9]+\.[0-9]+$' | sort -rV
)

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
  # --exit-status turns a failed run into a non-zero exit.
  if gh run watch "${run_id}" --repo "${GITHUB_REPOSITORY}" --interval 60 --exit-status > /dev/null; then
    result="success"
  else
    result="failure"
    failed=1
  fi
  echo "${branch}: ${result}"
  echo "- \`${branch}\`: ${result} ([run](https://github.com/${GITHUB_REPOSITORY}/actions/runs/${run_id}))" >> "${SUMMARY}"
done

exit "${failed}"
