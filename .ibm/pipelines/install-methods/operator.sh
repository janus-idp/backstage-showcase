#!/bin/bash

# shellcheck source=.ibm/pipelines/utils.sh
source "$DIR"/utils.sh

install_rhdh_operator() {
  local dir=$1
  local namespace=$2

  configure_namespace "$namespace"

  if [[ "${IS_OPENSHIFT}" = "false" ]]; then
    setup_image_pull_secret "rhdh-operator" "rh-pull-secret" "${REGISTRY_REDHAT_IO_SERVICE_ACCOUNT_DOCKERCONFIGJSON}"
  fi
  # Make sure script is up to date
  rm -f /tmp/install-rhdh-catalog-source.sh
  curl -L "https://raw.githubusercontent.com/redhat-developer/rhdh-operator/refs/heads/${RELEASE_BRANCH_NAME}/.rhdh/scripts/install-rhdh-catalog-source.sh" > /tmp/install-rhdh-catalog-source.sh
  chmod +x /tmp/install-rhdh-catalog-source.sh
  if [ "$RELEASE_BRANCH_NAME" == "main" ]; then
    echo "Installing RHDH operator with '--next' flag"
    bash -x /tmp/install-rhdh-catalog-source.sh --next --install-operator rhdh
  else
    local operator_version="${RELEASE_BRANCH_NAME#release-}"
    echo "Installing RHDH operator with '-v $operator_version' flag"
    bash -x /tmp/install-rhdh-catalog-source.sh -v "$operator_version" --install-operator rhdh
  fi
}

wait_for_backstage_crd() {
  local namespace=$1
  timeout 300 bash -c "
  while ! oc get crd/backstages.rhdh.redhat.com -n '${namespace}' >/dev/null 2>&1; do
      echo 'Waiting for Backstage CRD to be created...'
      sleep 20
  done
  echo 'Backstage CRD is created.'
  " || echo "Error: Timed out waiting for Backstage CRD creation."
}

deploy_rhdh_operator() {
  local namespace=$1
  local backstage_crd_path=$2

  wait_for_backstage_crd "$namespace"

  if [[ "${IS_OPENSHIFT}" = "true" ]]; then
    oc apply -f "$backstage_crd_path" -n "${namespace}"
  else
    kubectl apply -f "$backstage_crd_path" -n "${namespace}"
  fi
}
