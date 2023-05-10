---
'app': minor
---

The [Jfrog Artifactory plugin](https://github.com/janus-idp/backstage-plugins/tree/main/plugins/jfrog-artifactory) has been added with the `JfrogArtifactoryPage` in the Entity Page image registry tab.

These changes are **required** to `app-config.yaml` if you want to add the JFrog Artifactory plugin. Please read the [README](https://github.com/janus-idp/backstage-showcase/blob/main/README.md) and [Getting Started](https://github.com/janus-idp/backstage-showcase/blob/main/showcase-docs/getting-started.md) for more details.

```diff
 proxy:
   # Other proxy configurations...

+  '/jfrog-artifactory/api':
+    target: ${ARTIFACTORY_URL}
+    headers:
+      Authorization: Bearer ${ARTIFACTORY_TOKEN}
+    secure: ${ARTIFACTORY_SECURE}
+
 techdocs:
   builder: ${TECHDOCS_BUILDER_TYPE}
   generator:
```
