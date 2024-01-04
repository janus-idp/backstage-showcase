# Save the logs from the file passed as parameter #1
# and send a message to GitHub PR using parameter #2 as name of test
#
# Env vars:
#  IBM_RESOURCE_GROUP: Resource group of the Cloud ObjectStorage
#  IBM_COS: Cloud Object Storage containing the bucket on which to save logs
#  IBM_BUCKET: Bucket name on which to save logs
save_logs() {
    LOGFILE="$1"
    NAME="$2"
    RESULT="$3"

    ansi2html <"/tmp/${LOGFILE}" >"/tmp/${LOGFILE}.html"
    
    CRN=$(ibmcloud resource service-instance ${IBM_COS} --output json | jq -r .[0].guid)
    ibmcloud cos config crn --crn "${CRN}"
    ibmcloud cos upload --bucket "${IBM_BUCKET}" --key "${LOGFILE}.html" --file "/tmp/${LOGFILE}.html" --content-type "text/html; charset=UTF-8"
    
    BASE_URL="https://s3.${IBM_REGION}.cloud-object-storage.appdomain.cloud/${IBM_BUCKET}"
    if [[ $RESULT == "0" ]]; then
        STATUS="successfully"
    else
        STATUS="with errors"
    fi

    cat <<EOF | pr-commenter -key-from-env-var ROBOT_KEY -application-id=${GITHUB_APP_PR_COMMENTER_ID} -pr-comment=${GIT_PR_NUMBER} -repository=${GITHUB_REPOSITORY_NAME} -org=${GITHUB_ORG_NAME}
${NAME} on commit ${GIT_COMMIT} finished **${STATUS}**.
View [test log](${BASE_URL}/${LOGFILE}.html)
EOF
}

save_junit() {
    pwd
    set -x
    JUNIT_RESULTS_LOCATION="$(pwd)/cypress/results/junit"

    ls $JUNIT_RESULTS_LOCATION

    declare -a JUNIT_FILES_ARRAY

    CRN=$(ibmcloud resource service-instance ${IBM_COS} --output json | jq -r .[0].guid)
    ibmcloud cos config crn --crn "${CRN}"

    echo "BEFORE FOR"
    for JUNIT_FILE in "$JUNIT_RESULTS_LOCATION"/*; do
        echo "JUNIT_FILE=${JUNIT_FILE}"
        FILE_NAME=$(basename "$JUNIT_FILE")
        FILE_PATH=$(readlink "$JUNIT_FILE")
        echo "FILE_NAME=${FILE_NAME}"
        echo "FILE_PATH=${FILE_NAME}"
        ibmcloud cos upload --bucket "${IBM_BUCKET}" --key "${FILE_NAME}" --file "${FILE_PATH}" --content-type "text/xml; charset=UTF-8"
        JUNIT_FILES_ARRAY+=("$FILE_NAME")
        echo "JUNIT_FILES_ARRAY=${JUNIT_FILES_ARRAY}"
    done

    JSON_FILES=$(printf '%s\n' "${JUNIT_FILES_ARRAY[@]}" | jq -c -R . | jq -s .)
    echo "JSON_FILES=${JSON_FILES}"
    curl -X POST "${WEBHOOK_URL}" -H "Content-Type: application/json" -d "{\"junit-files\": $JSON_FILES}"
    set +x
}

skip_if_only() {
    echo "Checking if tests need to be executed..."
    NAMES=$(git diff --merge-base --name-only main)
    for change in ${NAMES}; do
        skip $change
        if [[ $? == 0 ]]; then
            return
        fi
    done
    echo   "  => Skipping the tests."
    exit 0
}

skip() {
    SKIP_IF_ONLY="docs/ CONTRIBUTING.md OWNERS README.md USAGE_DATA.md scripts/ .github/ .threatmodel/ ui/"
    change=$1
    for skip in ${SKIP_IF_ONLY}; do
        if [[ "${change}" == "${skip}"* ]]; then
            echo "  - ${change} is ${skip}*"
            return 1
        fi
    done
    echo "  - $change not in $SKIP_IF_ONLY"
    return 0
}
