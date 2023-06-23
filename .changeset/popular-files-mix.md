---
'app': minor
---

The [PagerDuty](https://github.com/backstage/backstage/tree/master/plugins/pagerduty) has been added with the `<EntityPagerDutyCard />` in the Entity Page Overview tab.

Since PagerDuty requires a proxy endpoint, these changes are **required** to `app-config.yaml` if you want to add the PagerDuty plugin. Please read the [README](../README.md) and [Getting Started](../showcase-docs/getting-started.md) for more details.

```yaml
proxy:
  # Other proxy configurations...

  '/pagerduty':
    target: https://api.pagerduty.com
    headers:
      Authorization: Token token=${PAGERDUTY_TOKEN}
```
