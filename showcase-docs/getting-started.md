# Getting Started running Backstage Showcase

There are several different methods for running the Backstage Showcase app today. We currently have support for running the application locally, using a helm chart to deploy to a cluster, and manifests for deployment using ArgoCD.

## Running Locally

The easiest and fastest method for getting started: Backstage Showcase app, running it locally only requires a few simple steps.

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
   # about setting up the GitHub integration here: <https://backstage.io/docs/integrations/github/github-apps>

   enabled:
     kubernetes: ${K8S_ENABLED}
     techdocs: ${TECHDOCS_ENABLED}
     argocd: ${ARGOCD_ENABLED}
     sonarqube: ${SONARQUBE_ENABLED}
     keycloak: ${KEYCLOAK_ENABLED}
     ocm: ${OCM_ENABLED}
     github: ${GITHUB_ENABLED}
     githubOrg: ${GITHUB_ORG_ENABLED}
     gitlab: ${GITLAB_ENABLED}
     azureDevOps: ${AZURE_ENABLED}
     jenkins: ${JENKINS_ENABLED}

   backend:
     baseUrl: http://localhost:7007
     listen:
       port: 7007
     csp:
       connect-src:
         - "'self'"
         - 'http:'
         - 'https:'
       img-src:
         - "'self'"
         - 'data:'
         - ${JIRA_URL}
     cors:
       origin: <http://localhost:3000>
       methods: [GET, HEAD, PATCH, POST, PUT, DELETE]
       credentials: true
     database:
       client: better-sqlite3
       connection: ':memory:'
     cache:
       store: memory

   proxy:
     '/sonarqube':
       target: ${SONARQUBE_URL}/api
       allowedMethods: ['GET']
       auth: ${SONARQUBE_TOKEN}

     '/jenkins/api':
       target: ${JENKINS_URL}
       headers:
         Authorization: ${JENKINS_TOKEN}

     '/jira/api':
       target: ${JIRA_URL}
       headers:
         Authorization: ${JIRA_TOKEN}
         Accept: 'application/json'
         Content-Type: 'application/json'
         X-Atlassian-Token: 'no-check'
         User-Agent: ${JIRA_USER_AGENT}

     '/jfrog-artifactory/api':
       target: ${ARTIFACTORY_URL}
       headers:
         Authorization: Bearer ${ARTIFACTORY_TOKEN}
       secure: ${ARTIFACTORY_SECURE}

   sonarqube:
     baseUrl: ${SONARQUBE_URL}
     apiKey: ${SONARQUBE_TOKEN}

   integrations:
     github:
       - host: github.com
         apps:
           - $include: github-app-backstage-showcase-credentials.local.yaml
     gitlab:
       - host: gitlab.com
         token: ${GITLAB_TOKEN}

     azure:
       - host: dev.azure.com
         token: ${AZURE_TOKEN}

   azureDevOps:
     host: dev.azure.com
     token: ${AZURE_TOKEN}
     organization: ${AZURE_ORG}

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
             clientId: ${GITHUB_APP_CLIENT_ID}
             clientSecret: ${GITHUB_APP_CLIENT_SECRET}

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
             owner: example-owner

         githubOrg:
           default:
             id: production
             orgUrl: ${GITHUB_ORG_URL}

     kubernetes:
       customResources:
         - group: 'tekton.dev'
           apiVersion: 'v1beta1'
           plural: 'pipelineruns'
         - group: 'tekton.dev'
           apiVersion: 'v1beta1'
           plural: 'taskruns'
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

     jenkins:
       baseUrl: ${JENKINS_URL}
       username: ${JENKINS_USERNAME}
       apiKey: ${JENKINS_TOKEN}
   ```

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

   - Setup the GitHub plugins (GitHub Issues and GitHub Pull Request)

     - This [URL](https://backstage.io/docs/integrations/github/github-apps) can be used to quickly create a GitHub app, you can name the yaml file `github-app-backstage-showcase-credentials.local.yaml`
     - `${GITHUB_APP_CLIENT_ID}`: client id
     - `${GITHUB_APP_CLIENT_SECRET}`: client secret

   - Setup the GitLab plugin

     - This [URL](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html) can be used to quickly create a GitLab personal access token
     - `${GITLAB_TOKEN}`: personal access token

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

3. Run `yarn install` to install the dependencies

4. Start the application using `yarn start`

5. Navigate to <http://localhost:3000>

## Running with Helm

COMING SOON

## Deploying with ArgoCD

COMING SOON
