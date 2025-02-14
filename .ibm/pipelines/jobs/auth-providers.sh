#!/bin/bash

handle_auth_providers() {

  export K8S_CLUSTER_TOKEN=$RHDH_PR_OS_CLUSTER_TOKEN
  export K8S_CLUSTER_URL=$RHDH_PR_OS_CLUSTER_URL
  oc login --token="${K8S_CLUSTER_TOKEN}" --server="${K8S_CLUSTER_URL}" --insecure-skip-tls-verify=true
  echo "OCP version: $(oc version)"
  export K8S_CLUSTER_ROUTER_BASE=$(oc get route console -n openshift-console -o=jsonpath='{.spec.host}' | sed 's/^[^.]*\.//')

  API_SERVER_URL=$(oc whoami --show-server)

  echo "Using cluster ${K8S_CLUSTER_ROUTER_BASE} with API Url ${API_SERVER_URL}"

  ENCODED_API_SERVER_URL=$(echo "${API_SERVER_URL}" | base64)
  ENCODED_CLUSTER_NAME=$(echo "my-cluster" | base64)
  export AUTH_PROVIDERS_RELEASE="rhdh-auth-providers"
  export AUTH_PROVIDERS_NAMESPACE="showcase-auth-providers"
  export K8S_CLUSTER_ROUTER_BASE=$(oc get route console -n openshift-console -o=jsonpath='{.spec.host}' | sed 's/^[^.]*\.//')
  export BASE_URL="https://${AUTH_PROVIDERS_RELEASE}-backstage-${AUTH_PROVIDERS_NAMESPACE}.${K8S_CLUSTER_ROUTER_BASE}"
  export LOGS_FOLDER="$(pwd)/e2e-tests/auth-providers-logs"
  echo "Creating log folder ${LOGS_FOLDER}" 
  mkdir -p $LOGS_FOLDER
  ls $LOGS_FOLDER
  add_helm_repos
  run_tests "${AUTH_PROVIDERS_RELEASE}" "${AUTH_PROVIDERS_NAMESPACE}"

}
