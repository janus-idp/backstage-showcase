import { test, expect } from '@playwright/test';

const plugins = [
  {
    name: 'backstage-plugin-catalog-backend-module-github-dynamic',
    version: '0.4.4',
    platform: 'node',
    role: 'backend-plugin-module',
  },
  {
    name: 'backstage-plugin-catalog-backend-module-github-org-dynamic',
    version: '0.1.0',
    platform: 'node',
    role: 'backend-plugin-module',
  },
  {
    name: 'backstage-plugin-github-actions',
    version: '0.6.6',
    role: 'frontend-plugin',
    platform: 'web',
  },
  {
    name: 'backstage-plugin-github-issues',
    version: '0.2.14',
    role: 'frontend-plugin',
    platform: 'web',
  },
  {
    name: 'backstage-plugin-kubernetes-backend-dynamic',
    version: '0.13.0',
    platform: 'node',
    role: 'backend-plugin-module',
  },
  {
    name: 'roadiehq-scaffolder-backend-module-utils-dynamic',
    version: '1.10.4',
    platform: 'node',
    role: 'backend-plugin-module',
  },
  {
    name: '@janus-idp/backstage-plugin-keycloak-backend-dynamic',
    version: '1.7.9',
    platform: 'node',
    role: 'backend-plugin-module',
  },
  {
    name: '@janus-idp/backstage-plugin-ocm',
    version: '3.5.9',
    role: 'frontend-plugin',
    platform: 'web',
  },
  {
    name: '@janus-idp/backstage-plugin-ocm-backend-dynamic',
    version: '3.4.10',
    platform: 'node',
    role: 'backend-plugin',
  },
  {
    name: '@janus-idp/backstage-plugin-quay',
    version: '1.4.16',
    role: 'frontend-plugin',
    platform: 'web',
  },
  {
    name: '@janus-idp/backstage-scaffolder-backend-module-quay-dynamic',
    version: '1.2.4',
    platform: 'node',
    role: 'backend-plugin-module',
  },
  {
    name: '@janus-idp/backstage-scaffolder-backend-module-regex-dynamic',
    version: '1.2.4',
    platform: 'node',
    role: 'backend-plugin-module',
  },
  {
    name: 'roadiehq-backstage-plugin-github-pull-requests',
    version: '2.5.18',
    role: 'frontend-plugin',
    platform: 'web',
  },
];

test.describe.skip('dynamic-plugins-info backend plugin', () => {
  test('should lists all the dynamic plugins installed', async ({
    request,
  }) => {
    const response = await request.get(
      '/api/dynamic-plugins-info/loaded-plugins',
    );
    const body = await response.json();

    expect(body).toEqual(expect.arrayContaining(plugins));
  });
});
