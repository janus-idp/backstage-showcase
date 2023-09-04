import * as components from './index';

describe('teamcity', () => {
  it('should export components', () => {
    expect(components.GitHubCommitLink).toBeDefined();
    expect(components.TeamcityBuildPage).toBeDefined();
    expect(components.TeamcityHistoryTableComponent).toBeDefined();
    expect(components.TeamcityLogPage).toBeDefined();
    expect(components.TeamcitySource).toBeDefined();
    expect(components.TeamcityStatus).toBeDefined();
    expect(components.TeamcityTableComponent).toBeDefined();
  });
});
