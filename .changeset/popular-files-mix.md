---
'app': minor
---

The [PagerDuty](https://github.com/backstage/backstage/tree/master/plugins/pagerduty) has been added with the `<EntityPagerDutyCard />` in the Entity Page Overview tab.

Since PagerDuty requires a proxy endpoint, these changes are **required** to `app-config.yaml` if you want to add the Dynatrace plugin. Please read the [README](../README.md) and [Getting Started](../showcase-docs/getting-started.md) for more details.

```yaml
proxy:
  # Other proxy configurations...

  '/pagerduty':
    target: https://api.pagerduty.com
    headers:
      Authorization: Token token=${PAGERDUTY_TOKEN}
```

Optional Configurations:

**WARNING**: The default implementation of the PagerDuty plugin will require the `/pagerduty` endpoint to be exposed as an unprotected endpoint.

- If this is considered problematic, consider using the plugin in `readOnly` mode by making the following modifications:
  - Changing `<EntityPagerDutyCard />` to `<EntityPagerDutyCard readOnly={true}/>` in the [`Overview.tsx`](../packages/app/src/components/catalog/EntityPage/Content/Overview.tsx) file
  - Uncommenting `allowedMethods: ['GET']` in the `proxy` section of `app-config.yaml`

```diff
<Grid item container>
  <EntitySwitch>
    <EntitySwitch.Case if={isPagerDutyAvailable}>
      <Grid item md={6}>
-       <EntityPagerDutyCard />
+       <EntityPagerDutyCard readOnly={true} />
      </Grid>
    </EntitySwitch.Case>
  </EntitySwitch>
</Grid>
```

```diff
proxy:
  # Other proxy configurations...

  '/pagerduty':
    target: https://api.pagerduty.com
    headers:
      Authorization: Token token=${PAGERDUTY_TOKEN}
      # prohibit the `/pagerduty` proxy endpoint from servicing non-GET requests
+     allowedMethods: ['GET']
```
