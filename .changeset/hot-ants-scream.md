---
'app': minor
---

The [Nexus Repository Manager](https://github.com/janus-idp/backstage-plugins/tree/main/plugins/nexus-repository-manager) plugin has been added with the <NexusRepositoryManagerPage /> in the Entity Page Image Registry tab.

Since the Nexus Repository Manager plugin requires a proxy endpoint, these changes are required to `app-config.yaml` if you want to add the Nexus Repository Manager plugin. Please read the [README](https://github.com/janus-idp/backstage-showcase/blob/main/README.md) and [Getting Started](https://github.com/janus-idp/backstage-showcase/blob/main/showcase-docs/getting-started.md) for more details.

```diff
proxy:
  # Other proxy configurations...

+ '/nexus-repository-manager':
+   target: ${NEXUS_REPOSITORY_MANAGER_URL}
+   headers:
+     X-Requested-With: 'XMLHttpRequest'
+     # Uncomment the following line to access a private Nexus Repository Manager using a token
+     # Authorization: 'Bearer <NEXUS_REPOSITORY_MANAGER_TOKEN>'
+   changeOrigin: true
+   # Change to "false" in case of using self hosted Nexus Repository Manager instance with a self-signed certificate
+   secure: ${NEXUS_REPOSITORY_MANAGER_SECURE}
```
