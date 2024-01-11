#!/bin/sh

set -e

# Global variables
LOGFILE="pr-${GIT_PR_NUMBER}-openshift-tests-${BUILD_NUMBER}"
TEST_NAME="backstage-showcase Tests"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cleanup() {
  echo "Cleaning up before exiting"
  helm uninstall ${RELEASE_NAME} -n ${NAME_SPACE}
  oc delete namespace ${NAME_SPACE}
  rm -rf ~/tmpbin
}

trap cleanup EXIT

add_helm_repos() {
  helm version

  declare -a repos=("bitnami=https://charts.bitnami.com/bitnami" "backstage=https://backstage.github.io/charts" "janus-idp=https://janus-idp.github.io/helm-backstage" "${HELM_REPO_NAME}=${HELM_REPO_URL}")

  for repo in "${repos[@]}"; do
    key="${repo%%=*}"
    value="${repo##*=}"

    if ! helm repo list | grep -q "^$key"; then
      helm repo add "$key" "$value"
    else
      echo "Repository $key already exists - updating repository instead."
    fi
  done

  helm repo update
}

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

configure_namespace() {
  if oc get namespace ${NAME_SPACE} >/dev/null 2>&1; then
    echo "Namespace ${NAME_SPACE} already exists! refreshing namespace"
    oc delete namespace ${NAME_SPACE}
  fi
  oc create namespace ${NAME_SPACE}
  oc config set-context --current --namespace=${NAME_SPACE}
}

apply_yaml_files() {
  local dir=$1

  # Update namespace and other configurations in YAML files
  local files=("$dir/resources/service_account/service-account-rhdh.yaml"
    "$dir/resources/cluster_role_binding/cluster-role-binding-k8s.yaml"
    "$dir/resources/cluster_role_binding/cluster-role-binding-ocm.yaml"
    "$dir/resources/deployment/deployment-test-app-component.yaml"
    "$dir/auth/secrets-rhdh-secrets.yaml")
  
  for file in "${files[@]}"; do
    sed -i "s/namespace:.*/namespace: $NAME_SPACE/g" "$file"
  done

  # Add additional configurations
  sed -i "s/backstage.io\/kubernetes-id:.*/backstage.io\/kubernetes-id: $K8S_PLUGIN_ANNOTATION/g" "$dir/resources/deployment/deployment-test-app-component.yaml"

  for key in GITHUB_APP_APP_ID GITHUB_APP_CLIENT_ID GITHUB_APP_PRIVATE_KEY GITHUB_APP_CLIENT_SECRET GITHUB_APP_WEBHOOK_URL GITHUB_APP_WEBHOOK_SECRET KEYCLOAK_CLIENT_SECRET OCM_CLUSTER_TOKEN; do
    sed -i "s/$key:.*/$key: ${!key}/g" "$dir/auth/secrets-rhdh-secrets.yaml"
  done

  oc apply -f $dir/resources/service_account/service-account-rhdh.yaml --namespace=${NAME_SPACE}
  oc apply -f $dir/auth/service-account-rhdh-secret.yaml --namespace=${NAME_SPACE}
  oc apply -f $dir/auth/secrets-rhdh-secrets.yaml --namespace=${NAME_SPACE}
  oc apply -f $dir/resources/deployment/deployment-test-app-component.yaml --namespace=${NAME_SPACE}
  oc new-app https://github.com/janus-qe/test-backstage-customization-provider --namespace=${NAME_SPACE}
  oc expose svc/test-backstage-customization-provider --namespace=${NAME_SPACE}
  oc apply -f $dir/resources/cluster_role/cluster-role-k8s.yaml
  oc apply -f $dir/resources/cluster_role_binding/cluster-role-binding-k8s.yaml
  oc apply -f $dir/resources/cluster_role/cluster-role-ocm.yaml
  oc apply -f $dir/resources/cluster_role_binding/cluster-role-binding-ocm.yaml

  # obtain K8S_CLUSTER_NAME, K8S_CLUSTER_API_SERVER_URL and add them to secrets-rhdh-secrets.yaml
  # K8S_SERVICE_ACCOUNT_TOKEN will be replaced
  oc get secret rhdh-k8s-plugin-secret -o yaml >$dir/auth/service-account-rhdh-token.yaml

  TOKEN=$(grep 'token:' $dir/auth/service-account-rhdh-token.yaml | awk '{print $2}')

  sed -i "s/K8S_SERVICE_ACCOUNT_TOKEN:.*/K8S_SERVICE_ACCOUNT_TOKEN: $TOKEN/g" $dir/auth/secrets-rhdh-secrets.yaml

  # Cleanup temp file
  rm $dir/auth/service-account-rhdh-token.yaml

  # oc apply -f $dir/auth/rhdh-quay-pull-secret.yaml --namespace=${NAME_SPACE}

  # re-apply with the updated cluster service account token
  oc apply -f $dir/auth/secrets-rhdh-secrets.yaml --namespace=${NAME_SPACE}
  oc apply -f $dir/resources/config_map/configmap-app-config-rhdh.yaml --namespace=${NAME_SPACE}
}

run_tests() {
  cd $DIR/../../e2e-tests
  yarn install

  Xvfb :99 &
  export DISPLAY=:99

  (
    set -e
    echo Using PR container image: pr-${GIT_PR_NUMBER}-${SHORT_SHA}
    yarn run cypress:run --config baseUrl="https://${RELEASE_NAME}-${NAME_SPACE}.${K8S_CLUSTER_ROUTER_BASE}"
  ) |& tee "/tmp/${LOGFILE}"

  RESULT=${PIPESTATUS[0]}

  pkill Xvfb

  set -x
  pwd
  ls
  ls $DIR/../../e2e-tests/cypress/results/junit

  save_logs "${LOGFILE}" "${TEST_NAME}" ${RESULT}
  save_junit

  exit ${RESULT}
}

check_backstage_running() {
  # Check if Backstage is up and running
  BACKSTAGE_URL_RESPONSE=$(curl -Is "https://${RELEASE_NAME}-${NAME_SPACE}.${K8S_CLUSTER_ROUTER_BASE}" | head -n 1)
  echo "$BACKSTAGE_URL_RESPONSE"
}

main() {
  echo "Log file: ${LOGFILE}"

  source ./.ibm/pipelines/functions.sh
  skip_if_only

  DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  install_ibmcloud
  ibmcloud version
  ibmcloud config --check-version=false
  ibmcloud plugin install -f container-registry
  ibmcloud plugin install -f kubernetes-service
  ibmcloud login -r "${IBM_REGION}" -g "${IBM_RSC_GROUP}" --apikey "${SERVICE_ID_API_KEY}"
  ibmcloud oc cluster config --cluster "${OPENSHIFT_CLUSTER_ID}"

  install_oc
  oc version --client
  oc login --token=${K8S_CLUSTER_TOKEN} --server=${K8S_CLUSTER_URL}

  configure_namespace
  install_helm

  cd $DIR
  apply_yaml_files $DIR

  add_helm_repos

  GIT_PR_RESPONSE=$(curl -s "https://api.github.com/repos/${GITHUB_ORG_NAME}/${GITHUB_REPOSITORY_NAME}/pulls/${GIT_PR_NUMBER}")
  LONG_SHA=$(echo "$GIT_PR_RESPONSE" | jq -r '.head.sha')
  SHORT_SHA=$(git rev-parse --short ${LONG_SHA})

  echo "Tag name with short SHA: pr-${GIT_PR_NUMBER}-${SHORT_SHA}"

  helm upgrade -i ${RELEASE_NAME} -n ${NAME_SPACE} ${HELM_REPO_NAME}/${HELM_IMAGE_NAME} --version ${CHART_VERSION} -f $DIR/value_files/${HELM_CHART_VALUE_FILE_NAME} --set global.clusterRouterBase=${K8S_CLUSTER_ROUTER_BASE} --set upstream.backstage.image.tag=pr-${GIT_PR_NUMBER}-${SHORT_SHA}

  echo "Waiting for backstage deployment..."
  sleep 500

  echo "Display pods for verification..."
  oc get pods -n ${NAME_SPACE}

  check_backstage_running

  run_tests
}

main
