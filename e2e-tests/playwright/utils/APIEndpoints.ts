const BASE_API_URL = "https://api.github.com";
const PER_PAGE = 100;

const getRepoUrl = (owner: string, repo: string) =>
  `${BASE_API_URL}/repos/${owner}/${repo}`;
const getOrgUrl = (owner: string) => `${BASE_API_URL}/orgs/${owner}`;

const backstageShowcaseAPI = getRepoUrl("redhat-developer", "rhdh");

export const githubAPIEndpoints = {
  pull: (owner: string, repo: string, state: "open" | "closed" | "all") =>
    `${getRepoUrl(owner, repo)}/pulls?per_page=${PER_PAGE}&state=${state}`,

  issues: (state: string) =>
    `${backstageShowcaseAPI}/issues?per_page=${PER_PAGE}&sort=updated&state=${state}`,

  workflowRuns: `${backstageShowcaseAPI}/actions/runs?per_page=${PER_PAGE}`,

  deleteRepo: getRepoUrl,

  mergePR: (owner: string, repoName: string, pull_number: number) =>
    `${getRepoUrl(owner, repoName)}/pulls/${pull_number}/merge`,

  createRepo: (owner: string) => `${getOrgUrl(owner)}/repos`,

  pull_files: (owner: string, repoName: string, pr: number) =>
    `${getRepoUrl(owner, repoName)}/pulls/${pr}/files`,

  contents: (owner: string, repoName: string) =>
    `${getRepoUrl(owner, repoName)}/contents`,
};
