import * as components from './index';

describe('teamcity', () => {
  it('should export components', () => {
    expect(components.teamcityPlugin).toBeDefined();
    expect(components.EntityTeamcityContent).toBeDefined();
    expect(components.isTeamcityAvailable).toBeDefined();
  });
});
