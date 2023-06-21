---
'app': minor
---

The [Lighthouse plugin](https://github.com/backstage/backstage/tree/master/plugins/lighthouse) has been added with the `LighthouseCard` in the Lighthouse Tab in the Sidebar page, the `EntityLighthouseContent` in the Entity Page Lighthouse Tab, and the `EntityLastLighthouseAuditCard` in the Entity Page Overview Tab.

These changes are **required** in `app-config.yaml` if you want to add the Lighthouse plugin. Please read the [README](https://github.com/janus-idp/backstage-showcase/blob/main/README.md) and [Getting Started](https://github.com/janus-idp/backstage-showcase/blob/main/showcase-docs/getting-started.md) for more details.

Please note that the Lighthouse plugin is a frontend for the [Lighthouse Audit Service](https://github.com/spotify/lighthouse-audit-service/tree/master) and requires it to be running. The Lighthouse Audit Service will require a postgres database to be setup, meaning that you will need to change the backend database to postgres instead of a SQLite database. Make sure that the { POSTGRESQL_USER } has the sufficient permissions to read databases. Please read the plugin database configuration [documentation](https://backstage.io/docs/tutorials/configuring-plugin-databases/) for more details.

```yaml
backend:
  # other backend configurations...
  database:
    # other database configurations
    plugin:
      lighthouse:
        client: pg
        connection:
          database: { LIGHTHOUSE_DATABASE_NAME }
          host: { POSTGRESQL_HOST }
          port: { POSTGRESQL_PORT }
          user: { POSTGRESQL_USER }
          password: { POSTGRESQL_PASSWORD }

lighthouse:
  baseUrl: ${LIGHTHOUSE_BASEURL}
```
