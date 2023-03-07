# Getting Started running Backstage Showcase

There are several different methods for running the Backstage Showcase app today. We currently have support for running the application locally, using a helm chart to deploy to a cluster, and manifests for deployment using ArgoCD.

## Running Locally

The easiest and fastest method for getting started with the Backstage Showcase app, running it locally only requires a few simple steps.

1. Create an app-config.local.yaml file that will be used for storing the environment variables that the showcase app needs

2. Copy the below into the app-config.local.yaml file

   ***

   **NOTE**

   We currently utilize several plugins that require environment variables to be setup prior to running the showcase app

   All of these variables can be changed to "temp" if you only need the app up to test new functionality

   Otherwise to test a specific plugin or the entire app, one will need to setup and get each of these variables

   ***

   ```yaml
   # This is a GitHub App. You can find out how to generate this file, and more information
   # about setting up the GitHub integration here: https://backstage.io/docs/integrations/github/github-apps
   integrations:
     github:
       - host: github.com
         apps:
           - $include: github-app-backstage-showcase-credentials.local.yaml

   auth:
     environment: development
     providers:
       github:
         development:
           clientId: ${AUTH_GITHUB_CLIENT_ID}
           clientSecret: ${AUTH_GITHUB_CLIENT_SECRET}

   catalog:
     providers:
       keycloakOrg:
         default:
           baseUrl: ${KEYCLOAK_BASE_URL}
           loginRealm: ${KEYCLOAK_LOGIN_REALM}
           realm: ${KEYCLOAK_REALM}
           clientId: ${KEYCLOAK_CLIENT_ID}
           clientSecret: ${KEYCLOAK_CLIENT_SECRET}

   kubernetes:
     serviceLocatorMethod:
       type: 'multiTenant'
     clusterLocatorMethods:
       - type: 'config'
         clusters:
           - name: ${K8S_CLUSTER_NAME}
             url: ${K8S_CLUSTER_URL}
             authProvider: 'serviceAccount'
             skipTLSVerify: true
             serviceAccountToken: ${K8S_CLUSTER_TOKEN}

   ocm:
     hub:
       name: ${OCM_HUB_NAME}
       url: ${OCM_HUB_URL}
       serviceAccountToken: ${moc_infra_token}
   ```

   - Setup a GitHub app (Needed for the GitHub Issues, GitHub Pull Request plugins) and replace the variables

     - This [URL](https://backstage.io/docs/integrations/github/github-apps) can be used to quickly create a GitHub app, you can name the yaml file `github-app-backstage-showcase-credentials.local.yaml`
     - `${GITHUB_APP_CLIENT_ID}` with the client id
     - `${GITHUB_APP_CLIENT_SECRET}` with the client secret

   - Setup a Keycloak instance (Needed for the Keycloak plugin) and replace the following variables

     - `${KEYCLOAK_BASE_URL}` with the base URL of the Keycloak instance
     - `${KEYCLOAK_LOGIN_REALM}` with the login realm
     - `${KEYCLOAK_REALM}` with the realm
     - `${KEYCLOAK_CLIENT_ID}` with the client id
     - `${KEYCLOAK_CLIENT_SECRET}` with the client secret

   - Setup a kubernetes cluster (Needed for the Kubernetes plugin) and replace the following variables

     - `${K8S_CLUSTER_NAME}` with the cluster name
     - `${K8S_CLUSTER_URL}` with the cluster url
     - `${K8S_CLUSTER_TOKEN}` with the cluster token

   - Setup up Open Cluster Management, have access to another cluster (Needed for the OCM plugin), and replace the following variables
     - `${OCM_HUB_NAME}` with the hub cluster name
     - `${OCM_HUB_URL}` with the hub cluster url
     - `${moc_infra_token}` with the hub token

3. Run `yarn install` to install the dependencies

4. Start the application using `yarn start`

5. Navigate to <http://localhost:3000>

## Running with Helm

COMING SOON

## Deploying with ArgoCD

COMING SOON
