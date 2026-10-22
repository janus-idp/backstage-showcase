#!/bin/bash
#
# Runs the plugin-sanity job on the newest release branches that carry the
# harness, each on its own ref, so every release index is checked against the
# backend it ships with. GitHub only fires `schedule` on the default branch,
# so main's scheduled run calls this.
#
# Waits for every dispatched run and exits non-zero unless all of them succeed.
#
# Usage (GH_TOKEN needs actions:write on the repository):
#   GITHUB_REPOSITORY=owner/repo ./e2e-tests/local-harness/dispatch-release-plugin-sanity.sh
set -euo pipefail

: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
RELEASE_COUNT="${RELEASE_COUNT:-2}"
WORKFLOW="e2e-cluster-free.yaml"
HARNESS_MARKER="e2e-tests/local-harness/populate-catalog-index.sh"
SUMMARY="${GITHUB_STEP_SUMMARY:-/dev/null}"

if [[ ! "${RELEASE_COUNT}" =~ ^[1-9][0-9]*$ ]]; then
  echo "RELEASE_COUNT must be a positive integer, got: ${RELEASE_COUNT}" >&2
  exit 1
fi

# Only a 404 means "no harness"; any other API error must fail the job rather
# than read as "nothing to check".
has_harness() {
  local out
  out=$(gh api "repos/${GITHUB_REPOSITORY}/contents/${HARNESS_MARKER}?ref=$1" --silent 2>&1) && return 0
  [[ "${out}" == *"HTTP 404"* ]] && return 1
  echo "${out}" >&2
  exit 1
}

all_branches=$(gh api --paginate "repos/${GITHUB_REPOSITORY}/branches?per_page=100" --jq '.[].name')

branches=()
while read -r branch; do
  # Sorted newest first, so the first branch older than the harness ends the
  # search.
  has_harness "${branch}" || break
  branches+=("${branch}")
  ((${#branches[@]} < RELEASE_COUNT)) || break
done < <(grep -E '^release-[0-9]+\.[0-9]+$' <<< "${all_branches}" | sort -rV || true)

if ((${#branches[@]} == 0)); then
  echo "No release branch carries ${HARNESS_MARKER}; nothing to dispatch."
  exit 0
fi

# A failed dispatch is recorded and skipped, so the runs already dispatched are
# still waited on and reported.
run_ids=()
run_urls=()
for branch in "${branches[@]}"; do
  response=$(gh api -X POST "repos/${GITHUB_REPOSITORY}/actions/workflows/${WORKFLOW}/dispatches" \
    -f ref="${branch}" -F return_run_details=true --jq '"\(.workflow_run_id) \(.html_url)"') || response=""
  if [[ -z "${response}" ]]; then
    echo "Failed to dispatch plugin-sanity on ${branch}" >&2
  else
    echo "Dispatched plugin-sanity on ${branch}: ${response#* }"
  fi
  run_ids+=("${response%% *}")
  run_urls+=("${response#* }")
done

echo "### Release plugin-sanity" >> "${SUMMARY}"
failed=0
for i in "${!branches[@]}"; do
  branch="${branches[i]}"
  run_id="${run_ids[i]}"
  if [[ ! "${run_id}" =~ ^[0-9]+$ ]]; then
    result="dispatch failed"
  else
    gh run watch "${run_id}" --repo "${GITHUB_REPOSITORY}" --interval 60 > /dev/null || true
    # The real conclusion, so a run cancelled through the concurrency group it
    # shares with manual dispatches on the same branch does not read as a
    # plugin failure.
    result=$(gh run view "${run_id}" --repo "${GITHUB_REPOSITORY}" --json conclusion --jq '.conclusion') \
      || result="unknown"
  fi
  [[ "${result}" == "success" ]] || failed=1
  echo "${branch}: ${result}"
  echo "- \`${branch}\`: ${result} ${run_urls[i]:+([run](${run_urls[i]}))}" >> "${SUMMARY}"
done

exit "${failed}"
