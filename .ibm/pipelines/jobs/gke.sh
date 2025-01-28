#!/bin/bash

handle_gke() {
  echo "Starting GKE deployment"
  for file in ${DIR}/cluster/gke/*.sh; do source $file; done

  K8S_CLUSTER_ROUTER_BASE=$GKE_INSTANCE_DOMAIN_NAME
  NAME_SPACE_K8S="showcase-k8s-ci-nightly"
  NAME_SPACE_RBAC_K8S="showcase-rbac-k8s-ci-nightly"
  export K8S_CLUSTER_ROUTER_BASE NAME_SPACE_K8S NAME_SPACE_RBAC_K8S

  url="https://${K8S_CLUSTER_ROUTER_BASE}"

  gcloud_auth "${GKE_SERVICE_ACCOUNT_NAME}" "/tmp/secrets/GKE_SERVICE_ACCOUNT_KEY"
  gcloud_gke_get_credentials "${GKE_CLUSTER_NAME}" "${GKE_CLUSTER_REGION}" "${GOOGLE_CLOUD_PROJECT}"

  K8S_CLUSTER_URL=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
  K8S_CLUSTER_API_SERVER_URL=$(printf "%s" "$K8S_CLUSTER_URL" | base64 | tr -d '\n')
  OCM_CLUSTER_URL=$(printf "%s" "$K8S_CLUSTER_URL" | base64 | tr -d '\n')
  export K8S_CLUSTER_URL K8S_CLUSTER_API_SERVER_URL OCM_CLUSTER_URL

# Create a service account and assign token
  SA_NAME="tester-sa-2"
  SA_NAMESPACE="default"
  SA_BINDING_NAME="${SA_NAME}-binding"
  if ! kubectl get serviceaccount ${SA_NAME} -n ${SA_NAMESPACE} &> /dev/null; then
    echo "Creating service account ${SA_NAME}..."
    kubectl create serviceaccount ${SA_NAME} -n ${SA_NAMESPACE}
    echo "Creating cluster role binding..."
    kubectl create clusterrolebinding ${SA_BINDING_NAME} \
        --clusterrole=cluster-admin \
        --serviceaccount=${SA_NAMESPACE}:${SA_NAME}
    echo "Service account and binding created successfully"
  else
    echo "Service account ${SA_NAME} already exists in namespace ${SA_NAMESPACE}"
  fi
  K8S_CLUSTER_TOKEN=$(kubectl create token tester-sa-2 -n default)  
  K8S_CLUSTER_TOKEN_ENCODED=$(printf "%s" $K8S_CLUSTER_TOKEN | base64 | tr -d '\n')
  K8S_SERVICE_ACCOUNT_TOKEN=$K8S_CLUSTER_TOKEN_ENCODED
  OCM_CLUSTER_TOKEN=$K8S_CLUSTER_TOKEN_ENCODED
  export K8S_CLUSTER_TOKEN K8S_CLUSTER_TOKEN_ENCODED K8S_SERVICE_ACCOUNT_TOKEN OCM_CLUSTER_TOKEN

  initiate_gke_deployment
  check_and_test "${RELEASE_NAME}" "${NAME_SPACE_K8S}" "${url}" 50 30
  delete_namespace "${NAME_SPACE_K8S}"
  initiate_rbac_gke_deployment
  local rbac_rhdh_base_url="https://${K8S_CLUSTER_ROUTER_BASE}"
  check_and_test "${RELEASE_NAME_RBAC}" "${NAME_SPACE_RBAC_K8S}" "${rbac_rhdh_base_url}"
  delete_namespace "${NAME_SPACE_RBAC_K8S}"
}

cleanup_gke() {
  delete_tekton_pipelines
}
