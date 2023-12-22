const backstageShowcaseAPI =
  'https://api.github.com/repos/janus-idp/backstage-showcase';

export const githubAPIEndpoints = {
  pull: (state: string) =>
    `${backstageShowcaseAPI}/pulls?per_page=100&state=${state}`,
  issues: (state: string) =>
    `${backstageShowcaseAPI}/issues?per_page=100&sort=updated&state=${state}`,
  workflowRuns: `${backstageShowcaseAPI}/actions/runs?per_page=100`,
};
