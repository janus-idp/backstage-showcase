#!/bin/sh

set -x

set_namespace() {
  # Enable parallel PR testing for main branch by utilizing a pool of namespaces
  local namespaces_pool=("pr-1" "pr-2" "pr-3")
  local namespace_found=false
  # Iterate through namespace pool to find an available set
  for ns in "${namespaces_pool[@]}"; do
    if ! oc get namespace "showcase-$ns" >/dev/null 2>&1; then
      echo "Namespace "showcase-$ns" does not exist, Using NS: showcase-$ns, showcase-rbac-$ns, postgress-external-db-$ns"
      export NAME_SPACE="showcase-$ns"
      export NAME_SPACE_RBAC="showcase-rbac-$ns"
      export NAME_SPACE_POSTGRES_DB="postgress-external-db-$ns"
      namespace_found=true
      break
    fi
  done
  if ! $namespace_found; then
    echo "Error: All namespaces $namespaces_pool already in Use"
    exit 1
  fi
}

handle_main() {
  echo "Configuring namespace: ${NAME_SPACE}"
  set_github_app_4_credentials
  set_namespace
  oc_login

  API_SERVER_URL=$(oc whoami --show-server)
  ENCODED_API_SERVER_URL=$(echo "${API_SERVER_URL}" | base64)
  ENCODED_CLUSTER_NAME=$(echo "my-cluster" | base64)

  export K8S_CLUSTER_ROUTER_BASE=$(oc get route console -n openshift-console -o=jsonpath='{.spec.host}' | sed 's/^[^.]*\.//')
  local url="https://${RELEASE_NAME}-backstage-${NAME_SPACE}.${K8S_CLUSTER_ROUTER_BASE}"
  initiate_deployments
  deploy_test_backstage_provider "${NAME_SPACE}"
  check_and_test "${RELEASE_NAME}" "${NAME_SPACE}" "${url}"
  check_and_test "${RELEASE_NAME_RBAC}" "${NAME_SPACE_RBAC}" "${url}"
}
