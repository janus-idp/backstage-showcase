#!/bin/sh

set -e

function cleanup {
    echo "Cleaning up before exiting"
    helm uninstall ${RELEASE_NAME} -n ${NAME_SPACE}
    oc delete namespace ${NAME_SPACE}
    rm -rf ~/tmpbin
}

# This will run the 'cleanup' function on exit, regardless of exit status:
trap cleanup EXIT

add_helm_repos() {
    # check installed helm version
    helm version

    # Check if the bitnami repository already exists
    if ! helm repo list | grep -q "^bitnami"; then
        helm repo add bitnami https://charts.bitnami.com/bitnami
    else
        echo "Repository bitnami already exists - updating repository instead."
    fi

    # Check if the backstage repository already exists
    if ! helm repo list | grep -q "^backstage"; then
        helm repo add backstage https://backstage.github.io/charts
    else
        echo "Repository backstage already exists - updating repository instead."
    fi
    
    # Check if the backstage repository already exists
    if ! helm repo list | grep -q "^janus-idp"; then
        helm repo add janus-idp https://janus-idp.github.io/helm-backstage
    else
        echo "Repository janus-idp already exists - updating repository instead."
    fi
    
    # Check if the repository already exists
    if ! helm repo list | grep -q "^${HELM_REPO_NAME}"; then
        helm repo add "${HELM_REPO_NAME}" "${HELM_REPO_URL}"
    else
        echo "Repository ${HELM_REPO_NAME} already exists - updating repository instead."
    fi

    helm repo update
}

# install the latest ibmcloud cli on Linux
install_ibmcloud() {
  if [[ -x "$(command -v ibmcloud)" ]]; then
    echo "ibmcloud is already installed."
  else
    curl -fsSL https://clis.cloud.ibm.com/install/linux | sh
    echo "the latest ibmcloud cli installed successfully."
  fi
}

install_oc() {
  if [[ -x "$(command -v oc)" ]]; then
    echo "oc is already installed."
  else
    curl -LO https://mirror.openshift.com/pub/openshift-v4/clients/oc/latest/linux/oc.tar.gz
    tar -xf oc.tar.gz
    mv oc /usr/local/bin/
    rm oc.tar.gz
    echo "oc installed successfully."
  fi
}

install_helm() {
  if [[ -x "$(command -v helm)" ]]; then
    echo "Helm is already installed."
  else
    echo "Installing Helm 3 client"
    mkdir ~/tmpbin && cd ~/tmpbin

    HELM_INSTALL_DIR=$(pwd)
    curl -sL https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash -f
    export PATH=${HELM_INSTALL_DIR}:$PATH
    echo "helm client installed successfully."
  fi
}

LOGFILE="pr-${GIT_PR_NUMBER}-openshift-tests-${BUILD_NUMBER}"
echo "Log file: ${LOGFILE}"
# source ./.ibm/pipelines/functions.sh

# install ibmcloud
install_ibmcloud

ibmcloud version
ibmcloud config --check-version=false
ibmcloud plugin install -f container-registry
ibmcloud plugin install -f kubernetes-service

# Using pipeline configuration - environment properties
ibmcloud login -r "${IBM_REGION}" -g "${IBM_RSC_GROUP}" --apikey "${SERVICE_ID_API_KEY}"
ibmcloud oc cluster config --cluster "${OPENSHIFT_CLUSTER_ID}"

install_oc

oc version --client
# oc login -u apikey -p "${SERVICE_ID_API_KEY}" --server="${IBM_OPENSHIFT_ENDPOINT}"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "$DIR"

oc login --token=${K8S_CLUSTER_TOKEN} --server=${K8S_CLUSTER_URL}

# refresh the name space if exists
if oc get namespace ${NAME_SPACE} > /dev/null 2>&1; then
    echo "Namespace ${NAME_SPACE} already exists! refreshing namespace"
    oc delete namespace ${NAME_SPACE}
fi
oc create namespace ${NAME_SPACE}

oc config set-context --current --namespace=${NAME_SPACE}

install_helm

cd $DIR

# Change the namespace of the resources to the one namespace set above
sed -i "s/namespace:.*/namespace: $NAME_SPACE/g" $DIR/resources/service_account/service-account-rhdh.yaml
sed -i "s/namespace:.*/namespace: $NAME_SPACE/g" $DIR/resources/cluster_role_binding/cluster-role-binding-k8s.yaml
sed -i "s/namespace:.*/namespace: $NAME_SPACE/g" $DIR/resources/cluster_role_binding/cluster-role-binding-ocm.yaml

sed -i "s/backstage.io\/kubernetes-id:.*/backstage.io\/kubernetes-id: $K8S_PLUGIN_ANNOTATION/g" $DIR/resources/deployment/deployment-test-app-component.yaml

sed -i "s/GITHUB_APP_APP_ID:.*/GITHUB_APP_APP_ID: $GITHUB_APP_APP_ID/g" $DIR/auth/secrets-rhdh-secrets.yaml
sed -i "s/GITHUB_APP_CLIENT_ID:.*/GITHUB_APP_CLIENT_ID: $GITHUB_APP_CLIENT_ID/g" $DIR/auth/secrets-rhdh-secrets.yaml
sed -i "s/GITHUB_APP_PRIVATE_KEY:.*/GITHUB_APP_PRIVATE_KEY: $GITHUB_APP_PRIVATE_KEY/g" $DIR/auth/secrets-rhdh-secrets.yaml
sed -i "s/GITHUB_APP_CLIENT_SECRET:.*/GITHUB_APP_CLIENT_SECRET: $GITHUB_APP_CLIENT_SECRET/g" $DIR/auth/secrets-rhdh-secrets.yaml
sed -i "s/GITHUB_APP_WEBHOOK_URL:.*/GITHUB_APP_WEBHOOK_URL: $GITHUB_APP_WEBHOOK_URL/g" $DIR/auth/secrets-rhdh-secrets.yaml
sed -i "s/GITHUB_APP_WEBHOOK_SECRET:.*/GITHUB_APP_WEBHOOK_SECRET: $GITHUB_APP_WEBHOOK_SECRET/g" $DIR/auth/secrets-rhdh-secrets.yaml

oc apply -f $DIR/resources/service_account/service-account-rhdh.yaml --namespace=${NAME_SPACE}
oc apply -f $DIR/auth/service-account-rhdh-secret.yaml --namespace=${NAME_SPACE}
oc apply -f $DIR/auth/secrets-rhdh-secrets.yaml --namespace=${NAME_SPACE}

oc apply -f $DIR/resources/deployment/deployment-test-app-component.yaml --namespace=${NAME_SPACE}

oc new-app https://github.com/janus-qe/test-backstage-customization-provider --namespace=${NAME_SPACE}
oc expose svc/test-backstage-customization-provider --namespace=${NAME_SPACE}

oc apply -f $DIR/resources/cluster_role/cluster-role-k8s.yaml 
oc apply -f $DIR/resources/cluster_role_binding/cluster-role-binding-k8s.yaml 
oc apply -f $DIR/resources/cluster_role/cluster-role-ocm.yaml
oc apply -f $DIR/resources/cluster_role_binding/cluster-role-binding-ocm.yaml

# obtain K8S_CLUSTER_NAME, K8S_CLUSTER_API_SERVER_URL and add them to secrets-rhdh-secrets.yaml
# K8S_SERVICE_ACCOUNT_TOKEN will be replaced
oc get secret rhdh-k8s-plugin-secret -o yaml > $DIR/auth/service-account-rhdh-token.yaml

TOKEN=$(grep 'token:' $DIR/auth/service-account-rhdh-token.yaml | awk '{print $2}')

sed -i "s/K8S_SERVICE_ACCOUNT_TOKEN:.*/K8S_SERVICE_ACCOUNT_TOKEN: $TOKEN/g" $DIR/auth/secrets-rhdh-secrets.yaml

# Cleanup temp file
rm $DIR/auth/service-account-rhdh-token.yaml

# oc apply -f $DIR/auth/rhdh-quay-pull-secret.yaml --namespace=${NAME_SPACE}

# re-apply with the updated cluster service account token
oc apply -f $DIR/auth/secrets-rhdh-secrets.yaml --namespace=${NAME_SPACE}
oc apply -f $DIR/resources/config_map/configmap-app-config-rhdh.yaml --namespace=${NAME_SPACE}

add_helm_repos

helm upgrade -i ${RELEASE_NAME} -n ${NAME_SPACE} ${HELM_REPO_NAME}/${HELM_IMAGE_NAME} -f $DIR/value_files/${HELM_CHART_VALUE_FILE_NAME} --set global.clusterRouterBase=${K8S_CLUSTER_ROUTER_BASE}

echo "Waiting for backstage deployment..."
sleep 60

echo "Display pods for verification..."
oc get pods -n ${NAME_SPACE}

# Check if Backstage is up and running
BACKSTAGE_URL_RESPONSE=$(curl -Is "https://${RELEASE_NAME}-${NAME_SPACE}.${K8S_CLUSTER_ROUTER_BASE}" | head -n 1)
echo "$BACKSTAGE_URL_RESPONSE"

cd $DIR/../../e2e-test
yarn install

Xvfb :99 &
export DISPLAY=:99

yarn run cypress:run --config baseUrl="https://${RELEASE_NAME}-${NAME_SPACE}.${K8S_CLUSTER_ROUTER_BASE}"

pkill Xvfb
