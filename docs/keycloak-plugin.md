# Setting up to use the Keycloak plugin

The Keycloak plugin allows you to view information about users and groups that were created in Keycloak within the Backstage app. This showcase application adds the Keycloak plugin to demonstrate the value that this plugin can provide.

## Getting Started

There will need to be an instance of Keycloak running within an OpenShift cluster.

Create a new project called keycloak.
`oc new-project keycloak`

Run Keycloak

```shell
oc process -f https://raw.githubusercontent.com/keycloak/keycloak-quickstarts/latest/openshift-examples/keycloak.yaml \
    -p KEYCLOAK_ADMIN=admin \
    -p KEYCLOAK_ADMIN_PASSWORD=admin \
    -p NAMESPACE=keycloak \
    | oc create -f -
```

This will spin up a simple Keycloak server in the keycloak project namespace. The admin username and password are both set to admin.

## Login into Keycloak

The next steps will involve setting up users and preparing Keycloak to be used with the Backstage Showcase app. Start by opening up the Keycloak console and logging in using the admin credentials.

### Create the Realm

1. Select the drop down that says master and click on Create Realm
2. Fill in the Realm name portion of the form with the value backstage
3. Click Create

### Create the Client

1. Select the Clients option in the navigation bar
2. Select Create client button
3. Fill in the ID of the Client with backstage
4. Click next
5. Ensure the Client authentication and Service accounts roles are enabled
6. Click Save to create the client
7. Under the Service accounts roles, click the Assign role button
8. Filtering by clients and search with realm-management, select the query-groups, query-users, and view users options
9. Click Assign

Under the Credentials tab we will find the Client secret that will be needed later on in the guide.

### Create the Groups

1. Select the Groups option in the navigation bar
2. Select the Create group button
3. Create the groups Admins and Users

### Create the Users

1. Select the Users option in the navigation bar
2. Input the information based on the chart below to create the users

| Property       | User 1                      | User 2                     |
| -------------- | --------------------------- | -------------------------- |
| Username       | backstageadmin              | backstageuser              |
| Email          | backstageadmin@janus-idp.io | backstageuser@janus-idp.io |
| Email Verified | Checked                     | Checked                    |
| First Name     | Backstage                   | Backstage                  |
| Last Name      | Admin                       | User                       |
| Groups         | Admins                      | Users                      |

3. After the accounts have been created, click on the Credentials tab to Set a Password

- Ensure to uncheck the temporary option

### Endpoint

1. Navigate to the Realm setting using the option in the navigation bar
2. Click on the OpenID Endpoint Configuration link

Here you will find the issuer URL that will be needed later in this guide.

## Deploying to a Kubernetes cluster

This guide will have a focus on deploying to an OpenShift cluster as that is the main target for this project.

Utilizing the same values-backstage-showcase.yaml file, we will make some changes to integrate Keycloak into the app.

```yaml
backstage:
  image:
    registry: <registry>
        repository: <repository>
        tag: <tag>
  extraEnvVars:
    # Base environment variables
    - name: 'APP_CONFIG_app_baseUrl'
      value: 'https://{{ .Values.ingress.host }}'
    - name: 'APP_CONFIG_backend_baseUrl'
      value: 'https://{{ .Values.ingress.host }}'
    - name: 'APP_CONFIG_backend_cors_origin'
      value: 'https://{{ .Values.ingress.host }}'

    # Keycloak environment variables
    - name: "APP_CONFIG_catalog_providers_keycloakOrg_default_baseUrl"
      value: '{{ required "Keycloak BaseUrl is Required" .Values.catalog.providers.keycloakOrg.default.baseUrl }}'
    - name: "APP_CONFIG_catalog_providers_keycloakOrg_default_loginRealm"
      value: '{{ required "Keycloak Login Realm is Required" .Values.catalog.providers.keycloakOrg.default.realm }}'
    - name: "APP_CONFIG_catalog_providers_keycloakOrg_default_realm"
      value: '{{ required "Keycloak Realm is Required" .Values.catalog.providers.keycloakOrg.default.realm }}'
    - name: "APP_CONFIG_catalog_providers_keycloakOrg_default_clientId"
      value: '{{ required "Keycloak Client Id is Required" .Values.catalog.providers.keycloakOrg.default.clientId }}'
    - name: "APP_CONFIG_catalog_providers_keycloakOrg_default_clientSecret"
      value: '{{ required "Keycloak Client Secret is Required" .Values.catalog.providers.keycloakOrg.default.clientSecret }}'

  extraContainers:
    - name: oauth2-proxy
      env:
        - name: OAUTH2_PROXY_CLIENT_ID
          value: '{{ required "Keycloak Client Secret is Required" .Values.keycloak.clientId }}'
        - name: OAUTH2_PROXY_CLIENT_SECRET
          value: '{{ required "Keycloak Client Secret is Required" .Values.keycloak.clientSecret }}'
        - name: OAUTH2_PROXY_COOKIE_SECRET
          value: '{{ default (randAlpha 32 | lower | b64enc) .Values.keycloak.cookieSecret }}'
        - name: OAUTH2_PROXY_OIDC_ISSUER_URL
          value: '{{ required "Keycloak Issuer URL is Required" .Values.keycloak.issuerUrl }}'
        - name: OAUTH2_PROXY_SSL_INSECURE_SKIP_VERIFY
          value: 'true'
      ports:
        - name: oauth2-proxy
          containerPort: 4180
          protocol: TCP
      imagePullPolicy: IfNotPresent
      image: 'quay.io/oauth2-proxy/oauth2-proxy:latest'
      args:
        - '--provider=oidc'
        - '--email-domain=*'
        - '--upstream=http://localhost:7007'
        - '--http-address=0.0.0.0:4180'
        - '--skip-provider-button'

service:
  ports:
    backend: 4180
    targetPort: oauth2-proxy

ingress:
  enabled: true
  host: backstage.<domain>

keycloak:
  issuerUrl: <Endpoint Issue URL>
  clientId: backstage
  clientSecret: <client secret>
  cookieSecret: ''

catalog:
    providers:
        keycloakOrg:
            default:
                baseUrl: <Base URL>
                loginRealm: backstage
                realm: backstage
                clientId: <Client Id>
                clientSecret: <Client Secret>
```

The domain can be found using the following command.

```shell
oc describe ingresscontroller/default -n openshift-ingress-operator | grep Domain:
```

The `<Endpoint Issuer URL>` can be found from the Realm settings page.

`<Base URL>` is the portion of the endpoint issuer url minus the `/realms/backstage`.

`<Client Secret>` can be found under the credentials tab of the client that you created and `<Client ID>` is the name of the client you created.

Next, using Helm, we will deploy the Backstage Showcase app to OpenShift using the following command.

```shell
helm install -n backstage --create-backstage backstage/backstage -f values-backstage-showcase.yaml
```

When navigating to your instance of the Backstage Showcase app, Oauth2 proxy will intercept the request and redirect to the Keycloak login. Now we can log in using either of the two users previously created.

Finally, we will navigate to the Catalog page using the Home option in the navigation bar. From here, we can choose to filter by users from the dropdown to see the two users that we originally created from within Keycloak.

## For more information

More information on the Keycloak plugin can be found on in the Janus IDP [backstage-plugins](https://github.com/janus-idp/backstage-plugins/tree/main/plugins/keycloak-backend) repository.

There is also a Janus IDP blog post [Enabling Keycloak Authentication in Backstage](https://janus-idp.io/blog/enabling-keycloak-authentication-in-backstage).
