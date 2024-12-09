#!/bin/sh

handle_operator() {
  oc_login

  API_SERVER_URL=$(oc whoami --show-server)
  ENCODED_API_SERVER_URL=$(echo "${API_SERVER_URL}" | base64)
  ENCODED_CLUSTER_NAME=$(echo "my-cluster" | base64)

  apply_yaml_files "${DIR}" "${NAME_SPACE}"
  deploy_test_backstage_provider "${NAME_SPACE}"
}
