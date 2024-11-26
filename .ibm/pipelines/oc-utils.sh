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

set_namespace() {
  if [[ "$JOB_NAME" == *periodic-* ]]; then
    NAME_SPACE="showcase-ci-nightly"
    NAME_SPACE_RBAC="showcase-rbac-nightly"
    NAME_SPACE_POSTGRES_DB="postgress-external-db-nightly"
    NAME_SPACE_K8S="showcase-k8s-ci-nightly"
    NAME_SPACE_RBAC_K8S="showcase-rbac-k8s-ci-nightly"
  elif [[ "$JOB_NAME" == *pull-*-main-e2e-tests* ]]; then
    local namespaces_pool=("pr-1" "pr-2" "pr-3")
    local namespace_found=false
    for ns in "${namespaces_pool[@]}"; do
      if ! oc get namespace "showcase-$ns" >/dev/null 2>&1; then
        NAME_SPACE="showcase-$ns"
        NAME_SPACE_RBAC="showcase-rbac-$ns"
        NAME_SPACE_POSTGRES_DB="postgress-external-db-$ns"
        namespace_found=true
        break
      fi
    done
    if ! $namespace_found; then
      echo "Error: All namespaces $namespaces_pool already in use"
      exit 1
    fi
  fi
}

perform_cleanup() {
  if [[ "$JOB_NAME" == *aks* ]]; then
    az_aks_stop "${AKS_NIGHTLY_CLUSTER_NAME}" "${AKS_NIGHTLY_CLUSTER_RESOURCEGROUP}"
  elif [[ "$JOB_NAME" == *pull-*-main-e2e-tests* ]]; then
    delete_namespace "${NAME_SPACE}"
    delete_namespace "${NAME_SPACE_POSTGRES_DB}"
    delete_namespace "${NAME_SPACE_RBAC}"
  fi
}
