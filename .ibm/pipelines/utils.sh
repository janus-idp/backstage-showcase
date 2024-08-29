#!/bin/sh

retrieve_pod_logs() {
  local POD_NAME=$1; local CONTAINER=$2; local NAMESPACE_NAME=$3
  echo "  Retrieving logs for container: $CONTAINER"
  # Save logs for the current and previous container
  kubectl logs $POD_NAME -c $CONTAINER -n $NAMESPACE_NAME > "/tmp/pod_logs/${POD_NAME}_${CONTAINER}.log"
  kubectl logs $POD_NAME -c $CONTAINER -n $NAMESPACE_NAME --previous > "/tmp/pod_logs/${POD_NAME}_${CONTAINER}-previous.log" 2>/dev/null || { echo "  Previous logs for container $CONTAINER not found"; rm -f "/tmp/pod_logs/${POD_NAME}_${CONTAINER}-previous.log"; }
}

save_all_pod_logs(){
  local NAMESPACE_NAME=$1
  # Get all pod names in the namespace
  POD_NAMES=$(kubectl get pods -n $NAMESPACE_NAME -o jsonpath='{.items[*].metadata.name}')

  for POD_NAME in $POD_NAMES; do
    echo "Retrieving logs for pod: $POD_NAME in namespace $NAMESPACE_NAME"

    INIT_CONTAINERS=$(kubectl get pod $POD_NAME -n $NAMESPACE_NAME -o jsonpath='{.spec.initContainers[*].name}')
    # Loop through each init container and retrieve logs
    for INIT_CONTAINER in $INIT_CONTAINERS; do
      retrieve_pod_logs $POD_NAME $INIT_CONTAINER $NAMESPACE_NAME
    done
    
    CONTAINERS=$(kubectl get pod $POD_NAME -n $NAMESPACE_NAME -o jsonpath='{.spec.containers[*].name}')
    for CONTAINER in $CONTAINERS; do
      retrieve_pod_logs $POD_NAME $CONTAINER $NAMESPACE_NAME
    done
  done

  mkdir -p "${ARTIFACT_DIR}/${namespace}/pod_logs"
  cp -a /tmp/pod_logs/* "${ARTIFACT_DIR}/${namespace}/pod_logs"
}