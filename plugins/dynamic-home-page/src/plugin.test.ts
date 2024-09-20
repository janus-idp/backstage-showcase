import { dynamicHomePagePlugin } from './plugin';

describe('home-page', () => {
  it('should export plugin', () => {
    expect(dynamicHomePagePlugin).toBeDefined();
  });
});
