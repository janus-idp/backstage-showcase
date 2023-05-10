---
'app': minor
---

The [Jira plugin](https://github.com/RoadieHQ/roadie-backstage-plugins/tree/main/plugins/frontend/backstage-plugin-jira) has been added with the `EntityJiraOverviewCard` in the Entity Page issues tab.

These changes are **required** to `app-config.yaml` if you want to add the Jira plugin. Please read the [README](https://github.com/janus-idp/backstage-showcase/blob/main/README.md) and [Getting Started](https://github.com/janus-idp/backstage-showcase/blob/main/showcase-docs/getting-started.md) for more details.

```diff
 backend:
   # Other backend configurations...

   csp:
     connect-src: ["'self'", 'http:', 'https:']
+    img-src:
+      - "'self'"
+      - 'data:'
+      - ${JIRA_URL}
   cors:
     origin: http://localhost:3000
     methods: [GET, HEAD, PATCH, POST, PUT, DELETE]
```

```diff
 proxy:
   # Other proxy configurations...

+  '/jira/api':
+    target: ${JIRA_URL}
+    headers:
+      Authorization: ${JIRA_TOKEN}
+      Accept: 'application/json'
+      Content-Type: 'application/json'
+      X-Atlassian-Token: 'no-check'
+      User-Agent: ${JIRA_USER_AGENT}
+
 techdocs:
   builder: ${TECHDOCS_BUILDER_TYPE}
   generator:
```
