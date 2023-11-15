#!/bin/bash
LOGFILE="pr-${GIT_PR_NUMBER}-kubernetes-tests-${BUILD_NUMBER}"
echo "Log file: ${LOGFILE}"
# source ./.ibm/pipelines/functions.sh

# install the latest ibmcloud cli on Linux
install_ibmcloud() {
  if [[ -x "$(command -v ibmcloud)" ]]; then
    echo "ibmcloud is already installed."
  else
    curl -fsSL https://clis.cloud.ibm.com/install/linux | sh
    echo "the latest ibmcloud cli installed successfully."
  fi
}

# Call the function to install oc
install_ibmcloud

ibmcloud version
ibmcloud config --check-version=false
ibmcloud plugin install -f container-registry
ibmcloud plugin install -f kubernetes-service

ibmcloud login -r "${IBM_REGION}" -g "${IBM_RSC_GROUP}" --apikey "${SERVICE_ID_API_KEY}"
ibmcloud ks cluster config --cluster "${IKS_CLUSTER_ID}"

install_kubectl() {
  if [[ -x "$(command -v kubectl)" ]]; then
    echo "kubectl is already installed."
  else
    # install kubectl
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" \
    && chmod +x kubectl \
    && mv kubectl /usr/local/bin/
    echo "kubectl installed successfully."
  fi
}

# Call the function to install kubectl
install_kubectl

kubectl version
kubectl config current-context

install_helm() {
  if [[ -x "$(command -v helm)" ]]; then
    echo "Helm is already installed."
  else
    echo "Installing Helm 3 client"

    WORKING_DIR=$(pwd)
    mkdir ~/tmpbin && cd ~/tmpbin

    HELM_INSTALL_DIR=$(pwd)
    curl -sL https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash -f
    export PATH=${HELM_INSTALL_DIR}:$PATH

    cd $WORKING_DIR
    echo "helm client installed successfully."
  fi
}

install_helm

# check installed helm version
helm version

helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add backstage https://backstage.github.io/charts
helm repo add janus-idp https://janus-idp.github.io/helm-backstage
helm repo update

helm upgrade -i backstage backstage/backstage -n backstage -f ./helm/values-k8s-ingress.yaml --wait
  
echo "Waiting for backstage deployment..."
sleep 45

kubectl get pods -n backstage
kubectl port-forward -n backstage svc/backstage 7007:7007 &
# Store the PID of the background process
PID=$!

sleep 15

# Check if Backstage is up and running
BACKSTAGE_URL="http://localhost:7007"
BACKSTAGE_URL_RESPONSE=$(curl -Is "$BACKSTAGE_URL" | head -n 1)
echo "$BACKSTAGE_URL_RESPONSE"

cd $WORKING_DIR/e2e-test
yarn install

Xvfb :99 &
export DISPLAY=:99

# yarn cypress run --headless --browser chrome
yarn run cypress:run 

pkill Xvfb

cd $WORKING_DIR

# Send Ctrl+C to the process
kill -INT $PID

helm uninstall backstage -n backstage

rm -rf ~/tmpbin
