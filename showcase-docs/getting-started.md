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

   enabled:
     kubernetes: ${K8S_ENABLED}
     techdocs: ${TECHDOCS_ENABLED}
     argocd: ${ARGOCD_ENABLED}
     sonarqube: ${SONARQUBE_ENABLED}
     keycloak: ${KEYCLOAK_ENABLED}
     ocm: ${OCM_ENABLED}
     github: ${GITHUB_ENABLED}
     githubOrg: ${GITHUB_ORG_ENABLED}

   proxy:
     '/sonarqube':
       target: ${SONARQUBE_URL}/api
       allowedMethods: ['GET']
       auth: ${SONARQUBE_TOKEN}

   sonarqube:
     baseUrl: ${SONARQUBE_URL}
     apiKey: ${SONARQUBE_TOKEN}

   integrations:
     github:
       - host: github.com
         # This is a GitHub App. You can find out how to generate this file, and more information
         # about setting up the GitHub integration here: https://backstage.io/docs/integrations/github/github-apps
         apps:
           - $include: github-app-backstage-showcase-credentials.local.yaml

   techdocs:
     builder: ${TECHDOCS_BUILDER_TYPE}
     generator:
       runIn: ${TECHDOCS_GENERATOR_TYPE}
     publisher:
       type: ${TECHDOCS_PUBLISHER_TYPE}
       awsS3:
         bucketName: ${BUCKET_NAME}
         region: ${BUCKET_REGION_VAULT}
         endpoint: ${BUCKET_URL}
         s3ForcePathStyle: true
         credentials:
           accessKeyId: ${AWS_ACCESS_KEY_ID}
           secretAccessKey: ${AWS_SECRET_ACCESS_KEY}

   auth:
     environment: development
     providers:
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

         ocm:
           hub:
             name: ${OCM_HUB_NAME}
             url: ${OCM_HUB_URL}
             serviceAccountToken: ${moc_infra_token}
             owner: # Existing catalog entity (User or Group) as the owner of the discovered clusters

         githubOrg:
           default:
             id: production
             orgUrl: ${GITHUB_ORG_URL}

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

     argocd:
       username: ${ARGOCD_USERNAME}
       password: ${ARGOCD_PASSWORD}
       appLocatorMethods:
         - type: 'config'
           instances:
             - name: argoInstance1
               url: ${ARGOCD_INSTANCE1_URL}
               token: ${ARGOCD_AUTH_TOKEN}
             - name: argoInstance2
               url: ${ARGOCD_INSTANCE2_URL}
               token: ${ARGOCD_AUTH_TOKEN2}
   ```

   - Enable plugins

     - `${K8S_ENABLED}` Set to `true` to enable the Kubernetes backend plugin. Default is `false`
     - `${TECHDOCS_ENABLED}` Set to `true` to enable the Techdocs backend plugin. Default is `false`
     - `${ARGOCD_ENABLED}` Set to `true` to enable the ArgoCD backend plugin. Default is `false`
     - `${SONARQUBE_ENABLED}` Set to `true` to enable the SonarQube backend plugin. Default is `false`
     - `${KEYCLOAK_ENABLED}` Set to `true` to enable the Keycloak backend plugin. Default is `false`
     - `${OCM_ENABLED}` Set to `true` to enable the OCM backend plugin. Default is `false`
     - `${GITHUB_ENABLED}` Set to `true` to enable the GitHub Entity backend plugin. Default is `false`
     - `${GITHUB_ORG_ENABLED}` Set to `true` to enable the GitHub Org Entity backend plugin. Default is `false`
     - `${GITLAB_ENABLED}` Set to `true` to enable the GitLab Entity backend plugin. Default is `false`

   - Setup a GitHub app (Needed for the GitHub Issues, GitHub Pull Request plugins) and replace the variables

     - This [URL](https://backstage.io/docs/integrations/github/github-apps) can be used to quickly create a GitHub app, you can name the yaml file `github-app-backstage-showcase-credentials.local.yaml`
     - `${GITHUB_APP_CLIENT_ID}` with the client id
     - `${GITHUB_APP_CLIENT_SECRET}` with the client secret

   - Setup a GitLab personal access token (Needed for the GitLab plugin) and replace the variables

     - `${GITLAB_TOKEN}` with the personal access token

   - Setup one to two ArgoCD instances (Needed for the ArgoCD backend plugin) and replace the following variables

     - If using a shared username and password across the instances, you can define them in the username and password variables and arbitrarily assign the urls and tokens
     - If using tokens for each individual instance, you can assign arbitrary variables to the tokens
     - `${ARGOCD_USERNAME}` Username for the instance(s)
     - `${ARGOCD_PASSWORD}` Password for the instance(s)
     - `${ARGOCD_INSTANCE1_URL}` with the URL to the instance
     - `${ARGOCD_AUTH_TOKEN}` with the token to the instance
     - `${ARGOCD_INSTANCE2_URL}` with the URL to the instance
     - `${ARGOCD_AUTH_TOKEN2}` with the token to the instance

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

   - Setup a SonarQube instance then pass the following environment variables to backstage:

     - `${SONARQUBE_URL}` the url at which sonarqube can be found. Mandatory if plugin is enabled
     - `${SONARQUBE_TOKEN}` a sonarqube [token](https://docs.sonarqube.org/9.8/user-guide/user-account/generating-and-using-tokens/) with enough permission to read all the SonaQube projects. Mandatory if plugin is enabled

   - Setup Techdocs with an external S3 bucket storage
     - `${TECHDOCS_BUILDER_TYPE}` Set to 'local' for simple setup, or 'external' to use a pipeline
     - `${TECHDOCS_GENERATOR_TYPE}` Set to 'local' for most of the use cases. You can use also 'docker'
     - `${TECHDOCS_PUBLISHER_TYPE}` Set to 'local' for simple setup, or 'awsS3' to use a S3 storage. 'googleGcs' is not supported at the moment.
     - `${BUCKET_NAME}` the bucket name
     - `${BUCKET_REGION_VAULT}` the bucket region
     - `${BUCKET_URL}` the bucket url
     - `${AWS_ACCESS_KEY_ID}` the AWS credentials Key Id
     - `${AWS_SECRET_ACCESS_KEY}` the AWS credentials Access Key

3. Run `yarn install` to install the dependencies

4. Start the application using `yarn start`

5. Navigate to <http://localhost:3000>

## Running with Helm

COMING SOON

## Deploying with ArgoCD

COMING SOON
