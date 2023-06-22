---
'app': minor
---

The [Lighthouse plugin](https://github.com/backstage/backstage/tree/master/plugins/lighthouse) has been added with the `LighthouseCard` in the Lighthouse Tab in the Sidebar panel, the `EntityLighthouseContent` in the Entity Page Lighthouse Tab, and the `EntityLastLighthouseAuditCard` in the Entity Page Overview Tab.

These changes are **required** in `app-config.yaml` if you want to add the Lighthouse plugin. Please read the [README](https://github.com/janus-idp/backstage-showcase/blob/main/README.md) and [Getting Started](https://github.com/janus-idp/backstage-showcase/blob/main/showcase-docs/getting-started.md) for more details.

Please note that the Lighthouse plugin is a frontend for the [Lighthouse Audit Service](https://github.com/spotify/lighthouse-audit-service/tree/master) and requires it to be running.

```yaml
# app-config.yaml OR app-config.local.yaml
lighthouse:
  baseUrl: ${LIGHTHOUSE_BASEURL}
```

- To integrate the Lighthouse plugin into the catalog so that the Lighthouse audit info for a component can be displayed in that component's entity page, it is necessary to annotate the entity as shown below.
- Please Note that it is **essential** to include the `https://` or `http::/` in front of the link for this plugin to function correctly.
- Also please note that ending the website url with a `/` will cause it to be treated as a separate link compared to the same url without the `/`.
  - i.e. `https://backstage.io/` and `https://backstage.io` are not considered the same, therefore audits for each will be grouped separately.

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  # ...
  annotations:
    lighthouse.com/website-url: # A single website url e.g. https://backstage.io/
```
