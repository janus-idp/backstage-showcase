# app

## 2.0.0

### Major Changes

- 80376b4: Update backstage to [1.18.4](https://github.com/backstage/backstage/releases/tag/v1.18.4)

### Minor Changes

- 16d7322: Update Backstage to 1.19.x

  <https://github.com/backstage/backstage/releases/tag/v1.19.0>

- 6d93ba8: The [Nexus Repository Manager](https://github.com/janus-idp/backstage-plugins/tree/main/plugins/nexus-repository-manager) plugin has been added with the <NexusRepositoryManagerPage /> in the Entity Page Image Registry tab.

  Since the Nexus Repository Manager plugin requires a proxy endpoint, these changes are required to `app-config.yaml` if you want to add the Nexus Repository Manager plugin. Please read the [README](https://github.com/janus-idp/backstage-showcase/blob/main/README.md) and [Getting Started](https://github.com/janus-idp/backstage-showcase/blob/main/showcase-docs/getting-started.md) for more details.

  ```diff
  proxy:
    # Other proxy configurations...

  + '/nexus-repository-manager':
  +   target: ${NEXUS_REPOSITORY_MANAGER_URL}
  +   headers:
  +     X-Requested-With: 'XMLHttpRequest'
  +     # Uncomment the following line to access a private Nexus Repository Manager using a token
  +     # Authorization: 'Bearer <NEXUS_REPOSITORY_MANAGER_TOKEN>'
  +   changeOrigin: true
  +   # Change to "false" in case of using self hosted Nexus Repository Manager instance with a self-signed certificate
  +   secure: ${NEXUS_REPOSITORY_MANAGER_SECURE}
  ```

- 68a2221: Dark theme support has been added to the showcase app.
- fb319ee: Adds ability to configure branding icons and primary color
- f61842d: Update backstage to [1.18.3](https://github.com/backstage/backstage/releases/tag/v1.18.0)
- 620a9e8: Adds ability to configure header color and navigation indicator color

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

- 758be24: Allow the `app.branding.iconLogo` configuration to configure the tab icon
- 99c42b5: Fixed configuration for GitHub Auth plugin.

  GitHub Auth now uses `AUTH_GITHUB_CLIENT_ID` and `AUTH_GITHUB_CLIENT_SECRET` variables.

- dc1580d: Revert typography changes
- 7188844: Updated dependency `@testing-library/user-event` to `14.5.1`.
  Updated dependency `@types/supertest` to `2.0.14`.
  Updated dependency `@types/mock-fs` to `4.13.2`.
  Updated dependency `mock-fs` to `5.2.0`.
  Updated dependency `supertest` to `6.3.3`.
- b5ba124: Updated dependency `@mui/icons-material` to `5.14.14`.
  Updated dependency `@mui/lab` to `5.0.0-alpha.149`.
  Updated dependency `@mui/material` to `5.14.14`.
  Updated dependency `react-router-dom` to `6.17.0`.
  Updated dependency `@types/node` to `18.18.5`.
  Updated dependency `@types/react` to `17.0.68`.
  Updated dependency `better-sqlite3` to `8.7.0`.
  Updated dependency `winston` to `3.11.0`.
  Updated dependency `@types/express` to `4.17.19`.
- af6f5a2: Updated dependency `@types/node` to `18.17.15`.
- d47662e: Updated dependency `@mui/icons-material` to `5.14.9`.
  Updated dependency `@mui/lab` to `5.0.0-alpha.144`.
  Updated dependency `@mui/material` to `5.14.9`.
  Updated dependency `react-router-dom` to `6.16.0`.
  Updated dependency `@types/node` to `18.17.17`.
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
- 7f5fddf: Add documentation for customizing the logo and themes of the showcase
- 916a663: Prepare the showcase application for the switch of most plugins from static to dynamic loading.

## 1.0.1

### Patch Changes

- 69c6c7d: fix `app-config.example.yaml`

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

- 8356de2: The [Lighthouse plugin](https://github.com/backstage/backstage/tree/master/plugins/lighthouse) has been added with the `LighthouseCard` in the Lighthouse Tab in the Sidebar panel, the `EntityLighthouseContent` in the Entity Page Lighthouse Tab, and the `EntityLastLighthouseAuditCard` in the Entity Page Overview Tab.

  These changes are **required** in `app-config.yaml` if you want to add the Lighthouse plugin. Please read the [README](https://github.com/janus-idp/backstage-showcase/blob/main/README.md) and [Getting Started](https://github.com/janus-idp/backstage-showcase/blob/main/showcase-docs/getting-started.md) for more details.

  Please note that the Lighthouse plugin is a frontend for the [Lighthouse Audit Service](https://github.com/spotify/lighthouse-audit-service/tree/master) and requires it to be running.

  ```yaml
  # app-config.yaml OR app-config.local.yaml
  lighthouse:
    baseUrl: ${LIGHTHOUSE_BASEURL}
  ```

  - To integrate the Lighthouse plugin into the catalog so that the Lighthouse audit info for a component can be displayed in that component's entity page, it is necessary to annotate the entity as shown below.
  - Please Note that it is **essential** to include the `https://` or `http::/` in front of the link for this plugin to function correctly.
  - Also please note that ending the website url with a `/` will cause it to be treated as a separate link compared to the same url without the `/`.
    - i.e. `https://backstage.io/` and `https://backstage.io` are not considered the same, therefore audits for each will be grouped separately.

  ```yaml
  apiVersion: backstage.io/v1alpha1
  kind: Component
  metadata:
    # ...
    annotations:
      lighthouse.com/website-url: # A single website url e.g. https://backstage.io/
  ```

- 3fa3145: The [Dynatrace](https://github.com/backstage/backstage/tree/master/plugins/dynatrace) has been added with the `<DynatraceTab />` in the Entity Page Monitoring tab.

  Since Dynatrace requires a proxy endpoint, these changes are **required** to `app-config.yaml` if you want to add the Dynatrace plugin. Please read the [README](../README.md) and [Getting Started](../showcase-docs/getting-started.md) for more details.

  ```diff
  proxy:
    # Other proxy configurations...

  +   '/dynatrace':
  +   target: ${DYNATRACE_API_URL}
  +   headers:
  +     Authorization: 'Api-Token ${DYNATRACE_ACCESS_TOKEN}'
  ```

- 5a02b31: Support for Bitbucket has been added.

  To enable Bitbucket support, please provide the host for your bitbucket server instance, and the relevant credentials to that instance. Please read [Getting Started](../showcase-docs/getting-started.md#running-locally-with-the-optional-plugins) for more details.

- 5c43a31: The [PagerDuty](https://github.com/backstage/backstage/tree/master/plugins/pagerduty) has been added with the `<EntityPagerDutyCard />` in the Entity Page Overview tab.

  Since PagerDuty requires a proxy endpoint, these changes are **required** to `app-config.yaml` if you want to add the PagerDuty plugin. Please read the [README](../README.md) and [Getting Started](../showcase-docs/getting-started.md) for more details.

  ```yaml
  proxy:
    # Other proxy configurations...

    '/pagerduty':
      target: https://api.pagerduty.com
      headers:
        Authorization: Token token=${PAGERDUTY_TOKEN}
  ```

- d947683: The [Datadog](https://github.com/RoadieHQ/roadie-backstage-plugins/tree/main/plugins/frontend/backstage-plugin-datadog) has been added with the `<EntityDatadogContent />` in the Entity Page monitoring tab.

## 0.1.0

### Minor Changes

- 526b40d: The [Jira plugin](https://github.com/RoadieHQ/roadie-backstage-plugins/tree/main/plugins/frontend/backstage-plugin-jira) has been added with the `EntityJiraOverviewCard` in the Entity Page issues tab.

  These changes are **required** to `app-config.yaml` if you want to add the Jira plugin. Please read the [README](https://github.com/janus-idp/backstage-showcase/blob/main/README.md) and [Getting Started](https://github.com/janus-idp/backstage-showcase/blob/main/showcase-docs/getting-started.md) for more details.

  ```diff
   backend:
     # Other backend configurations...

     csp:
       connect-src: ["'self'", 'http:', 'https:']
  +    img-src:
  +      - "'self'"
  +      - 'data:'
  +      - ${JIRA_URL}
     cors:
       origin: http://localhost:3000
       methods: [GET, HEAD, PATCH, POST, PUT, DELETE]
  ```

  ```diff
   proxy:
     # Other proxy configurations...

  +  '/jira/api':
  +    target: ${JIRA_URL}
  +    headers:
  +      Authorization: ${JIRA_TOKEN}
  +      Accept: 'application/json'
  +      Content-Type: 'application/json'
  +      X-Atlassian-Token: 'no-check'
  +      User-Agent: ${JIRA_USER_AGENT}
  +
   techdocs:
     builder: ${TECHDOCS_BUILDER_TYPE}
     generator:
  ```

- cb6c541: The [Jfrog Artifactory plugin](https://github.com/janus-idp/backstage-plugins/tree/main/plugins/jfrog-artifactory) has been added with the `JfrogArtifactoryPage` in the Entity Page image registry tab.

  These changes are **required** to `app-config.yaml` if you want to add the JFrog Artifactory plugin. Please read the [README](https://github.com/janus-idp/backstage-showcase/blob/main/README.md) and [Getting Started](https://github.com/janus-idp/backstage-showcase/blob/main/showcase-docs/getting-started.md) for more details.

  ```diff
   proxy:
     # Other proxy configurations...

  +  '/jfrog-artifactory/api':
  +    target: ${ARTIFACTORY_URL}
  +    headers:
  +      Authorization: Bearer ${ARTIFACTORY_TOKEN}
  +    secure: ${ARTIFACTORY_SECURE}
  +
   techdocs:
     builder: ${TECHDOCS_BUILDER_TYPE}
     generator:
  ```
