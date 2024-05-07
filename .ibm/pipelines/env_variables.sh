#!/bin/bash
set -a  # Automatically export all variables

#ENVS and Vault Secrets
HELM_CHART_VALUE_FILE_NAME="values_showcase.yaml"
HELM_IMAGE_NAME=backstage
HELM_REPO_NAME=rhdh-chart
HELM_REPO_URL="https://redhat-developer.github.io/rhdh-chart"
K8S_CLUSTER_ROUTER_BASE="rhdh-pr-os-a9805650830b22c3aee243e51d79565d-0000.us-east.containers.appdomain.cloud"
K8S_CLUSTER_TOKEN=$(cat /tmp/secrets/K8S_CLUSTER_TOKEN)
K8S_CLUSTER_URL=https://c100-e.us-east.containers.cloud.ibm.com:32212
OPENSHIFT_CLUSTER_ID=cobct3kw0lbiltuijvmg

RELEASE_NAME=rhdh
RELEASE_NAME_RBAC=rhdh-rbac
NAME_SPACE=showcase
NAME_SPACE_RBAC=showcase-rbac
CHART_VERSION="2.15.2"
GITHUB_APP_APP_ID=Mzc2ODY2
GITHUB_APP_CLIENT_ID=SXYxLjdiZDNlZDFmZjY3MmY3ZDg=
GITHUB_APP_PRIVATE_KEY=$(cat /tmp/secrets/GITHUB_APP_PRIVATE_KEY)
GITHUB_APP_CLIENT_SECRET=$(cat /tmp/secrets/GITHUB_APP_CLIENT_SECRET)
GITHUB_APP_WEBHOOK_URL=aHR0cHM6Ly9zbWVlLmlvL0NrRUNLYVgwNzhyZVhobEpEVzA=
GITHUB_APP_WEBHOOK_SECRET=$(cat /tmp/secrets/GITHUB_APP_WEBHOOK_SECRET)
GITHUB_URL=aHR0cHM6Ly9naXRodWIuY29t
GITHUB_ORG=amFudXMtcWU=
GH_USER_ID=$(cat /tmp/secrets/GH_USER_ID)
GH_USER_PASS=$(cat /tmp/secrets/GH_USER_PASS)
GH_2FA_SECRET=$(cat /tmp/secrets/GH_2FA_SECRET)
GH_RHDH_QE_USER_TOKEN=$(cat /tmp/secrets/GH_RHDH_QE_USER_TOKEN)

K8S_CLUSTER_NAME=Y29iY3Qza3cwbGJpbHR1aWp2bWc=
K8S_CLUSTER_API_SERVER_URL=aHR0cHM6Ly9jMTAwLWUudXMtZWFzdC5jb250YWluZXJzLmNsb3VkLmlibS5jb206MzIyMTI=
K8S_SERVICE_ACCOUNT_TOKEN=$(cat /tmp/secrets/K8S_SERVICE_ACCOUNT_TOKEN)
OCM_CLUSTER_URL=aHR0cHM6Ly9jMTAwLWUudXMtZWFzdC5jb250YWluZXJzLmNsb3VkLmlibS5jb206MzIyMTI=
OCM_CLUSTER_TOKEN=$(cat /tmp/secrets/OCM_CLUSTER_TOKEN)
KEYCLOAK_BASE_URL='https://keycloak-keycloak.rhdh-pr-os-a9805650830b22c3aee243e51d79565d-0000.us-east.containers.appdomain.cloud'
KEYCLOAK_LOGIN_REALM='myrealm'
KEYCLOAK_REALM='myrealm'
KEYCLOAK_CLIENT_ID='myclient'
KEYCLOAK_CLIENT_SECRET=$(cat /tmp/secrets/KEYCLOAK_CLIENT_SECRET)
ACR_SECRET=$(cat /tmp/secrets/ACR_SECRET)
DH_TARGET_URL=aHR0cDovL3Rlc3QtYmFja3N0YWdlLWN1c3RvbWl6YXRpb24tcHJvdmlkZXItc2hvd2Nhc2UtY2kucmhkaC1wci1vcy1hOTgwNTY1MDgzMGIyMmMzYWVlMjQzZTUxZDc5NTY1ZC0wMDAwLnVzLWVhc3QuY29udGFpbmVycy5hcHBkb21haW4uY2xvdWQ=
GOOGLE_CLIENT_ID=$(cat /tmp/secrets/GOOGLE_CLIENT_ID)
GOOGLE_CLIENT_SECRET=$(cat /tmp/secrets/GOOGLE_CLIENT_SECRET)
GOOGLE_ACC_COOKIE=$(cat /tmp/secrets/GOOGLE_ACC_COOKIE)
GOOGLE_USER_ID=$(cat /tmp/secrets/GOOGLE_USER_ID)
GOOGLE_USER_PASS=$(cat /tmp/secrets/GOOGLE_USER_PASS)

DATA_ROUTER_URL="https://api-dno-datarouter.apps.ocp-c1.prod.psi.redhat.com"
DATA_ROUTER_USERNAME=$(cat /tmp/secrets/DATA_ROUTER_USERNAME)
DATA_ROUTER_PASSWORD=$(cat /tmp/secrets/DATA_ROUTER_PASSWORD)
DATA_ROUTER_PROJECT="main"
REPORTPORTAL_HOSTNAME="reportportal-rhdh-backstage-qe.apps.ocp-c1.prod.psi.redhat.com"

set +a  # Stop automatically exporting variables
