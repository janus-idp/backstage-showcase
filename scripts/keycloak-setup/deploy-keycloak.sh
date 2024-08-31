#!/bin/bash
# Guide: https://docs.redhat.com/en/documentation/red_hat_build_of_keycloak/22.0/html-single/operator_guide/index#basic-deployment-database
# Prerequisite: Install Keycloak Operator

set -e

KEYCLOAK_NAMESPACE=keycloak
CERT_HOSTNAME="" # Ex: keycloak.apps-crc.testing
DELETE=false

PWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "$PWD"

deployDB(){
  oc apply -f ${PWD}/database/postgres.yaml -n ${KEYCLOAK_NAMESPACE}
}

generateSSLCerts(){
  openssl req -subj "/CN=${CERT_HOSTNAME}/O=RHDH/C=CA" -newkey rsa:2048 -nodes -keyout "${PWD}/tls/key.pem" -x509 -days 365 -out "${PWD}/tls/" certificate.pem -addext "subjectAltName = DNS:${CERT_HOSTNAME}"
}
deployTLSKeys(){
  oc create secret tls example-tls-secret --cert ${PWD}/tls/certificate.pem --key ${PWD}/tls/key.pem -n ${KEYCLOAK_NAMESPACE}
}

deploySecrets(){
  oc apply -f ${PWD}/auth/database-secrets.yaml -n ${KEYCLOAK_NAMESPACE}
}

deployKeyCloak(){
  oc apply -f ${PWD}/keycloak.yaml -n ${KEYCLOAK_NAMESPACE}
}

deleteKeyCloak(){
  oc delete keycloak development-keycloak -n ${KEYCLOAK_NAMESPACE}
}

deleteDB(){
  oc delete statefulset postgresql-db
  oc delete service postgres-db
}

deleteSecrets(){
  oc delete secret keycloak-db-secret
  oc delete secret example-tls-secret
}

deleteAll(){
  deleteSecrets
  deleteDB
  deleteKeyCloak
}

deployAll(){
  deployTLSKeys
  deploySecrets
  deployDB
  deployKeyCloak
}

# Create Namespace and switch to it
oc new-project ${KEYCLOAK_NAMESPACE}
if [ $? -ne 0 ]; then
  # Switch to it if it already exists
  oc project ${KEYCLOAK_NAMESPACE}
fi

if [ "$1" == "uninstall" ]; then
    deleteAll
    exit 0
fi

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --generate-certs | -gc)
            CERT_HOSTNAME="$2"
            shift
            ;;
        --namespace | -n)
            KEYCLOAK_NAMESPACE="$2"
            shift
            ;;
        --uninstall)
            DELETE="true"
            ;;
        --help)
            usage
            exit 0
            ;;
    esac
    shift
done

if [ "$DELETE" == "true" ]; then
  deleteAll
  exit 0
fi

if [[ -n "$CERT_HOSTNAME" ]]; then
  generateSSLCerts
fi

deployAll
