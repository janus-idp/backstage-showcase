---
'backend': minor
'app': minor
---

Adds Authentication to the showcase app. Adds a sign on page that will either use the GitHub and Guest identity providers or the Oauth2Proxy identity provider based on an environment variable set within the app-config.

GitHub and guest will be used whenever the environment variable is set to development

Oauth2Proxy will be used whenever the environment variable is set to production

- note: the GitHub section will also need to be updated to ensure that the GitHub plugins work properly

To enable GitHub and guest Sign in pages, add the below to the app-config

```yaml
auth:
  environment: development
  providers:
    github:
      development:
        clientId: ${GITHUB_APP_CLIENT_ID}
        clientSecret: ${GITHUB_APP_CLIENT_SECRET}
```

To enable Keycloak Sign in, add the below to the app-config

```yaml
auth:
  environment: production
  providers:
    github:
      production:
        clientId: ${GITHUB_APP_CLIENT_ID}
        clientSecret: ${GITHUB_APP_CLIENT_SECRET}
    oauth2Proxy: {}
```
