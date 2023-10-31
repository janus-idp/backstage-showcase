# backend

## 1.1.0

### Minor Changes

- 16d7322: Update Backstage to 1.19.x

  <https://github.com/backstage/backstage/releases/tag/v1.19.0>

- 28c55dc: Added `METRICS_ENABLED` that enables Prometheus metrics

  When enabled, Prometheus metrics are available at the backed URL in /metrics (http://localhost:7007/metrics)

- fa74ef6: Added `healthcheck` endpoint
- 5e45008: Add support for dynamic backend plugins.
- 80376b4: Update backstage to [1.18.4](https://github.com/backstage/backstage/releases/tag/v1.18.4)
- 1306f71: Added `AAP_ENABLED` that enables AAP(Ansible Automation Platform) backend plugin. Once enabled it lists job templates and workflow job templates in software catalog
- f61842d: Update backstage to [1.18.3](https://github.com/backstage/backstage/releases/tag/v1.18.0)

### Patch Changes

- 5dbf27f: Upgrade to backstage 1.19.6

  <https://github.com/backstage/backstage/releases/tag/v1.19.6>

- 6374999: Implemented Support for Custom Docker Image Labels in GitHub Actions Workflow:

  Incorporated functionality to seamlessly manage custom labels for Docker images within the GitHub Actions workflow. The enhancements were made as follows:

  1. **Enhanced Action Configuration (`action.yaml`):**
     - Introduced the `imageLabels` parameter in the Docker build action configuration.
     - The `imageLabels` parameter empowers users to define custom labels for Docker images during the build process.
  2. **Improved Workflow Configuration (`nightly.yaml`):**
     - Introduced the `imageLabels` parameter in the workflow configuration.
     - Illustrative usage: Setting `imageLabels: quay.expires-after=14d` to specify a 14-day expiration for images.
     - When executing the nightly workflow, the Docker image will be enriched with the designated labels.

  **Usage Guide:**
  To leverage the new `imageLabels` parameter, navigate to the workflow configuration (`nightly.yaml`) and modify the `imageLabels` parameter as needed:

  ```yaml
  jobs:
    release:
      ...
      steps:
        ...
        - name: Publish
          uses: ./.github/actions/docker-build
          with:
            ...
            imageLabels: "quay.expires-after=14d" # modify this
            push: true

  ```

- 4af2b85: Add a `scalprum` backend plugin.

  This plugin depends on the `backend-plugin-manager` and
  provides access to the scalprum defintinions,
  as well as the plugin assets,
  of the dynamic frontend plugins which are
  installed in the dynamic plugins root folder.

- 2037da3: Updated dependency `prom-client` to `15.0.0`.
- 258c63e: Updated dependency `better-sqlite3` to `9.0.0`.
- b5ba124: Updated dependency `@mui/icons-material` to `5.14.14`.
  Updated dependency `@mui/lab` to `5.0.0-alpha.149`.
  Updated dependency `@mui/material` to `5.14.14`.
  Updated dependency `react-router-dom` to `6.17.0`.
  Updated dependency `@types/node` to `18.18.5`.
  Updated dependency `@types/react` to `17.0.68`.
  Updated dependency `better-sqlite3` to `8.7.0`.
  Updated dependency `winston` to `3.11.0`.
  Updated dependency `@types/express` to `4.17.19`.
- 6332c94: Updated dependency `@mui/icons-material` to `5.14.11`.
  Updated dependency `@mui/lab` to `5.0.0-alpha.146`.
  Updated dependency `@mui/material` to `5.14.11`.
  Updated dependency `swr` to `2.2.4`.
  Updated dependency `tss-react` to `4.9.2`.
  Updated dependency `@types/node` to `18.18.0`.
  Updated dependency `@types/react` to `17.0.66`.
  Updated dependency `@types/react-dom` to `17.0.21`.
  Updated dependency `@types/dockerode` to `3.3.20`.
  Updated dependency `@types/express` to `4.17.18`.
  Updated dependency `@types/express-serve-static-core` to `4.17.37`.
- ce85b16: Switch static backend plugins to dynamic plugins
- 272da4c: upgraded to Backstage 1.17.5
- 916a663: Prepare the showcase application for the switch of most plugins from static to dynamic loading.
- 0961437: Fix a bug in the upstream CommonJSLoader, which prevented laoding modules from embedded node_modules folders of private packages located in the plugin node_modules folder.
- Updated dependencies [16d7322]
- Updated dependencies [5dbf27f]
- Updated dependencies [6d93ba8]
- Updated dependencies [6374999]
- Updated dependencies [758be24]
- Updated dependencies [4af2b85]
- Updated dependencies [68a2221]
- Updated dependencies [99c42b5]
- Updated dependencies [dc1580d]
- Updated dependencies [80376b4]
- Updated dependencies [7188844]
- Updated dependencies [0744f67]
- Updated dependencies [da901e8]
- Updated dependencies [b5ba124]
- Updated dependencies [af6f5a2]
- Updated dependencies [d47662e]
- Updated dependencies [6332c94]
- Updated dependencies [fb319ee]
- Updated dependencies [f61842d]
- Updated dependencies [7f5fddf]
- Updated dependencies [916a663]
- Updated dependencies [620a9e8]
  - @internal/plugin-scalprum-backend@0.2.0
  - app@2.0.0

## 1.0.1

### Patch Changes

- 69c6c7d: fix `app-config.example.yaml`
- Updated dependencies [69c6c7d]
  - app@1.0.1

## 1.0.0

### Major Changes

- f26ad0d: Update the proxy object to include the endpoint property in `app-config.yaml`

  e.g.

  ```yaml
  proxy:
    endpoints:
      # Plugin: Quay
      '/quay/api':
        target: https://quay.io/
        headers:
          X-Requested-With: 'XMLHttpRequest'
          # Uncomment the following line to access a private Quay Repository using a token
          # Authorization: 'Bearer <YOUR TOKEN>'
        changeOrigin: true
        secure: true
  ```

### Minor Changes

- 78f4420: Adds Authentication to the showcase app. Adds a sign on page that will either use the GitHub and Guest identity providers or the Oauth2Proxy identity provider based on an environment variable set within the app-config.

  GitHub and guest will be used whenever the environment variable is set to development

  Oauth2Proxy will be used whenever the environment variable is set to production

  - note: the GitHub section will also need to be updated to ensure that the GitHub plugins work properly

  To enable GitHub and guest Sign in pages, add the below to the app-config

  ```yaml
  auth:
    environment: development
    providers:
      github:
        development:
          clientId: ${GITHUB_APP_CLIENT_ID}
          clientSecret: ${GITHUB_APP_CLIENT_SECRET}
  ```

  To enable Keycloak Sign in, add the below to the app-config

  ```yaml
  auth:
    environment: production
    providers:
      github:
        production:
          clientId: ${GITHUB_APP_CLIENT_ID}
          clientSecret: ${GITHUB_APP_CLIENT_SECRET}
      oauth2Proxy: {}
  ```

- 9cb37db: Adds a default allow all permission policy to the showcase app. Enabling the permission plugin requires permission.enabled to be set to true in the app-config. Also there is a requirement to set service to service auth which includes an auth key within the app-config.

  Documentation for setting an auth key can be found under Service to [Service Auth](https://backstage.io/docs/auth/service-to-service-auth#setup)

  ```diff
  backend:
  + auth:
  +   keys:
  +     - secret: ${BACKEND_AUTH_SECRET}
  ...

  + permission:
  +   enabled: ${PERMISSION_ENABLED}
  ...

    enabled:
  +   permission: ${PERMISSION_ENABLED}
  ```

- 83003f0: Added Gitlab Discovery via the GitlabDiscoveryEntityProvider. For more information on how to configure the showcase to enable Gitlab Discovery refer to the `getting-started` [documentation](https://github.com/janus-idp/backstage-showcase/blob/main/showcase-docs/getting-started.md#running-locally-with-the-optional-plugins)

### Patch Changes

- Updated dependencies [f26ad0d]
- Updated dependencies [78f4420]
- Updated dependencies [8356de2]
- Updated dependencies [3fa3145]
- Updated dependencies [5a02b31]
- Updated dependencies [5c43a31]
- Updated dependencies [d947683]
  - app@1.0.0
