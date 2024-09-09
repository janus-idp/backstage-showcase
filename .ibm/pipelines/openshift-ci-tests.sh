#!/bin/sh

set -xe
export PS4='[$(date "+%Y-%m-%d %H:%M:%S")] ' # logs timestamp for every cmd.

LOGFILE="test-log"
JUNIT_RESULTS="junit-results.xml"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
secret_name="rhdh-k8s-plugin-secret"
OVERALL_RESULT=0

cleanup() {
  echo "Cleaning up before exiting"
  rm -rf ~/tmpbin
}

trap cleanup EXIT

source "${DIR}/utils.sh"

set_cluster_info() {
  export K8S_CLUSTER_URL=$(cat /tmp/secrets/RHDH_PR_OS_CLUSTER_URL)
  export K8S_CLUSTER_TOKEN=$(cat /tmp/secrets/RHDH_PR_OS_CLUSTER_TOKEN)

  if [[ "$JOB_NAME" == *ocp-v4-14 ]]; then
    K8S_CLUSTER_URL=$(cat /tmp/secrets/RHDH_OS_1_CLUSTER_URL)
    K8S_CLUSTER_TOKEN=$(cat /tmp/secrets/RHDH_OS_1_CLUSTER_TOKEN)
  elif [[ "$JOB_NAME" == *ocp-v4-13 ]]; then
    K8S_CLUSTER_URL=$(cat /tmp/secrets/RHDH_OS_2_CLUSTER_URL)
    K8S_CLUSTER_TOKEN=$(cat /tmp/secrets/RHDH_OS_2_CLUSTER_TOKEN)
  elif [[ "$JOB_NAME" == *aks* ]]; then
    K8S_CLUSTER_URL=$(cat /tmp/secrets/RHDH_AKS_CLUSTER_URL)
    K8S_CLUSTER_TOKEN=$(cat /tmp/secrets/RHDH_AKS_CLUSTER_TOKEN)
  fi
}

add_helm_repos() {
  helm version

  local repos=(
    "bitnami=https://charts.bitnami.com/bitnami"
    "backstage=https://backstage.github.io/charts"
    "${HELM_REPO_NAME}=${HELM_REPO_URL}"
  )

  for repo in "${repos[@]}"; do
    local key="${repo%%=*}"
    local value="${repo##*=}"

    if ! helm repo list | grep -q "^$key"; then
      helm repo add "$key" "$value"
    else
      echo "Repository $key already exists - updating repository instead."
    fi
  done

  helm repo update
}

install_oc() {
  if command -v oc >/dev/null 2>&1; then
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
  if command -v helm >/dev/null 2>&1; then
    echo "Helm is already installed."
  else
    echo "Installing Helm 3 client"
    mkdir ~/tmpbin && cd ~/tmpbin
    curl -sL https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash -f
    export PATH=$(pwd):$PATH
    echo "Helm client installed successfully."
  fi
}

uninstall_helmchart() {
  local project=$1
  local release=$2
  if helm list -n "${project}" | grep -q "${release}"; then
    echo "Chart already exists. Removing it before install."
    helm uninstall "${release}" -n "${project}"
  fi
}

configure_namespace() {
  local project=$1
  if oc get namespace "${project}" >/dev/null 2>&1; then
    echo "Namespace ${project} already exists! refreshing namespace"
    oc delete namespace "${project}"
  fi
  oc create namespace "${project}"
  oc config set-context --current --namespace="${project}"
}

configure_external_postgres_db() {
  local project=$1
  oc apply -f "${DIR}/resources/postgres-db/postgres.yaml" --namespace="${NAME_SPACE_POSTGRES_DB}"
  sleep 5

  oc get secret postgress-external-db-cluster-cert -n "${NAME_SPACE_POSTGRES_DB}" -o jsonpath='{.data.ca\.crt}' | base64 --decode > postgres-ca
  oc get secret postgress-external-db-cluster-cert -n "${NAME_SPACE_POSTGRES_DB}" -o jsonpath='{.data.tls\.crt}' | base64 --decode > postgres-tls-crt
  oc get secret postgress-external-db-cluster-cert -n "${NAME_SPACE_POSTGRES_DB}" -o jsonpath='{.data.tls\.key}' | base64 --decode > postgres-tsl-key

  oc create secret generic postgress-external-db-cluster-cert \
  --from-file=ca.crt=postgres-ca \
  --from-file=tls.crt=postgres-tls-crt \
  --from-file=tls.key=postgres-tsl-key \
  --dry-run=client -o yaml | oc apply -f - --namespace="${project}"

  POSTGRES_PASSWORD=$(oc get secret/postgress-external-db-pguser-janus-idp -n "${NAME_SPACE_POSTGRES_DB}" -o jsonpath={.data.password})
  sed -i "s|POSTGRES_PASSWORD:.*|POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}|g" "${DIR}/resources/postgres-db/postgres-cred.yaml"
  POSTGRES_HOST=$(echo -n "postgress-external-db-primary.$NAME_SPACE_POSTGRES_DB.svc.cluster.local" | base64 | tr -d '\n')
  sed -i "s|POSTGRES_HOST:.*|POSTGRES_HOST: ${POSTGRES_HOST}|g" "${DIR}/resources/postgres-db/postgres-cred.yaml"
  oc apply -f "${DIR}/resources/postgres-db/postgres-cred.yaml"  --namespace="${project}"
}

apply_yaml_files() {
  local dir=$1
  local project=$2
  echo "Applying YAML files to namespace ${project}"

  oc config set-context --current --namespace="${project}"

  local files=(
    "$dir/resources/service_account/service-account-rhdh.yaml"
    "$dir/resources/cluster_role_binding/cluster-role-binding-k8s.yaml"
    "$dir/resources/cluster_role/cluster-role-k8s.yaml"
    "$dir/resources/cluster_role/cluster-role-ocm.yaml"
    "$dir/resources/deployment/deployment-test-app-component.yaml"
    "$dir/auth/secrets-rhdh-secrets.yaml"
  )

  for file in "${files[@]}"; do
    sed -i "s/namespace:.*/namespace: ${project}/g" "$file"
  done

  sed -i "s/backstage.io\/kubernetes-id:.*/backstage.io\/kubernetes-id: ${K8S_PLUGIN_ANNOTATION}/g" "$dir/resources/deployment/deployment-test-app-component.yaml"

  for key in GITHUB_APP_APP_ID GITHUB_APP_CLIENT_ID GITHUB_APP_PRIVATE_KEY GITHUB_APP_CLIENT_SECRET GITHUB_APP_JANUS_TEST_APP_ID GITHUB_APP_JANUS_TEST_CLIENT_ID GITHUB_APP_JANUS_TEST_CLIENT_SECRET GITHUB_APP_JANUS_TEST_PRIVATE_KEY GITHUB_APP_WEBHOOK_URL GITHUB_APP_WEBHOOK_SECRET KEYCLOAK_CLIENT_SECRET ACR_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET K8S_CLUSTER_TOKEN_ENCODED OCM_CLUSTER_URL GITLAB_TOKEN; do
    sed -i "s|${key}:.*|${key}: ${!key}|g" "$dir/auth/secrets-rhdh-secrets.yaml"
  done

  oc apply -f "$dir/resources/service_account/service-account-rhdh.yaml" --namespace="${project}"
  oc apply -f "$dir/auth/service-account-rhdh-secret.yaml" --namespace="${project}"
  oc apply -f "$dir/auth/secrets-rhdh-secrets.yaml" --namespace="${project}"
  oc apply -f "$dir/resources/deployment/deployment-test-app-component.yaml" --namespace="${project}"
  if [[ "$JOB_NAME" != *aks* ]]; then
    oc new-app https://github.com/janus-qe/test-backstage-customization-provider --namespace="${project}"
    oc expose svc/test-backstage-customization-provider --namespace="${project}"
  fi
  oc apply -f "$dir/resources/cluster_role/cluster-role-k8s.yaml" --namespace="${project}"
  oc apply -f "$dir/resources/cluster_role_binding/cluster-role-binding-k8s.yaml" --namespace="${project}"
  oc apply -f "$dir/resources/cluster_role/cluster-role-ocm.yaml" --namespace="${project}"
  oc apply -f "$dir/resources/cluster_role_binding/cluster-role-binding-ocm.yaml" --namespace="${project}"

  sed -i "s/K8S_CLUSTER_API_SERVER_URL:.*/K8S_CLUSTER_API_SERVER_URL: ${ENCODED_API_SERVER_URL}/g" "$dir/auth/secrets-rhdh-secrets.yaml"
  sed -i "s/K8S_CLUSTER_NAME:.*/K8S_CLUSTER_NAME: ${ENCODED_CLUSTER_NAME}/g" "$dir/auth/secrets-rhdh-secrets.yaml"

  token=$(oc get secret "${secret_name}" -n "${project}" -o=jsonpath='{.data.token}')
  sed -i "s/OCM_CLUSTER_TOKEN: .*/OCM_CLUSTER_TOKEN: ${token}/" "$dir/auth/secrets-rhdh-secrets.yaml"

  if [[ "${project}" == "showcase-rbac" || "${project}" == "showcase-rbac-nightly" || "${project}" == "showcase-rbac-1-2-x" ]]; then
    oc apply -f "$dir/resources/config_map/configmap-app-config-rhdh-rbac.yaml" --namespace="${project}"
  else
    oc apply -f "$dir/resources/config_map/configmap-app-config-rhdh.yaml" --namespace="${project}"
  fi
  oc apply -f "$dir/resources/config_map/configmap-rbac-policy-rhdh.yaml" --namespace="${project}"
  oc apply -f "$dir/auth/secrets-rhdh-secrets.yaml" --namespace="${project}"

  if [[ "$JOB_NAME" != *aks* ]]; then
    sleep 20 # wait for Pipeline Operator to be ready
    oc apply -f "$dir/resources/pipeline-run/hello-world-pipeline.yaml"
    oc apply -f "$dir/resources/pipeline-run/hello-world-pipeline-run.yaml"
  fi
}

droute_send() {
  # Skipping ReportPortal for nightly jobs on OCP v4.14 and v4.13 for now, as new clusters are not behind the RH VPN.
  if [[ "$JOB_NAME" == *ocp-v4* ]]; then
    return 0
  fi

  local release_name=$1
  local project=$2
  local droute_project="droute"
  local droute_pod_name="droute-centos"
  METEDATA_OUTPUT="data_router_metadata_output.json"

  # Remove properties (only used for skipped test and invalidates the file if empty)
  sed -i '/<properties>/,/<\/properties>/d' "${ARTIFACT_DIR}/${project}/${JUNIT_RESULTS}"

  JOB_BASE_URL="https://prow.ci.openshift.org/view/gs/test-platform-results"
  if [ -n "${PULL_NUMBER:-}" ]; then
    JOB_URL="${JOB_BASE_URL}/pr-logs/pull/${REPO_OWNER}_${REPO_NAME}/${PULL_NUMBER}/${JOB_NAME}/${BUILD_ID}"
  else
    JOB_URL="${JOB_BASE_URL}/logs/${JOB_NAME}/${BUILD_ID}"
  fi

  jq \
    --arg hostname "$REPORTPORTAL_HOSTNAME" \
    --arg project "$DATA_ROUTER_PROJECT" \
    --arg name "$JOB_NAME" \
    --arg description "[View job run details](${JOB_URL})" \
    --arg key1 "job_type" \
    --arg value1 "$JOB_TYPE" \
    --arg key2 "pr" \
    --arg value2 "$GIT_PR_NUMBER" \
    '.targets.reportportal.config.hostname = $hostname |
     .targets.reportportal.config.project = $project |
     .targets.reportportal.processing.launch.name = $name |
     .targets.reportportal.processing.launch.description = $description |
     .targets.reportportal.processing.launch.attributes += [
        {"key": $key1, "value": $value1},
        {"key": $key2, "value": $value2}
      ]' data_router/data_router_metadata_template.json > "${ARTIFACT_DIR}/${project}/${METEDATA_OUTPUT}"

  oc rsync -n "${droute_project}" "${ARTIFACT_DIR}/${project}/" "${droute_project}/${droute_pod_name}:/tmp/droute"

  oc exec -n "${droute_project}" "${droute_pod_name}" -- /bin/bash -c "
    curl -fsSLk -o /tmp/droute-linux-amd64 'https://${NEXUS_HOSTNAME}/nexus/repository/dno-raw/droute-client/1.1/droute-linux-amd64' && chmod +x /tmp/droute-linux-amd64"

  oc exec -n "${droute_project}" "${droute_pod_name}" -- /bin/bash -c "
    /tmp/droute-linux-amd64 send --metadata /tmp/droute/${METEDATA_OUTPUT} \
    --url '${DATA_ROUTER_URL}' \
    --username '${DATA_ROUTER_USERNAME}' \
    --password '${DATA_ROUTER_PASSWORD}' \
    --results '/tmp/droute/${JUNIT_RESULTS}' \
    --attachments '/tmp/droute/attachments' \
    --verbose"

}

run_tests() {
  local release_name=$1
  local project=$2
  cd "${DIR}/../../e2e-tests"
  yarn install
  yarn playwright install

  Xvfb :99 &
  export DISPLAY=:99

  (
    set -e
    echo "Using PR container image: ${TAG_NAME}"
    yarn "$project"
  ) |& tee "/tmp/${LOGFILE}"

  local RESULT=${PIPESTATUS[0]}

  pkill Xvfb

  mkdir -p "${ARTIFACT_DIR}/${project}/test-results"
  mkdir -p "${ARTIFACT_DIR}/${project}/attachments/screenshots"
  cp -a /tmp/backstage-showcase/e2e-tests/test-results/* "${ARTIFACT_DIR}/${project}/test-results"
  cp -a /tmp/backstage-showcase/e2e-tests/${JUNIT_RESULTS} "${ARTIFACT_DIR}/${project}/${JUNIT_RESULTS}"

  if [ -d "/tmp/backstage-showcase/e2e-tests/screenshots" ]; then
      cp -a /tmp/backstage-showcase/e2e-tests/screenshots/* "${ARTIFACT_DIR}/${project}/attachments/screenshots/"
  fi

  ansi2html <"/tmp/${LOGFILE}" >"/tmp/${LOGFILE}.html"
  cp -a "/tmp/${LOGFILE}.html" "${ARTIFACT_DIR}/${project}"
  cp -a /tmp/backstage-showcase/e2e-tests/playwright-report/* "${ARTIFACT_DIR}/${project}"

  droute_send "${release_name}" "${project}"

  echo "${project} RESULT: ${RESULT}"
  if [ "${RESULT}" -ne 0 ]; then
    OVERALL_RESULT=1
  fi
}

check_backstage_running() {
  local release_name=$1
  local namespace=$2
  local url="https://${release_name}-backstage-${namespace}.${K8S_CLUSTER_ROUTER_BASE}"
  if [[ "$JOB_NAME" == *aks* ]]; then
    local url="https://${K8S_CLUSTER_ROUTER_BASE}"
  fi

  local max_attempts=30
  local wait_seconds=30

  echo "Checking if Backstage is up and running at ${url}"

  for ((i = 1; i <= max_attempts; i++)); do
    local http_status
    http_status=$(curl --insecure -I -s "${url}" | grep HTTP | awk '{print $2}')

    if [ "${http_status}" -eq 200 ]; then
      echo "Backstage is up and running!"
      export BASE_URL="${url}"
      echo "######## BASE URL ########"
      echo "${BASE_URL}"
      return 0
    else
      echo "Attempt ${i} of ${max_attempts}: Backstage not yet available (HTTP Status: ${http_status})"
      sleep "${wait_seconds}"
    fi
  done

  echo "Failed to reach Backstage at ${BASE_URL} after ${max_attempts} attempts." | tee -a "/tmp/${LOGFILE}"
  cp -a "/tmp/${LOGFILE}" "${ARTIFACT_DIR}/${namespace}/"
  return 1
}

install_pipelines_operator() {
  local dir=$1
  DISPLAY_NAME="Red Hat OpenShift Pipelines"

  if oc get csv -n "openshift-operators" | grep -q "${DISPLAY_NAME}"; then
    echo "Red Hat OpenShift Pipelines operator is already installed."
  else
    echo "Red Hat OpenShift Pipelines operator is not installed. Installing..."
    oc apply -f "${dir}/resources/pipeline-run/pipelines-operator.yaml"
  fi
}

initiate_deployments() {
  add_helm_repos


  if [[ "$JOB_NAME" == *aks* ]]; then
    initiate_aks_deployment
  else
    configure_namespace "${NAME_SPACE}"
    install_pipelines_operator "${DIR}"
    install_helm
    uninstall_helmchart "${NAME_SPACE}" "${RELEASE_NAME}"

    # Deploy redis cache db.
    oc apply -f "$DIR/resources/redis-cache/redis-deployment.yaml" --namespace="${NAME_SPACE}"

    cd "${DIR}"
    apply_yaml_files "${DIR}" "${NAME_SPACE}"
    echo "Deploying image from repository: ${QUAY_REPO}, TAG_NAME: ${TAG_NAME}, in NAME_SPACE: ${NAME_SPACE}"
    helm upgrade -i "${RELEASE_NAME}" -n "${NAME_SPACE}" "${HELM_REPO_NAME}/${HELM_IMAGE_NAME}" --version "${CHART_VERSION}" -f "${DIR}/value_files/${HELM_CHART_VALUE_FILE_NAME}" --set global.clusterRouterBase="${K8S_CLUSTER_ROUTER_BASE}" --set upstream.backstage.image.repository="${QUAY_REPO}" --set upstream.backstage.image.tag="${TAG_NAME}"

    configure_namespace "${NAME_SPACE_POSTGRES_DB}"
    configure_namespace "${NAME_SPACE_RBAC}"
    configure_external_postgres_db "${NAME_SPACE_RBAC}"
    
    install_pipelines_operator "${DIR}"
    uninstall_helmchart "${NAME_SPACE_RBAC}" "${RELEASE_NAME_RBAC}"
    apply_yaml_files "${DIR}" "${NAME_SPACE_RBAC}"
    echo "Deploying image from repository: ${QUAY_REPO}, TAG_NAME: ${TAG_NAME}, in NAME_SPACE: ${RELEASE_NAME_RBAC}"
    helm upgrade -i "${RELEASE_NAME_RBAC}" -n "${NAME_SPACE_RBAC}" "${HELM_REPO_NAME}/${HELM_IMAGE_NAME}" --version "${CHART_VERSION}" -f "${DIR}/value_files/${HELM_CHART_RBAC_VALUE_FILE_NAME}" --set global.clusterRouterBase="${K8S_CLUSTER_ROUTER_BASE}" --set upstream.backstage.image.repository="${QUAY_REPO}" --set upstream.backstage.image.tag="${TAG_NAME}"
  fi
}

single_deployment_initiation() {
  local name_space="$1"
  local release_name="$2"
  local helm_chart_value_file_name="$3"

  configure_namespace "${name_space}"
  uninstall_helmchart "${name_space}" "${release_name}"
  if [[ "$JOB_NAME" != *aks* ]]; then
    install_pipelines_operator "${DIR}"
  fi
  cd "${DIR}"
  apply_yaml_files "${DIR}" "${name_space}"
  echo "Deploying image from repository: ${QUAY_REPO}, TAG_NAME: ${TAG_NAME}, in NAME_SPACE: ${name_space}"
  helm upgrade -i "${release_name}" -n "${name_space}" "${HELM_REPO_NAME}/${HELM_IMAGE_NAME}" --version "${CHART_VERSION}" -f "${DIR}/value_files/${helm_chart_value_file_name}" --set global.host="${K8S_CLUSTER_ROUTER_BASE}" --set upstream.backstage.image.repository="${QUAY_REPO}" --set upstream.backstage.image.tag="${TAG_NAME}"
}

initiate_aks_deployment() {
  single_deployment_initiation "${NAME_SPACE_AKS}" "${RELEASE_NAME}" "${HELM_CHART_AKS_VALUE_FILE_NAME}"
}

check_and_test() {
  local release_name=$1
  local namespace=$2
  if check_backstage_running "${release_name}" "${namespace}"; then
    echo "Display pods for verification..."
    oc get pods -n "${namespace}"
    run_tests "${release_name}" "${namespace}"
  else
    echo "Backstage is not running. Exiting..."
    OVERALL_RESULT=1
  fi
  save_all_pod_logs $namespace
}

main() {
  echo "Log file: ${LOGFILE}"
  set_cluster_info
  source "${DIR}/env_variables.sh"
  if [[ "$JOB_NAME" == *periodic-* ]]; then
    NAME_SPACE="showcase-ci-nightly"
    NAME_SPACE_RBAC="showcase-rbac-nightly"
    NAME_SPACE_POSTGRES_DB="postgress-external-db-nightly"
    NAME_SPACE_AKS="showcase-aks-ci-nightly"
  fi

  install_oc
  oc login --token="${K8S_CLUSTER_TOKEN}" --server="${K8S_CLUSTER_URL}"
  echo "OCP version: $(oc version)"

  API_SERVER_URL=$(oc whoami --show-server)
  K8S_CLUSTER_ROUTER_BASE=$(oc get route console -n openshift-console -o=jsonpath='{.spec.host}' | sed 's/^[^.]*\.//')
  if [[ "$JOB_NAME" == *aks* ]]; then
    K8S_CLUSTER_ROUTER_BASE=$(kubectl get svc nginx --namespace app-routing-system -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
  fi

  echo "K8S_CLUSTER_ROUTER_BASE : $K8S_CLUSTER_ROUTER_BASE"

  ENCODED_API_SERVER_URL=$(echo "${API_SERVER_URL}" | base64)
  ENCODED_CLUSTER_NAME=$(echo "my-cluster" | base64)

  initiate_deployments
  if [[ "$JOB_NAME" == *aks* ]]; then
    check_and_test "${RELEASE_NAME}" "${NAME_SPACE_AKS}"
  else
    check_and_test "${RELEASE_NAME}" "${NAME_SPACE}"
    check_and_test "${RELEASE_NAME_RBAC}" "${NAME_SPACE_RBAC}"
  fi
  exit "${OVERALL_RESULT}"
}

main
