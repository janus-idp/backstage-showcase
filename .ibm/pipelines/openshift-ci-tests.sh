#!/bin/sh

set -xe  # Enable debugging (-x) and exit on error (-e).
export PS4='[$(date "+%Y-%m-%d %H:%M:%S")] ' # Prepend timestamp to each command in debug output.

# Define log file names and directories.
LOGFILE="test-log"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
secret_name="rhdh-k8s-plugin-secret"
OVERALL_RESULT=0

# Define a cleanup function to be executed upon script exit.
cleanup() {
  echo "Cleaning up before exiting"
  if [[ "$JOB_NAME" == *aks* ]]; then
    # If the job is for Azure Kubernetes Service (AKS), stop the AKS cluster.
    az_aks_stop "${AKS_NIGHTLY_CLUSTER_NAME}" "${AKS_NIGHTLY_CLUSTER_RESOURCEGROUP}"
  fi
  rm -rf ~/tmpbin  # Remove temporary binaries directory.
}

trap cleanup EXIT  # Ensure the cleanup function runs on script exit.

source "${DIR}/utils.sh"  # Source utility functions from utils.sh.

# Function to set Kubernetes cluster information based on the job name.
set_cluster_info() {
  export K8S_CLUSTER_URL=$(cat /tmp/secrets/RHDH_PR_OS_CLUSTER_URL)
  export K8S_CLUSTER_TOKEN=$(cat /tmp/secrets/RHDH_PR_OS_CLUSTER_TOKEN)

  if [[ "$JOB_NAME" == *ocp-v4-14 ]]; then
    # Use cluster credentials for OpenShift version 4.14.
    K8S_CLUSTER_URL=$(cat /tmp/secrets/RHDH_OS_1_CLUSTER_URL)
    K8S_CLUSTER_TOKEN=$(cat /tmp/secrets/RHDH_OS_1_CLUSTER_TOKEN)
  elif [[ "$JOB_NAME" == *ocp-v4-13 ]]; then
    # Use cluster credentials for OpenShift version 4.13.
    K8S_CLUSTER_URL=$(cat /tmp/secrets/RHDH_OS_2_CLUSTER_URL)
    K8S_CLUSTER_TOKEN=$(cat /tmp/secrets/RHDH_OS_2_CLUSTER_TOKEN)
  elif [[ "$JOB_NAME" == *aks* ]]; then
    # Use cluster credentials for AKS.
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
    local key="${repo%%=*}"   # Extract repository name.
    local value="${repo##*=}" # Extract repository URL.

    if ! helm repo list | grep -q "^$key"; then
      # If the repository is not already added, add it.
      helm repo add "$key" "$value"
    else
      # If the repository exists, update it.
      echo "Repository $key already exists - updating repository instead."
    fi
  done

  helm repo update
}

install_oc() {
  if command -v oc >/dev/null 2>&1; then
    echo "oc is already installed."
  else
    # Download and install the 'oc' CLI.
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
    # Install Helm using the official script.
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

# Function to configure a OpenShift namespace.
configure_namespace() {
  local project=$1
  delete_namespace $project
  oc create namespace "${project}"
  oc config set-context --current --namespace="${project}"
}

# Function to delete a OpenShift namespace if it exists.
delete_namespace() {
  local project=$1
  if oc get namespace "${project}" >/dev/null 2>&1; then
    echo "Namespace ${project} already exists! Deleting namespace."
    oc delete namespace "${project}"
  fi
}

configure_external_postgres_db() {
  local project=$1
  # Apply the PostgreSQL deployment YAML file.
  oc apply -f "${DIR}/resources/postgres-db/postgres.yaml" --namespace="${NAME_SPACE_POSTGRES_DB}"
  sleep 5

  # Extract PostgreSQL certificates from the secret and save them to files.
  oc get secret postgress-external-db-cluster-cert -n "${NAME_SPACE_POSTGRES_DB}" -o jsonpath='{.data.ca\.crt}' | base64 --decode > postgres-ca
  oc get secret postgress-external-db-cluster-cert -n "${NAME_SPACE_POSTGRES_DB}" -o jsonpath='{.data.tls\.crt}' | base64 --decode > postgres-tls-crt
  oc get secret postgress-external-db-cluster-cert -n "${NAME_SPACE_POSTGRES_DB}" -o jsonpath='{.data.tls\.key}' | base64 --decode > postgres-tsl-key

  # Create a new secret in the project namespace with the PostgreSQL certificates.
  oc create secret generic postgress-external-db-cluster-cert \
  --from-file=ca.crt=postgres-ca \
  --from-file=tls.crt=postgres-tls-crt \
  --from-file=tls.key=postgres-tsl-key \
  --dry-run=client -o yaml | oc apply -f - --namespace="${project}"

  # Retrieve the PostgreSQL password and host, and update the credentials YAML file.
  POSTGRES_PASSWORD=$(oc get secret/postgress-external-db-pguser-janus-idp -n "${NAME_SPACE_POSTGRES_DB}" -o jsonpath={.data.password})
  sed -i "s|POSTGRES_PASSWORD:.*|POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}|g" "${DIR}/resources/postgres-db/postgres-cred.yaml"
  POSTGRES_HOST=$(echo -n "postgress-external-db-primary.$NAME_SPACE_POSTGRES_DB.svc.cluster.local" | base64 | tr -d '\n')
  sed -i "s|POSTGRES_HOST:.*|POSTGRES_HOST: ${POSTGRES_HOST}|g" "${DIR}/resources/postgres-db/postgres-cred.yaml"
  # Apply the updated credentials YAML file.
  oc apply -f "${DIR}/resources/postgres-db/postgres-cred.yaml"  --namespace="${project}"
}

# Function to apply OpenShift YAML files to a namespace.
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
    "$dir/auth/secrets-rhdh-secrets.yaml"
  )

  # Update the namespace in each YAML file.
  for file in "${files[@]}"; do
    sed -i "s/namespace:.*/namespace: ${project}/g" "$file"
  done

  # Set GitHub App credentials based on the job name.
  if [[ "$JOB_NAME" == *aks* ]]; then
    GITHUB_APP_APP_ID=$GITHUB_APP_2_APP_ID
    GITHUB_APP_CLIENT_ID=$GITHUB_APP_2_CLIENT_ID
    GITHUB_APP_PRIVATE_KEY=$GITHUB_APP_2_PRIVATE_KEY
    GITHUB_APP_CLIENT_SECRET=$GITHUB_APP_2_CLIENT_SECRET
  fi

  # Replace placeholders in the secrets file with actual values.
  for key in GITHUB_APP_APP_ID GITHUB_APP_CLIENT_ID GITHUB_APP_PRIVATE_KEY GITHUB_APP_CLIENT_SECRET GITHUB_APP_JANUS_TEST_APP_ID GITHUB_APP_JANUS_TEST_CLIENT_ID GITHUB_APP_JANUS_TEST_CLIENT_SECRET GITHUB_APP_JANUS_TEST_PRIVATE_KEY GITHUB_APP_WEBHOOK_URL GITHUB_APP_WEBHOOK_SECRET KEYCLOAK_CLIENT_SECRET ACR_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET K8S_CLUSTER_TOKEN_ENCODED OCM_CLUSTER_URL GITLAB_TOKEN; do
    sed -i "s|${key}:.*|${key}: ${!key}|g" "$dir/auth/secrets-rhdh-secrets.yaml"
  done

  # Apply OpenShift resources to the namespace.
  oc apply -f "$dir/resources/service_account/service-account-rhdh.yaml" --namespace="${project}"
  oc apply -f "$dir/auth/service-account-rhdh-secret.yaml" --namespace="${project}"
  oc apply -f "$dir/auth/secrets-rhdh-secrets.yaml" --namespace="${project}"
  if [[ "$JOB_NAME" != *aks* ]]; then
    # Deploy a test Backstage customization provider for non-AKS jobs.
    oc new-app https://github.com/janus-qe/test-backstage-customization-provider --namespace="${project}"
    oc expose svc/test-backstage-customization-provider --namespace="${project}"
  fi
  # Apply ClusterRoles and ClusterRoleBindings.
  oc apply -f "$dir/resources/cluster_role/cluster-role-k8s.yaml" --namespace="${project}"
  oc apply -f "$dir/resources/cluster_role_binding/cluster-role-binding-k8s.yaml" --namespace="${project}"
  oc apply -f "$dir/resources/cluster_role/cluster-role-ocm.yaml" --namespace="${project}"
  oc apply -f "$dir/resources/cluster_role_binding/cluster-role-binding-ocm.yaml" --namespace="${project}"

  if [[ "$JOB_NAME" != *aks* ]]; then
    # Update the API server URL in the secrets file for non-AKS jobs.
    sed -i "s/K8S_CLUSTER_API_SERVER_URL:.*/K8S_CLUSTER_API_SERVER_URL: ${ENCODED_API_SERVER_URL}/g" "$dir/auth/secrets-rhdh-secrets.yaml"
  fi
  # Update the cluster name in the secrets file.
  sed -i "s/K8S_CLUSTER_NAME:.*/K8S_CLUSTER_NAME: ${ENCODED_CLUSTER_NAME}/g" "$dir/auth/secrets-rhdh-secrets.yaml"

  # Update the OCM cluster token in the secrets file.
  token=$(oc get secret "${secret_name}" -n "${project}" -o=jsonpath='{.data.token}')
  sed -i "s/OCM_CLUSTER_TOKEN: .*/OCM_CLUSTER_TOKEN: ${token}/" "$dir/auth/secrets-rhdh-secrets.yaml"

  # Apply the appropriate ConfigMap based on the project name.
  if [[ "${project}" == *rbac* ]]; then
    oc apply -f "$dir/resources/config_map/configmap-app-config-rhdh-rbac.yaml" --namespace="${project}"
  else
    oc apply -f "$dir/resources/config_map/configmap-app-config-rhdh.yaml" --namespace="${project}"
  fi
  oc apply -f "$dir/resources/config_map/configmap-rbac-policy-rhdh.yaml" --namespace="${project}"
  oc apply -f "$dir/auth/secrets-rhdh-secrets.yaml" --namespace="${project}"

  sleep 20

  # Apply sample pipeline and pipeline run YAML files.
  oc apply -f "$dir/resources/pipeline-run/hello-world-pipeline.yaml"
  oc apply -f "$dir/resources/pipeline-run/hello-world-pipeline-run.yaml"
}

run_tests() {
  local release_name=$1
  local project=$2
  cd "${DIR}/../../e2e-tests"
  yarn install
  yarn playwright install

  Xvfb :99 &  # Start a virtual framebuffer for GUI applications.
  export DISPLAY=:99  # Set the display environment variable.

  (
    set -e
    echo "Using PR container image: ${TAG_NAME}"
    yarn "$project"  # Run the tests for the specified Playwright project.
  ) 2>&1 | tee "/tmp/${LOGFILE}"  # Log output to a file.

  local RESULT=${PIPESTATUS[0]}  # Capture the exit status of the tests.

  pkill Xvfb  # Terminate the virtual framebuffer.

  # Create directories for test results and attachments.
  mkdir -p "${ARTIFACT_DIR}/${project}/test-results"
  mkdir -p "${ARTIFACT_DIR}/${project}/attachments/screenshots"
  # Copy test results to the artifact directory.
  cp -a /tmp/backstage-showcase/e2e-tests/test-results/* "${ARTIFACT_DIR}/${project}/test-results"
  cp -a /tmp/backstage-showcase/e2e-tests/${JUNIT_RESULTS} "${ARTIFACT_DIR}/${project}/${JUNIT_RESULTS}"

  # Copy screenshots if they exist.
  if [ -d "/tmp/backstage-showcase/e2e-tests/screenshots" ]; then
      cp -a /tmp/backstage-showcase/e2e-tests/screenshots/* "${ARTIFACT_DIR}/${project}/attachments/screenshots/"
  fi

  # Convert ANSI logs to HTML.
  ansi2html <"/tmp/${LOGFILE}" >"/tmp/${LOGFILE}.html"
  cp -a "/tmp/${LOGFILE}.html" "${ARTIFACT_DIR}/${project}"
  # Copy the Playwright report.
  cp -a /tmp/backstage-showcase/e2e-tests/playwright-report/* "${ARTIFACT_DIR}/${project}"

  droute_send "${release_name}" "${project}"  # Send test results through Data Router to ReportPortal.

  echo "${project} RESULT: ${RESULT}"
  if [ "${RESULT}" -ne 0 ]; then
    OVERALL_RESULT=1  # Set the overall result to failure if tests failed.
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
      return 0  # Success
    else
      echo "Attempt ${i} of ${max_attempts}: Backstage not yet available (HTTP Status: ${http_status})"
      sleep "${wait_seconds}"
    fi
  done

  echo "Failed to reach Backstage at ${BASE_URL} after ${max_attempts} attempts." | tee -a "/tmp/${LOGFILE}"
  cp -a "/tmp/${LOGFILE}" "${ARTIFACT_DIR}/${namespace}/"
  return 1  # Failure
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

install_tekton_pipelines() {
  local dir=$1

  if oc get pods -n "tekton-pipelines" | grep -q "tekton-pipelines"; then
    echo "Tekton Pipelines are already installed."
  else
    echo "Tekton Pipelines is not installed. Installing..."
    kubectl apply --filename https://storage.googleapis.com/tekton-releases/pipeline/latest/release.yaml
  fi
}

# Function to initiate deployments on OpenShift clusters.
initiate_deployments() {
  add_helm_repos
  install_helm

  configure_namespace "${NAME_SPACE}"
  install_pipelines_operator "${DIR}"
  uninstall_helmchart "${NAME_SPACE}" "${RELEASE_NAME}"

  # Deploy Redis cache database.
  oc apply -f "$DIR/resources/redis-cache/redis-deployment.yaml" --namespace="${NAME_SPACE}"

  cd "${DIR}"
  apply_yaml_files "${DIR}" "${NAME_SPACE}"
  echo "Deploying image from repository: ${QUAY_REPO}, TAG_NAME: ${TAG_NAME}, in NAME_SPACE: ${NAME_SPACE}"
  # Install or upgrade the Helm chart.
  helm upgrade -i "${RELEASE_NAME}" -n "${NAME_SPACE}" "${HELM_REPO_NAME}/${HELM_IMAGE_NAME}" --version "${CHART_VERSION}" -f "${DIR}/value_files/${HELM_CHART_VALUE_FILE_NAME}" --set global.clusterRouterBase="${K8S_CLUSTER_ROUTER_BASE}" --set upstream.backstage.image.repository="${QUAY_REPO}" --set upstream.backstage.image.tag="${TAG_NAME}"

  # Configure namespaces for PostgreSQL DB and RBAC.
  configure_namespace "${NAME_SPACE_POSTGRES_DB}"
  configure_namespace "${NAME_SPACE_RBAC}"
  configure_external_postgres_db "${NAME_SPACE_RBAC}"  # Set up the external PostgreSQL database.

  install_pipelines_operator "${DIR}"
  uninstall_helmchart "${NAME_SPACE_RBAC}" "${RELEASE_NAME_RBAC}"
  apply_yaml_files "${DIR}" "${NAME_SPACE_RBAC}"
  echo "Deploying image from repository: ${QUAY_REPO}, TAG_NAME: ${TAG_NAME}, in NAME_SPACE: ${RELEASE_NAME_RBAC}"
  helm upgrade -i "${RELEASE_NAME_RBAC}" -n "${NAME_SPACE_RBAC}" "${HELM_REPO_NAME}/${HELM_IMAGE_NAME}" --version "${CHART_VERSION}" -f "${DIR}/value_files/${HELM_CHART_RBAC_VALUE_FILE_NAME}" --set global.clusterRouterBase="${K8S_CLUSTER_ROUTER_BASE}" --set upstream.backstage.image.repository="${QUAY_REPO}" --set upstream.backstage.image.tag="${TAG_NAME}"
}

# Function to initiate deployments on AKS clusters.
initiate_aks_deployment() {
  add_helm_repos
  install_helm
  delete_namespace "${NAME_SPACE_RBAC_AKS}"  # Delete the RBAC namespace if it exists.
  configure_namespace "${NAME_SPACE_AKS}"  # Configure the main AKS namespace.
  install_tekton_pipelines
  uninstall_helmchart "${NAME_SPACE_AKS}" "${RELEASE_NAME}"
  cd "${DIR}"
  apply_yaml_files "${DIR}" "${NAME_SPACE_AKS}"
  # Merge Helm value files specific to AKS.
  yq_merge_value_files "${DIR}/value_files/${HELM_CHART_VALUE_FILE_NAME}" "${DIR}/value_files/${HELM_CHART_AKS_DIFF_VALUE_FILE_NAME}" "/tmp/${HELM_CHART_AKS_MERGED_VALUE_FILE_NAME}"
  echo "Deploying image from repository: ${QUAY_REPO}, TAG_NAME: ${TAG_NAME}, in NAME_SPACE: ${NAME_SPACE_AKS}"
  # Install or upgrade the Helm chart on AKS.
  helm upgrade -i "${RELEASE_NAME}" -n "${NAME_SPACE_AKS}" "${HELM_REPO_NAME}/${HELM_IMAGE_NAME}" --version "${CHART_VERSION}" -f "/tmp/${HELM_CHART_AKS_MERGED_VALUE_FILE_NAME}" --set global.host="${K8S_CLUSTER_ROUTER_BASE}" --set upstream.backstage.image.repository="${QUAY_REPO}" --set upstream.backstage.image.tag="${TAG_NAME}"
}

# Function to initiate RBAC deployments on AKS clusters.
initiate_rbac_aks_deployment() {
  add_helm_repos
  install_helm
  delete_namespace "${NAME_SPACE_AKS}"
  configure_namespace "${NAME_SPACE_RBAC_AKS}"
  install_tekton_pipelines
  uninstall_helmchart "${NAME_SPACE_RBAC_AKS}" "${RELEASE_NAME_RBAC}"
  cd "${DIR}"
  apply_yaml_files "${DIR}" "${NAME_SPACE_RBAC_AKS}"
  yq_merge_value_files "${DIR}/value_files/${HELM_CHART_RBAC_VALUE_FILE_NAME}" "${DIR}/value_files/${HELM_CHART_RBAC_AKS_DIFF_VALUE_FILE_NAME}" "/tmp/${HELM_CHART_RBAC_AKS_MERGED_VALUE_FILE_NAME}"
  echo "Deploying image from repository: ${QUAY_REPO}, TAG_NAME: ${TAG_NAME}, in NAME_SPACE: ${NAME_SPACE_RBAC_AKS}"
  helm upgrade -i "${RELEASE_NAME_RBAC}" -n "${NAME_SPACE_RBAC_AKS}" "${HELM_REPO_NAME}/${HELM_IMAGE_NAME}" --version "${CHART_VERSION}" -f "/tmp/${HELM_CHART_RBAC_AKS_MERGED_VALUE_FILE_NAME}" --set global.host="${K8S_CLUSTER_ROUTER_BASE}" --set upstream.backstage.image.repository="${QUAY_REPO}" --set upstream.backstage.image.tag="${TAG_NAME}"
}

# Function to check if Backstage is running and then run tests.
check_and_test() {
  local release_name=$1
  local namespace=$2
  if check_backstage_running "${release_name}" "${namespace}"; then
    echo "Display pods for verification..."
    oc get pods -n "${namespace}"  # List all pods in the namespace.
    run_tests "${release_name}" "${namespace}"  # Run the E2E tests.
  else
    echo "Backstage is not running. Exiting..."
    OVERALL_RESULT=1  # Set the overall result to failure.
  fi
  save_all_pod_logs $namespace  # Save logs from all pods.
}

# Main function to orchestrate the deployment and testing process.
main() {
  echo "Log file: ${LOGFILE}"
  set_cluster_info  # Set cluster credentials.

  source "${DIR}/env_variables.sh"  # Source environment variables.

  # Set namespace names based on the job name.
  if [[ "$JOB_NAME" == *periodic-* ]]; then
    NAME_SPACE="showcase-ci-nightly"
    NAME_SPACE_RBAC="showcase-rbac-nightly"
    NAME_SPACE_POSTGRES_DB="postgress-external-db-nightly"
    NAME_SPACE_AKS="showcase-aks-ci-nightly"
    NAME_SPACE_RBAC_AKS="showcase-rbac-aks-ci-nightly"
  fi
  if [[ "$JOB_NAME" == *aks* ]]; then
    # For AKS jobs, log in and start the cluster.
    az_login
    az_aks_start "${AKS_NIGHTLY_CLUSTER_NAME}" "${AKS_NIGHTLY_CLUSTER_RESOURCEGROUP}"
    az_aks_approuting_enable "${AKS_NIGHTLY_CLUSTER_NAME}" "${AKS_NIGHTLY_CLUSTER_RESOURCEGROUP}"
  fi

  install_oc
  if [[ "$JOB_NAME" == *aks* ]]; then
    # Get AKS cluster credentials.
    az aks get-credentials --name="${AKS_NIGHTLY_CLUSTER_NAME}" --resource-group="${AKS_NIGHTLY_CLUSTER_RESOURCEGROUP}" --overwrite-existing
  else
    # Log in to the OpenShift cluster.
    oc login --token="${K8S_CLUSTER_TOKEN}" --server="${K8S_CLUSTER_URL}"
  fi
  echo "OCP version: $(oc version)"  # Display the OpenShift version.

  API_SERVER_URL=$(oc whoami --show-server)  # Get the API server URL.
  if [[ "$JOB_NAME" == *aks* ]]; then
    # Get the router base for AKS.
    K8S_CLUSTER_ROUTER_BASE=$(kubectl get svc nginx --namespace app-routing-system -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
  else
    # Get the router base for OpenShift.
    K8S_CLUSTER_ROUTER_BASE=$(oc get route console -n openshift-console -o=jsonpath='{.spec.host}' | sed 's/^[^.]*\.//')
  fi

  echo "K8S_CLUSTER_ROUTER_BASE : $K8S_CLUSTER_ROUTER_BASE"

  ENCODED_API_SERVER_URL=$(echo "${API_SERVER_URL}" | base64)  # Base64 encode the API server URL.
  ENCODED_CLUSTER_NAME=$(echo "my-cluster" | base64)  # Base64 encode the cluster name.

  if [[ "$JOB_NAME" == *aks* ]]; then
    # Initiate deployments on AKS.
    initiate_aks_deployment
    check_and_test "${RELEASE_NAME}" "${NAME_SPACE_AKS}"
    delete_namespace "${NAME_SPACE_AKS}"
    initiate_rbac_aks_deployment
    check_and_test "${RELEASE_NAME_RBAC}" "${NAME_SPACE_RBAC_AKS}"
    delete_namespace "${NAME_SPACE_RBAC_AKS}"
  else
    # Initiate deployments on OpenShift.
    initiate_deployments
    check_and_test "${RELEASE_NAME}" "${NAME_SPACE}"
    check_and_test "${RELEASE_NAME_RBAC}" "${NAME_SPACE_RBAC}"
  fi
  exit "${OVERALL_RESULT}"  # Exit with the overall result status.
}

main  # Start the script execution by calling the main function.
