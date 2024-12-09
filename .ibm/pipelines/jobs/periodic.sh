#!/bin/sh

handle_nightly() {
  export NAME_SPACE="showcase-ci-nightly"
  export NAME_SPACE_RBAC="showcase-rbac-nightly"
  export NAME_SPACE_POSTGRES_DB="postgress-external-db-nightly"
  export NAME_SPACE_K8S="showcase-k8s-ci-nightly"
  export NAME_SPACE_RBAC_K8S="showcase-rbac-k8s-ci-nightly"

  oc_login

  API_SERVER_URL=$(oc whoami --show-server)
  ENCODED_API_SERVER_URL=$(echo "${API_SERVER_URL}" | base64)
  ENCODED_CLUSTER_NAME=$(echo "my-cluster" | base64)

  export K8S_CLUSTER_ROUTER_BASE=$(oc get route console -n openshift-console -o=jsonpath='{.spec.host}' | sed 's/^[^.]*\.//')

  configure_namespace "${NAME_SPACE}"
  deploy_test_backstage_provider "${NAME_SPACE}"
  local url="https://${RELEASE_NAME}-backstage-${NAME_SPACE}.${K8S_CLUSTER_ROUTER_BASE}"
  install_pipelines_operator
  sleep 20 # wait for Pipeline Operator/Tekton pipelines to be ready
  oc apply -f "$dir/resources/pipeline-run/hello-world-pipeline.yaml"
  oc apply -f "$dir/resources/pipeline-run/hello-world-pipeline-run.yaml"
  initiate_deployments
  check_and_test "${RELEASE_NAME}" "${NAME_SPACE}" "${url}"
  check_and_test "${RELEASE_NAME_RBAC}" "${NAME_SPACE_RBAC}" "${url}"

  # Only test TLS config with RDS and Change configuration at runtime in nightly jobs
  initiate_rds_deployment "${RELEASE_NAME}" "${NAME_SPACE_RDS}"
  check_and_test "${RELEASE_NAME}" "${NAME_SPACE_RDS}" "${url}"

  # Deploy `showcase-runtime` to run tests that require configuration changes at runtime
  configure_namespace "${NAME_SPACE_RUNTIME}"
  uninstall_helmchart "${NAME_SPACE_RUNTIME}" "${RELEASE_NAME}"
  oc apply -f "$DIR/resources/redis-cache/redis-deployment.yaml" --namespace="${NAME_SPACE_RUNTIME}"
  apply_yaml_files "${DIR}" "${NAME_SPACE_RUNTIME}"
  helm upgrade -i "${RELEASE_NAME}" -n "${NAME_SPACE_RUNTIME}" "${HELM_REPO_NAME}/${HELM_IMAGE_NAME}" --version "${CHART_VERSION}" -f "${DIR}/value_files/${HELM_CHART_VALUE_FILE_NAME}" --set global.clusterRouterBase="${K8S_CLUSTER_ROUTER_BASE}" --set upstream.backstage.image.repository="${QUAY_REPO}" --set upstream.backstage.image.tag="${TAG_NAME}"
  check_and_test "${RELEASE_NAME}" "${NAME_SPACE_RUNTIME}" "${url}"
}
