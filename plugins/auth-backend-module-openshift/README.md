# Openshift Auth Backend Module

This backend auth module allows users to sign in to Backstage using Openshift.
This plugin is based on the upstream oauth2 auth provider with some modifications to fetch user profile from openshift and perform logout (currently does not work).

## Configuration

### Setting up Openshift

1. Setup an Openshift Cluster with an [identity provider](https://docs.openshift.com/container-platform/4.14/authentication/understanding-identity-provider.html)
2. Create a custom [`OAuthClient`](https://docs.openshift.com/container-platform/4.14/authentication/configuring-oauth-clients.html) in Openshift and set it's redirect URI to `${BACKEND_URL}/api/auth/openshift/handler/frame`
3. Save the `clientId` and `clientSecret` in the Backstage configuration

### App Configurations

In this example, the openshift oauth server url is located at `https://oauth-openshift.apps-crc.testing`, please replace it with your own Openshift oauth server url.

```yaml
auth:
  providers:
    openshift:
      development:
        clientId: <openshift oauth client id>
        clientSecret: <openshift oauth client secret>
        authorizationUrl: https://oauth-openshift.apps-crc.testing/oauth/authorize
        tokenUrl: https://oauth-openshift.apps-crc.testing/oauth/token
        scope: 'user:full'
        signIn:
          resolvers:
            - resolver: usernameMatchingUserEntityName
# Note: currently does not work without also setting NODE_EXTRA_CA_CERTS for the backstage instance
openshift:
  skipTlsVerify: false
  caData: <base64 encoded ca data>
  caFile: <path to ca file>
```

Please note that running with only `openshift.skipTlsVerify`, `openshift.caData` or `openshift.caFile` will not work at the moment since the backstage instance also needs to trust the Openshift CA.

Run with `NODE_TLS_REJECT_UNAUTHORIZED=0` to bypass the TLS verification, or provide the backstage instance with the Openshift CA using `NODE_EXTRA_CA_CERTS=<path to ca file>` (ideally pass in an absolute path).

---

NOTE: Logout currently does not work.

---
