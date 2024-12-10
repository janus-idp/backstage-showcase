#!/bin/sh

handle_operator() {
  oc_login

  apply_yaml_files "${DIR}" "${NAME_SPACE}"
  deploy_test_backstage_provider "${NAME_SPACE}"
}
