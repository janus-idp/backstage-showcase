#!/bin/sh

handle_gke() {
  echo "Starting GKE deployment"
  for file in ${DIR}/cluster/gke/*.sh; do source $file; done

  export K8S_CLUSTER_ROUTER_BASE=$GKE_INSTANCE_DOMAIN_NAME
  export NAME_SPACE_K8S="showcase-k8s-ci-nightly"
  export NAME_SPACE_RBAC_K8S="showcase-rbac-k8s-ci-nightly"
  url="https://${K8S_CLUSTER_ROUTER_BASE}"

  gcloud_auth "${GKE_SERVICE_ACCOUNT_NAME}" "/tmp/secrets/GKE_SERVICE_ACCOUNT_KEY"
  gcloud_gke_get_credentials "${GKE_CLUSTER_NAME}" "${GKE_CLUSTER_REGION}" "${GOOGLE_CLOUD_PROJECT}"

  set_github_app_3_credentials

  initiate_gke_deployment
  check_and_test "${RELEASE_NAME}" "${NAME_SPACE_K8S}" "${url}"
  delete_namespace "${NAME_SPACE_K8S}"
  initiate_rbac_gke_deployment
  check_and_test "${RELEASE_NAME_RBAC}" "${NAME_SPACE_RBAC_K8S}"
  delete_namespace "${NAME_SPACE_RBAC_K8S}"

}
