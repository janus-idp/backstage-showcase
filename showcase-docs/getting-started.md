# Getting Started running Backstage Showcase

There are several different methods for running the Backstage Showcase app today. We currently have support for running the application locally, using a helm chart to deploy to a cluster, and manifests for deployment using ArgoCD.

## Telemetry collection

This software may enable telemetry data collection through the [`@janus-idp/backstage-plugin-analytics-provider-segment`](https://github.com/janus-idp/backstage-plugins/tree/main/plugins/analytics-provider-segment) plugin in its default configuration to enhance user experience while prioritizing privacy:

- **Anonymized-focused configuration**:

  - IP addresses are anonymized (`maskIP: true`), and recorded as `0.0.0.0`.
  - `anonymousId` used for tracking is a hash derived from the user's username.

- **Data Collection Overview**:
  - **Events Tracked**: Page visits, clicks on links or buttons.
  - **Common Data Points for All Events**:
    - User-related info: Locale, timezone, userAgent (browser and OS details).
    - Page-related info: Title, Category, Extension name, URL, path, referrer, search parameters.

This ensures a thorough understanding of user interactions with the application while maintaining user anonymity and privacy.

The data will be used only for internal analysis and product improvement.

If you wish to enable telemetry data collection, follow the steps below.

### Enable Telemetry

To turn on the telemetry you need to enable Segment provider plugin.

#### When using Helm Chart

Modify Helm values and add the following configuration:

```yaml
global:
  dynamic:
    plugins:
      - package: './dynamic-plugins/dist/janus-idp-backstage-plugin-analytics-provider-segment'
        disabled: false
```

#### When using RHDH Operator

If you already have `dynamic-plugins-rhdh` ConfigMap as described in [Configuring dynamic plugins with the Red Hat Developer Hub Operator](https://access.redhat.com/documentation/en-us/red_hat_developer_hub/1.1/html-single/administration_guide_for_red_hat_developer_hub/index#configuring-dynamic-plugins-with-the-red-hat-developer-hub-operator) you just need to add the Segment plugin to the list of plugins. Refer to `ConfgiMap` example below.

If you don't have the `dynamic-plugins-rhdh` ConfigMap, you can create it with the following content:

```yaml
kind: ConfigMap
apiVersion: v1
metadata:
  name: dynamic-plugins-rhdh
data:
  dynamic-plugins.yaml: |
    includes:
      - dynamic-plugins.default.yaml
    plugins:
      - package: './dynamic-plugins/dist/janus-idp-backstage-plugin-analytics-provider-segment'
        disabled: false
```

Don't forget to add `dynamicPluginsConfigMapName` referencing the above `ConfigMap` to your `Backstage` resource:

```yaml
spec:
  application:
    dynamicPluginsConfigMapName: dynamic-plugins-rhdh
```

### Customizing Telemetry Destination

By default, the Segment plugin is configured to send data to Red Hat. If you wish to change the destination, you can do so by setting the `SEGMENT_WRITE_KEY` environment variable to the desired Segment write key.

#### When using Helm Chart

Add the following configuration to your

```yaml
upstream:
  backstage:
    extraEnvVars:
      - name: SEGMENT_WRITE_KEY
        value: <segment_key>
```

#### When using RHDH Operator

```yaml
extraEnvs:
  envs:
    - name: SEGMENT_WRITE_KEY
      value: <segment_key>
```

If you wish to subsequently disable telemetry data collection, use one of the following methods described below.

### Disable Telemetry

To turn off Segment telemetry, you need to deactivate the Segment provider plugin

#### Using Helm Chart

When you are using Helm Chart, you need to modify Helm values by adding the following configuration (if the Segment plugin is already present in your configuration, you can just change `disabled: false` to `disabled: true`):

```yaml
global:
  dynamic:
    plugins:
      - package: './dynamic-plugins/dist/janus-idp-backstage-plugin-analytics-provider-segment'
        disabled: true
```

#### When using RHDH Operator

When using RHDH Operator, you need to modify the ConfigMaps used for dynamic plugin configuration. The name of this ConfigMap is specified in `dynamicPluginsConfigMapName` field in your `Backstage` CustomResource.
Usually, it is named as `dynamic-plugins-rhdh`.
To disable Segment provider plugin, add the following configuration (if the Segment plugin is already present in your configuration, you can just change `disabled: false` to `disabled: true`):

```yaml
kind: ConfigMap
apiVersion: v1
metadata:
  name: dynamic-plugins-rhdh
data:
  dynamic-plugins.yaml: |
    includes:
      - dynamic-plugins.default.yaml
    plugins:
      - package: './dynamic-plugins/dist/janus-idp-backstage-plugin-analytics-provider-segment'
        disabled: true
```

### Disable Telemetry for Local Development

When running locally without using the `dynamic-plugins.default.yaml` file, the Segment plugin is not activated by default.
However, if your configuration is based on `dynamic-plugins.default.yaml`, you can disable the Segment plugin by adding the below lines to your configuration file:

```yaml
dynamicPlugins:
  plugins:
    - package: './dynamic-plugins/dist/janus-idp-backstage-plugin-analytics-provider-segment'
      disabled: true
```

Afterward, remove the Segment plugin directory by deleting `dynamic-plugins-root/janus-idp-backstage-plugin-analytics-provider-segment`

### Disabling Telemetry in Continuous Integration (CI) Environments

To disable telemetry while running Backstage in a CI environment, set the `SEGMENT_TEST_MODE` environment variable to `true`. This action deactivates telemetry transmissions.

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

   **Note:** The `-- --` arguments are required to forward the `--dev` argument to every yarn workspace providing an `export-dynamic` script.

5. Copy the required code snippet from `app-config.yaml` into `app-config.local.yaml`. Note: Each plugin has a `# Plugin: <PLUGIN_NAME>` comment above the required code snippet(s).

   - Set your Organization Name

     - ${ORGANIZATION_NAME}: organization name

   - Enable plugins (All plugins have a default of `false`)

     - `${PERMISSION_ENABLED}` Set to `true` to enable RBAC (permission will be available on `http://localhost:7007/permission`).

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

   - Setup the SonarQube instance

     - `${SONARQUBE_URL}` the url at which sonarqube can be found. Mandatory if plugin is enabled
     - `${SONARQUBE_TOKEN}` a sonarqube [token](https://docs.sonarqube.org/9.8/user-guide/user-account/generating-and-using-tokens/) with enough permission to read all the SonaQube projects. Mandatory if plugin is enabled

   - Setup a Jenkins instance and then pass the following environment variables to backstage:

     - `${JENKINS_URL}` with the URL where your Jenkins instance can be accessed
     - `${JENKINS_USERNAME}` with the name of the user to be accessed through the API
     - `${JENKINS_TOKEN}` with the API token to be used

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

     - Refer to the [authentication documentation](./auth.md) for the available auth providers and the steps to configure them.

   - Setup the RBAC plugin

     - This [URL](https://github.com/janus-idp/backstage-plugins/tree/main/plugins/rbac-backend) explains how to use the RBAC Backend Plugin.

       - Requires the use of an identity provider. This plugin will not work with guest accounts.

     - Set `backend.auth.keys` to a generated base64 secret. This [URL](https://backstage.io/docs/auth/service-to-service-auth/#setup) has more information on setting up a key for service-to-service authentication.

       ```yaml
       backend:
         auth:
           keys:
             - secret: ${BACKEND_SECRET}
       ```

     - Enable and configure policy admins. Replace USERNAME with the username you used to sign into Showcase.

       ```yaml
       permission:
         enabled: true
         rbac:
           admin:
             users:
               - name: user:default/<USERNAME>
       ```

     - Add permission policies via file. Create a rbac policy csv at the root of the showcase repository named `rbac-policy.csv` and fill it with the information below. This example will grant read access to catalog entities for your user.

       ```csv
       p, role:default/team_a, catalog-entity, read, allow

       g, user:default/<USERNAME>, role:default/team_a
       ```

     - Add the `rbac-policy.csv` to the config file.

       ```yaml
       permission:
         enabled: true
         rbac:
           policies-csv-file: ../../rbac-policy.csv
           admin:
             users:
               - name: user:default/<USERNAME>
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

6. Start the application using `yarn start`

7. Navigate to <http://localhost:3000>

## Running with Helm

COMING SOON

## Deploying with ArgoCD

COMING SOON
