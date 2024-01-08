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
    name: '@janus-idp/backstage-plugin-keycloak-backend-dynamic',
    version: '1.7.6',
    platform: 'node',
    role: 'backend-plugin-module',
  },
  {
    name: '@janus-idp/backstage-plugin-ocm',
    version: '3.5.0',
    role: 'frontend-plugin',
    platform: 'web',
  },
  {
    name: '@janus-idp/backstage-plugin-ocm-backend-dynamic',
    version: '3.4.6',
    platform: 'node',
    role: 'backend-plugin',
  },
  {
    name: '@janus-idp/backstage-plugin-quay',
    version: '1.4.6',
    role: 'frontend-plugin',
    platform: 'web',
  },
  {
    name: '@janus-idp/backstage-scaffolder-backend-module-quay-dynamic',
    version: '1.2.1',
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

describe('dynamic-plugins-info backend plugin', () => {
  it('should lists all the dynamic plugins installed', () => {
    cy.request('/api/dynamic-plugins-info/loaded-plugins')
      .its('body')
      .then(body => {
        expect(body).to.include.deep.members(plugins);
      });
  });
});
