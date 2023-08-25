---
'app': minor
---

The [Dynatrace](https://github.com/backstage/backstage/tree/master/plugins/dynatrace) has been added with the `<DynatraceTab />` in the Entity Page Monitoring tab.

Since Dynatrace requires a proxy endpoint, these changes are **required** to `app-config.yaml` if you want to add the Dynatrace plugin. Please read the [README](../README.md) and [Getting Started](../showcase-docs/getting-started.md) for more details.

```diff
proxy:
  # Other proxy configurations...

+   '/dynatrace':
+   target: ${DYNATRACE_API_URL}
+   headers:
+     Authorization: 'Api-Token ${DYNATRACE_ACCESS_TOKEN}'
```
