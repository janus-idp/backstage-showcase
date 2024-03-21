# Auth Providers within Backstage Showcase

Currently we incorporate many of the Authentication providers available within Backstage. The Showcase supports the following providers:

| Auth Provider        | Auth Provider ID  |
| -------------------- | ----------------- |
| Auth0                | `auth0`           |
| Atlassian            | `atlassian`       |
| Azure                | `microsoft`       |
| Azure Easy Auth      | `azure-easyauth`  |
| Bitbucket            | `bitbucket`       |
| Bitbucket Server     | `bitbucketServer` |
| Cloudflare Access    | `cfaccess`        |
| GitHub               | `github`          |
| GitLab               | `gitlab`          |
| Google               | `google`          |
| Google IAP           | `gcp-iap`         |
| OIDC                 | `oidc`            |
| Okta                 | `okta`            |
| OAuth 2 Custom Proxy | `oauth2Proxy`     |
| OneLogin             | `onelogin`        |
| SAML                 | `saml`            |

## Enabling Authentication in Showcase

### GitHub

- Add the GitHub Authentication provider details as outlined below.

  ```yaml
  auth:
    environment: development
    providers:
      github:
        development:
          clientId: ${AUTH_GITHUB_CLIENT_ID}
          clientSecret: ${AUTH_GITHUB_CLIENT_SECRET}
          ## uncomment if using GitHub Enterprise
          # enterpriseInstanceUrl: ${AUTH_GITHUB_ENTERPRISE_INSTANCE_URL}
          ## uncomment if using a custom callback url
          # callbackUrl: ${AUTH_GITHUB_CALLBACK_URL}
  ```

For more information on setting up the GitHub auth provider, consult the [Backstage documentation](https://backstage.io/docs/auth/github/provider).

### GitLab

- Add the GitLab Authentication provider details as outlined below.

  ```yaml
  auth:
    environment: development
    providers:
      gitlab:
        development:
          clientId: ${AUTH_GITLAB_CLIENT_ID}
          clientSecret: ${AUTH_GITLAB_CLIENT_SECRET}
          ## uncomment if using self-hosted GitLab
          # audience: https://gitlab.company.com
          ## uncomment if using a custom redirect URI
          # callbackUrl: https://${BASE_URL}/api/auth/gitlab/handler/frame
  ```

For more information on setting up the GitLab auth provider, consult the [Backstage documentation](https://backstage.io/docs/auth/gitlab/provider).

### OAuth2 Proxy

The OAuth2 Proxy Authentication provider will require an OAuth2 Proxy server. You can consult the [official documentation](https://oauth2-proxy.github.io/oauth2-proxy/) for OAuth2 Proxy, as well as our available [blog post](https://janus-idp.io/blog/2023/01/17/enabling-keycloak-authentication-in-backstage) on the topic.

- Add the OAuth2 Proxy Authentication provider details as outlined below.

  ```yaml
  auth:
  environment: development
  providers:
    oauth2Proxy: {}
  ```

For more information on setting up the OAuth2 Proxy auth provider, consult the [Backstage documentation](https://backstage.io/docs/auth/oauth2-proxy/provider).

### OIDC

- Add the OIDC Authentication provider details as outlined below.

  ```yaml
  auth:
    environment: development
    # Providing an auth.session.secret will enable session support in the auth-backend
    session:
      secret: ${SESSION_SECRET}
    providers:
      oidc:
        development:
          metadataUrl: ${AUTH_OIDC_METADATA_URL}
          clientId: ${AUTH_OIDC_CLIENT_ID}
          clientSecret: ${AUTH_OIDC_CLIENT_SECRET}
          prompt: ${AUTH_OIDC_PROMPT} # recommended to use auto
          ## uncomment for additional configuration options
          # callbackUrl: ${AUTH_OIDC_CALLBACK_URL}
          # tokenEndpointAuthMethod: ${AUTH_OIDC_TOKEN_ENDPOINT_METHOD}
          # tokenSignedResponseAlg: ${AUTH_OIDC_SIGNED_RESPONSE_ALG}
          # scope: ${AUTH_OIDC_SCOPE}
  ```

In an example using Keycloak for authentication with the OIDC provider, there are a few steps that need to be taken to get everything working:

1. Create a realm named keycloak.
2. Create the client backstage with Client authentication checked.
3. Set the Valid redirect URIs to `<BACKSTAGE_URL>/api/auth/oidc/handler/frame`. If running Backstage Showcase locally, it would look something like this: `http://localhost:7007/api/auth/oidc/handler/frame`.
4. Set the `metadataUrl` to the URL of your Keycloak instance and realm. It should look similar to this: `<KEYCLOAK_URL>/realms/keycloak`.
5. Set the `clientId` to `backstage`.
6. Obtain the client secret for the client backstage within Keycloak and set `clientSecret`.
7. Set the `prompt` to `auto`.
8. Finally, set `auth.session.secret` to `superSecretSecret`.

For more information on setting up the OIDC auth provider, consult the [Backstage documentation](https://backstage.io/docs/auth/oidc#the-configuration).

### Sign In Page configuration value

After selecting the authentication provider you wish to use with your Backstage Showcase instance, ensure to add the `signInPage` configuration value to ensure that the frontend displays the appropriate authentication provider.

- Add the corresponding Authentication provider key as the value to `signInPage` in your `app-config`. Where `provider-id` matches the chosen provider from the table above.

  ```yaml
  signInPage: <provider-id>
  ```

### Disabling the guest login

We also offer an option to disable the Guest Login provider that disable the ability for guests to login to your Backstage Showcase instance.

- To disable the guest login set `auth.environment` to `production`.
