import { teamcityPlugin, EntityTeamcityContent } from './plugin';

describe('teamcity', () => {
  it('should export plugins', () => {
    expect(teamcityPlugin).toBeDefined();
    expect(EntityTeamcityContent).toBeDefined();
  });
});
