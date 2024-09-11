const backstageShowcaseAPI =
  'https://api.github.com/repos/janus-idp/backstage-showcase';

export const githubAPIEndpoints = {
  pull: (owner: string, repo: string, state: 'open' | 'closed' | 'all') =>
    `https://api.github.com/repos/${owner}/${repo}/pulls?per_page=100&state=${state}`,
  issues: (state: string) =>
    `${backstageShowcaseAPI}/issues?per_page=100&sort=updated&state=${state}`,
  workflowRuns: `${backstageShowcaseAPI}/actions/runs?per_page=100`,
  deleteRepo: (owner: string, repo: string) =>
    `https://api.github.com/repos/${owner}/${repo}`,
  mergePR: (owner: string, repoName: string, pull_number: number) =>
    `https://api.github.com/repos/${owner}/${repoName}/pulls/${pull_number}/merge`,
  createRepo: (owner: string) => `https://api.github.com/orgs/${owner}/repos`,
  pull_files: (owner: string, repoName: string, pr: number) =>
    `https://api.github.com/repos/${owner}/${repoName}/pulls/${pr}/files`,
  contents: (owner: string, repoName: string) =>
    `https://api.github.com/repos/${owner}/${repoName}/contents`,
};
