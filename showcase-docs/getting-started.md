# Getting Started running Backstage Showcase

There are several different methods for running the Backstage Showcase app today. We currently have support for running the application locally, using a helm chart to deploy to a cluster, and manifests for deployment using ArgoCD.

## Running Locally with a basic configuration

The easiest and fastest method for getting started: Backstage Showcase app, running it locally only requires a few simple steps.

1. Copy `app-config.example.yaml` and rename it as `app-config.local.yaml`.

2. Ensure you have the following developer tools installed:

   - If you are on a Fedora/Red Hat Linux distribution run: `sudo dnf install python3 make g++ zlib-devel brotli-devel openssl-devel libuv-devel`
   - If you are on a Debian/Ubuntu Linux distribution run: `sudo apt-get install python3 g++ build-essential`
   - If you are on Windows, then follow the [instructions](https://github.com/nodejs/node-gyp#on-windows) in `node-gyp` for Windows
   - If you are on macOS, then follow the [instructions](https://github.com/nodejs/node-gyp#on-macos) in `node-gyp` for macOS

3. Run `yarn install` to install the dependencies

4. Start the application using `yarn start`

5. Navigate to <http://localhost:3000>

## Running Locally with the Optional Plugins

1. Create an `app-config.local.yaml` file that will be used for storing the environment variables that the showcase app needs

2. Ensure you have the following developer tools installed:

   - If you are on a Fedora/Red Hat Linux distribution run: `sudo dnf install python3 make g++ zlib-devel brotli-devel openssl-devel libuv-devel`
   - If you are on a Debian/Ubuntu Linux distribution run: `sudo apt-get install python3 g++ build-essential`
   - If you are on Windows, then follow the [instructions](https://github.com/nodejs/node-gyp#on-windows) in `node-gyp` for Windows
   - If you are on macOS, then follow the [instructions](https://github.com/nodejs/node-gyp#on-macos) in `node-gyp` for macOS

3. Run `yarn install` to install the dependencies

4. In the `dynamic-plugins-root` folder, verify that you have the dynamic plugins you want to load into
   the backend application. To have all the plugins originally included in the Showcase application,
   run the following command at the root of the showcase repository:

   ```bash
   yarn export-dynamic -- -- --dev
   ```

   **Note:** The `-- -- ` arguments are required to forward the `--dev` argument to every yarn workspace providing an `export-dynamic` script.

5. Copy the required code snippet from `app-config.yaml` into `app-config.local.yaml`. Note: Each plugin has a `# Plugin: <PLUGIN_NAME>` comment above the required code snippet(s).

   - Enable plugins (All plugins have a default of `false`)

     - `${K8S_ENABLED}`: Set to `true` to enable the Kubernetes backend plugin.
     - `${TECHDOCS_ENABLED}` Set to `true` to enable the Techdocs backend plugin.
     - `${ARGOCD_ENABLED}` Set to `true` to enable the ArgoCD backend plugin.
     - `${SONARQUBE_ENABLED}` Set to `true` to enable the SonarQube backend plugin.
     - `${KEYCLOAK_ENABLED}` Set to `true` to enable the Keycloak backend plugin.
     - `${OCM_ENABLED}` Set to `true` to enable the OCM backend plugin.
     - `${GITHUB_ENABLED}` Set to `true` to enable the GitHub Entity backend plugin.
     - `${GITHUB_ORG_ENABLED}` Set to `true` to enable the GitHub Org Entity backend plugin.
     - `${GITLAB_ENABLED}` Set to `true` to enable the GitLab Entity backend plugin.
     - `${AZURE_ENABLED}` Set to `true` to enable the Azure DevOps Entity backend plugin.
     - `${JENKINS_ENABLED}` Set to `true` to enable the Jenkins Entity backend plugin.
     - `${METRICS_ENABLED}` Set to `true` to enable Prometheus metrics (metrics will be available on `http://localhost:7007/metrics`).
     - `${AAP_ENABLED}` Set to `true` to enable the AAP backend plugin

   - Setup the GitHub plugins (GitHub Issues and GitHub Pull Request)

     - This [URL](https://backstage.io/docs/integrations/github/github-apps) can be used to quickly create a GitHub app, you can name the yaml file `github-app-backstage-showcase-credentials.local.yaml`
     - `${GITHUB_APP_CLIENT_ID}`: client id
     - `${GITHUB_APP_CLIENT_SECRET}`: client secret

   - Setup the GitHub Org Entity backend plugin

     - `${GITHUB_ORG_URL}`: URL for the GitHub Org (example: `https://github.com/janus-idp`)

   - Setup the GitHub Entity backend plugin with automatic discovery

     - add `github` provider to your `app-config.local.yaml`:

       ```yaml
       catalog:
         providers:
           github:
             myorg:
               organization: '${GITHUB_ORG}'
       ```

   - set the environment variable `${GITHUB_ORG}` to the name of your GitHub organization (example: `janus-idp`)
   - This [URL](https://backstage.io/docs/integrations/github/discovery#configuration) documents all available configuration options

   - Setup the GitLab plugin

     - `${GITLAB_HOST}`: your gitlab host
       - This [URL](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html) describes how to create a GitLab personal access token
     - `${GITLAB_TOKEN}`: personal access token
     - `${GITLAB_API_BASE_URL}`: the base url for the gitlab api.
       - Typically it is in the form `https://${GITLAB_HOST}/api/v4`.
       - Note: if your `${GITLAB_HOST}` is set to `gitlab.com`, then you won't need to provide a value for this since it will be automatically inferred to be `https://gitlab.com/api/v4`
     - If you want to enable gitlab discovery for components, you will need to add the following snippet into your `app-config.yaml`:

     ```yaml
     catalog:
       providers:
         gitlab:
           yourProviderId:
             host: ${GITLAB_HOST}
             group: example-group # Note that this is an optional field
     ```

     - Note that the group field is completely optional, but we highly recommend you specify a group/subgroup to narrow the scope in which the Discovery would search through
       - The Gitlab Discovery does not ingest the discovered components into the catalog until it is done searching through the ENTIRE provided scope of the instance
       - This may result in a delay of potentially hours before the component is ingested if the provided instance is large enough.
       - For more information on how to configure for Gitlab Discovery, please refer to the [Documentation](https://backstage.io/docs/integrations/gitlab/discovery/) for the plugin.

   - Setup the Azure DevOps plugin

     - This [URL](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate?view=azure-devops&tabs=Windows) can be used to quickly create an Azure personal access token
     - `${AZURE_TOKEN}`: personal access token
     - `${AZURE_ORG}`: Azure DevOps Services (cloud) Organization name or the Azure DevOps Server

   - Setup the Jira plugin

     - This [URL](https://github.com/RoadieHQ/roadie-backstage-plugins/tree/main/plugins/frontend/backstage-plugin-jira#how-to-use-jira-plugin-in-backstage) explains how to use the Jira plugin
     - `${JIRA_URL}`: URL for the Jira instance
     - `${JIRA_TOKEN}`: API token
     - `${JIRA_USER_AGENT}`: User-Agent (UA) string (Any dummy string without whitespace works because Jira APIs reject browser origin requests)

   - Setup the Jfrog Artifactory plugin

     - This [URL](https://github.com/janus-idp/backstage-plugins/tree/main/plugins/jfrog-artifactory#getting-started) explains how to use the Jfrog Artifactory plugin
     - `${ARTIFACTORY_URL}`: URL for the Jfrog Artifactory instance
     - `${ARTIFACTORY_TOKEN}`: API token
     - `${ARTIFACTORY_SECURE}`: Change to `false` in case of using self hosted artifactory instance with a self-signed certificate

   - Setup the ArgoCD instances(s)

     - If using a shared username and password across the instances, you can define them in the username and password variables and arbitrarily assign the urls and tokens
     - If using tokens for each individual instance, you can assign arbitrary variables to the tokens
     - `${ARGOCD_USERNAME}` Username for the instance(s)
     - `${ARGOCD_PASSWORD}` Password for the instance(s)
     - `${ARGOCD_INSTANCE1_URL}`: URL to the instance
     - `${ARGOCD_AUTH_TOKEN}`: token to the instance
     - `${ARGOCD_INSTANCE2_URL}`: URL to the instance
     - `${ARGOCD_AUTH_TOKEN2}`: token to the instance

   - Setup the Keycloak instance(s)

     - `${KEYCLOAK_BASE_URL}`: base URL of the Keycloak instance
     - `${KEYCLOAK_LOGIN_REALM}`: login realm
     - `${KEYCLOAK_REALM}`: realm
     - `${KEYCLOAK_CLIENT_ID}`: client id
     - `${KEYCLOAK_CLIENT_SECRET}`: client secret

   - Setup the kubernetes cluster plugin

     - `${K8S_CLUSTER_NAME}`: cluster name
     - `${K8S_CLUSTER_URL}`: cluster url
     - `${K8S_CLUSTER_TOKEN}`: cluster token

   - Setup the Open Cluster Management plugin

     - `${OCM_HUB_NAME}`: hub cluster name
     - `${OCM_HUB_URL}`: hub cluster url
     - `${moc_infra_token}`: hub token

   - Setup the SonarQube instance

     - `${SONARQUBE_URL}` the url at which sonarqube can be found. Mandatory if plugin is enabled
     - `${SONARQUBE_TOKEN}` a sonarqube [token](https://docs.sonarqube.org/9.8/user-guide/user-account/generating-and-using-tokens/) with enough permission to read all the SonaQube projects. Mandatory if plugin is enabled

   - Setup the Techdocs plugin with an external S3 bucket storage

     - `${TECHDOCS_BUILDER_TYPE}` Set to 'local' for simple setup, or 'external' to use a pipeline
     - `${TECHDOCS_GENERATOR_TYPE}` Set to 'local' for most of the use cases. You can use also 'docker'
     - `${TECHDOCS_PUBLISHER_TYPE}` Set to 'local' for simple setup, or 'awsS3' to use a S3 storage. 'googleGcs' is not supported at the moment.
     - `${BUCKET_NAME}` the bucket name
     - `${BUCKET_REGION_VAULT}` the bucket region
     - `${BUCKET_URL}` the bucket url
     - `${AWS_ACCESS_KEY_ID}` the AWS credentials Key Id
     - `${AWS_SECRET_ACCESS_KEY}` the AWS credentials Access Key

   - Setup a Jenkins instance and then pass the following environment variables to backstage:

     - `${JENKINS_URL}` with the URL where your Jenkins instance can be accessed
     - `${JENKINS_USERNAME}` with the name of the user to be accessed through the API
     - `${JENKINS_TOKEN}` with the API token to be used for the given user

   - Setup the Segment plugin

     - `${SEGMENT_WRITE_KEY}`: Segment write key
     - `${SEGMENT_MASK_IP}`: prevents IP addresses to be sent if true
     - `${SEGMENT_TEST_MODE}`: prevents data from being sent if true

   - Setup the Bitbucket Server Instance

     - `${BITBUCKET_SERVER_HOST}`: The host of the bitbucket Server Instance. e.g. `bitbucket.mycompany.com`
     - `${BITBUCKET_API_BASE_URL}`: The URL of the Bitbucket Server API. For self-hosted installations, it is commonly at `https://<host>/rest/api/1.0`
     - `${BITBUCKET_SERVER_USERNAME}`: Basic Auth Username for Bitbucket Server
     - `${BITBUCKET_SERVER_PASSWORD}`: Basic Auth Password for Bitbucket Server. A [token](https://confluence.atlassian.com/bitbucketserver/personal-access-tokens-939515499.html) can be used in place of the password.

   - Setup the PagerDuty plugin

     - `${PAGERDUTY_TOKEN}` with the [API token](https://support.pagerduty.com/docs/api-access-keys#generating-a-general-access-rest-api-key) used to make requests to the [PagerDuty API](https://developer.pagerduty.com/docs/rest-api-v2/rest-api/). Note that this will require a PaperDuty Admin role.
     - To integrate with a PagerDuty Service, you will need to annotate the appropriate entity with the [PagerDuty Integration key](https://github.com/backstage/backstage/tree/master/plugins/pagerduty#integrating-with-a-pagerduty-service) in its `.yaml` configuration file:

     ```yaml
     annotations:
       pagerduty.com/integration-key: [INTEGRATION_KEY]
     ```

     - Alternatively, you can integrate with the [PagerDuty ServiceID](https://github.com/backstage/backstage/tree/master/plugins/pagerduty#annotating-with-service-id) instead of the integration key:

     ```yaml
     annotations:
       pagerduty.com/service-id: [SERVICE_ID]
     ```

   - Setup the Lighthouse plugin

     - `${LIGHTHOUSE_BASEURL}`: Base URL for the `lighthouse-audit-service` instance
     - To integrate the Lighthouse plugin into the catalog so that the Lighthouse audit info for a component can be displayed in that component's entity page, it is necessary to annotate the entity as shown below.
     - Please note that it is **essential** to include the `https://` or `http::/` in front of the link for this plugin to function correctly.

     ```yaml
     apiVersion: backstage.io/v1alpha1
     kind: Component
     metadata:
       # ...
       annotations:
         lighthouse.com/website-url: # A single website url e.g. https://backstage.io/
     ```

     - Also please note that ending the website url with a `/` will cause it to be treated as a separate link compared to the same url without the `/`.
       - i.e. `https://backstage.io/` and `https://backstage.io` are not considered the same, therefore audits for each will be grouped separately.

   - Setup the Dynatrace plugin

     - This [URL](https://github.com/backstage/backstage/tree/master/plugins/dynatrace#getting-started) explains how to use the Dynatrace Plugin
     - `${DYNATRACE_URL}`: The baseURL for rendering links to problems in the table
     - `${DYNATRACE_API_URL}`: The URL to the Dynatrace API
     - `{DYNATRACE_ACCESS_TOKEN}`: API access token (see [documentation](https://www.dynatrace.com/support/help/dynatrace-api/basics/dynatrace-api-authentication)) with `entities.read`,`problems.read` permissions. It will also need one of the following permissions: `DataExport`, `ExternalSyntheticIntegration`, or `ReadSyntheticData`.

   - Enabling Authentication in Showcase

     - There are currently three options for sign on providers within the showcase app. The availability of the sign on providers are determined by the variable set under `auth.environment`.

     - To enable the GitHub and Guest sign on providers, add the following to the config file and set `clientId` and `clientSecret` to the appropriate values based on your GitHub OAuth App. See G[itHub Authentication Provider](https://backstage.io/docs/auth/github/provider) documentation for more information and all available configuration options.

       ```yaml
       auth:
         environment: development
         providers:
           github:
             development:
               clientId: ${AUTH_GITHUB_CLIENT_ID}
               clientSecret: ${AUTH_GITHUB_CLIENT_SECRET}
       ```

     - To enable the oauth2Proxy sign on provider, add the following to the config file. GitHub will still need to be included and configured as it is relied on by the GitHub plugins.

       ```yaml
       auth:
         environment: production
         providers:
           github:
             production:
               clientId: ${AUTH_GITHUB_CLIENT_ID}
               clientSecret: ${AUTH_GITHUB_CLIENT_SECRET}
           oauth2Proxy: {}
       ```

   - Setup the Nexus Repository Manager plugin

     - `${NEXUS_REPOSITORY_MANAGER_URL}`: The URL to the Nexus Repository Manager instance.
     - `${NEXUS_REPOSITORY_MANAGER_SECURE}`: Change to `false` in case of using self hosted artifactory instance with a self-signed certificate
     - If using a private Nexus Repository Manager instance, you will need to add an Authorization header for the nexus proxy in your `app-config.yaml` or `app-config.local.yaml`:

       ```yaml
       '/nexus-repository-manager':
         target: ${NEXUS_REPOSITORY_MANAGER_URL}
         headers:
           X-Requested-With: 'XMLHttpRequest'
           # Uncomment the following line to access a private Nexus Repository Manager using a token
           Authorization: 'Bearer ${NEXUS_REPOSITORY_MANAGER_TOKEN}'
       ```

       - `${NEXUS_REPOSITORY_MANAGER_TOKEN}` (Only for private Nexus Repository Manager instances): Nexus instance API token (see [documentation](https://help.sonatype.com/repomanager3/nexus-repository-administration/user-authentication/user-tokens)) with `nx-repository-view-*-*-read` [permissions](https://help.sonatype.com/repomanager3/nexus-repository-administration/access-control/privileges), or read permissions to view all the repositories you want to display in the plugin.

- Setup the AAP backend plugin

  - This [URL](https://github.com/janus-idp/backstage-plugins/blob/main/plugins/aap-backend/README.md#installation-and-configuration) explains how to use the AAP backend plugin
  - `${AAP_BASE_URL}`: URL for the Ansible Automation Platform(AAP). Mandatory if plugin is enabled
  - `${AAP_AUTH_TOKEN}`: Ansible Automation Platform(AAP) [token](https://docs.ansible.com/automation-controller/latest/html/userguide/users.html#users-tokens) with enough permission to read job templates. Mandatory if plugin is enabled (e.g 'Bearer XXXX')

6. Start the application using `yarn start`

7. Navigate to <http://localhost:3000>

## Running with Helm

COMING SOON

## Deploying with ArgoCD

COMING SOON

## Openshift Logging Integration

[Openshift Logging](https://access.redhat.com/documentation/en-us/openshift_container_platform/4.13/html/logging/index) can be used to monitor Backstage logs. The only requirement is to correctly filter logs in Kibana. A possible filter is using the field `kubernetes.container_name` with operator `is` and value `backstage-backend`.
