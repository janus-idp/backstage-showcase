# Showcase end-to-end tests

### How to setup backstage configuration during the pipeline

[configmap-app-config-rhdh.yaml](.ibm/pipelines/resources/config_map/configmap-app-config-rhdh.yaml) is the
configuration file
to add plugins or any other kind of configuration into Backstage

### Environment Variables into configmap-app-config-rhdh.yaml

To use environment variables
on [configmap-app-config-rhdh.yaml](.ibm/pipelines/resources/config_map/configmap-app-config-rhdh.yaml)
we need to set the envs encoded as Base64 in the
[secrets-rhdh-secrets.yaml](.ibm/pipelines/auth/secrets-rhdh-secrets.yaml) .
You can use temporary values for the secrets because it can be replaced by the pipeline.
Add the environments needed in our as Base64 encoded values and using secure property.

To replace the values into secrets-rhdh-secrets.yaml we need to create the replace function using
[openshift-tests.sh](.ibm/pipelines/openshift-tests.sh) script. For example:

`sed -i "s|KEYCLOAK_BASE_URL:.*|KEYCLOAK_BASE_URL: $KEYCLOAK_BASE_URL|g" $DIR/auth/secrets-rhdh-secrets.yaml
`
