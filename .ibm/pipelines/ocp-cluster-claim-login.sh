#!/bin/bash

# Prompt the user for the namespace
read -p "Enter the namespace (should start with 'rhdh-4-17-us-east-2'): " namespace

if [[ -z "$namespace" ]]; then
    echo "Namespace cannot be empty. Please provide a valid namespace."
    exit 1
elif [[ ! "$namespace" =~ ^rhdh-4-17-us-east-2 ]]; then
    echo "Namespace must start with 'rhdh-4-17-us-east-2'."
    exit 1
fi

# Log in to the cluster
oc login --web https://api.hosted-mgmt.ci.devcluster.openshift.com:6443

# Retrieve the kubeadmin password from the specified namespace
password=$(oc get secret $(oc get secrets -n "$namespace" | grep admin-password | awk '{print $1}') -n "$namespace" -o jsonpath='{.data.password}' | base64 -d)

# Log out from the current session
oc logout

# Log in to the namespace-specific cluster
oc login https://api."$namespace".rhdh-qe.devcluster.openshift.com:6443 --username kubeadmin --password "$password"
oc project showcase

# Prompt the user to open the web console
read -p "Do you want to open the OpenShift web console? (y/n): " open_console

if [[ "$open_console" == "y" || "$open_console" == "Y" ]]; then
    
    console_url="https://console-openshift-console.apps.${namespace}.rhdh-qe.devcluster.openshift.com"

    echo "Opening web console at $console_url..."
    echo "Use bellow user and password to login into web console:"
    echo "Username: kubeadmin"
    echo "Password: $password"
    sleep 3
    
    # Attempt to open the web console in the default browser
    if command -v xdg-open &> /dev/null; then
        xdg-open "$console_url" # For Linux systems
    elif command -v open &> /dev/null; then
        open "$console_url" # For macOS
    else
        echo "Unable to detect a browser. Please open the following URL manually:"
        echo "$console_url"
    fi
else
    echo "Web console not opened."
fi