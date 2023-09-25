---
'backend': minor
'app': minor
---

Adds the devtools [backend](https://github.com/backstage/backstage/tree/master/plugins/devtools-backend) plugin.

- Set `${DEVTOOLS_ENABLED}` to true to enable the backend
- To view the installed packages, navigate to `http://localhost:7000/api/devtools/info`
- To capture packages outside of the default `@backstage/*` packages, add the the package prefixes to the `app-config.yaml` file:

  ```yaml
  devTools:
    info:
      packagePrefixes:
        - '@roadiehq/'
        - '@spotify/'
        - '@janus-idp/'
        - '@immobiliarelabs/'
        - '@your-other-package/'
  ```

- To view the `app-config.yaml` file, navigate to `http://localhost:7007/api/devtools/config`

Adds the devtools [frontend](https://github.com/backstage/backstage/tree/master/plugins/devtools) plugin.

- Adds the `<DevToolsPage />` in the DevTools tab of the sidebar.
- Frontend plugin requires the devtools backend plugin to be enabled to function.
