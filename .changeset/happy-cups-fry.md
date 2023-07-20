---
'backend': minor
---

Adds a default allow all permission policy to the showcase app. Enabling the permission plugin requires permission.enabled to be set to true in the app-config. Also there is a requirement to set service to service auth which includes an auth key within the app-config.

Documentation for setting an auth key can be found under Service to [Service Auth](https://backstage.io/docs/auth/service-to-service-auth#setup)

```diff
backend:
+ auth:
+   keys:
+     - secret: ${BACKEND_AUTH_SECRET}
...

+ permission:
+   enabled: ${PERMISSIONS_ENABLED}
```
