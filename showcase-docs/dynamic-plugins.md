# Dynamic Plugins support

## WARNING:

**_This is a work in progress_**

So this documentation, in its current form, is provisional and will be updated as next PRs related to this feature are merged.

Some referenced links and CLI tools may be come from temporary locations, provided in order to allow testing the base feature,
until required changes are made to the related deployment helm templates and CLI tools.

## Overview

This document describes how to enable the dynamic plugins feature in the Janus Backstage showcase application.

For now only backend plugins are supported.

## How it works

The dynamic plugin support is based on the [backend plugin manager package](https://github.com/backstage/backstage/tree/master/packages/backend-plugin-manager), which is a service that scans a configured root directory (`dynamicPlugins.rootDirectory` in the app config) for dynamic plugin packages, and loads them dynamically.

## Preparing dynamic plugins for the showcase

The backstage showcase application is still using the legacy backend system.
So to be compatible with the showcase dynamic plugin support, and used as dynamic plugins, existing plugins must be completed code-wise, as well as rebuilt with a dedicated CLI command.

### Required code changes

In the old backend system, the wiring of the plugin in the application must be done manually, based on instructions generally passed in the readme of the plugin. This is obviously not compatible with the dynamic plugin support, which requires the plugin to be wired automatically.

So there are some changes to be made to the plugin code, in order to make it compatible with the dynamic plugin support:

1. The plugin must:

- import the `@backstage/backend-plugin-manager` package, as an alias to `@janus-idp/backend-plugin-manager@0.0.2-janus.1` package,
- override the `@backspage/cli` dependency to use the provisional fork that supports a new, required `export-dynamic-plugin` command,
- add the `export-dynamic` script entry,
- add the following elements to the package `files` list:

  `"dist-dynamic/*.*", "dist-dynamic/dist/**", "dist-dynamic/alpha/*"`

These recommended changes to the `package.json` are summarized below:

```json
  ...
  "scripts": {
    ...
    "export-dynamic": "backstage-cli package export-dynamic-plugin"
    ...
  },
  ...
  "dependencies": {
    ...
    "@backstage/backend-plugin-manager": "npm:@janus-idp/backend-plugin-manager@0.0.2-janus.1",
    ...
  }
  ...
  "devDependencies": {
    "@backstage/cli": "npm:@dfatwork-pkgs/backstage-cli@0.22.9-next.6"
  },
  ...
  "files": [
    ...
    "dist-dynamic/*.*",
    "dist-dynamic/dist/**",
    "dist-dynamic/alpha/*"
  ],
```

2. A `src/dynamic/index.ts` file must be added, and must export a named entry point (`dynamicPluginInstaller`) of a specific type (`BackendDynamicPluginInstaller`) that will contain the code of the plugin wiring:

```ts
import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',

  // Contributions of the plugin to the application.
  // Here optional fields allow embedding the code which is usually described in the plugin readme for manual addition.
  // If a contribution is not used, the field should be omitted.

  router: {
    pluginID: 'router plugin ID, used as REST endpoint suffix',
    createPlugin(env) {
      // Return a promise to your router.
      return Promise.reject(new Error('Not implemented'));
    },
  },

  events(eventsBackend, env) {
    // Do something with the events backend (add subscribers or publishers)
    // and return a list of HttpPostIngressOptions that will be
    // registered with the http event endpoint.
    return [];
  },

  catalog(builder, env) {
    // Add catalog contributions, such as
    // entity providers or location analyzers.
  },

  scaffolder(env) {
    // Return an array of scaffolder actions (TemplateAction)
    // that will be registered with the scaffolder.
    return [];
  },

  search(indexBuilder, schedule, env) {
    // Add search contributions, such as
    // collators and decorators.
  },
};
```

3. The `dynamicPluginInstaller` entry point must be exported in the main `src/index.ts` file:

```ts
export * from './dynamic/index';
```

### Exporting the plugin as a dynamic plugin package

Once the code changes are done, the plugin can be exported as a dynamic plugin package, using the `export-dynamic` script entry:

```bash
yarn export-dynamic
```

The resulting package will be located in the `dist-dynamic` sub-folder of the plugin folder. It is renamed by adding the `-dynamic` suffix to the plugin name.

This allows packing it with `npm pack`, or publishing it to an npm registry.

The dynamic export mechanism identifies private, non-backstage dependencies, and sets the `bundleDependencies` field in the `package.json` file for them, so that the dynamic plugin plackage can be published as a self-contained package, along with its private dependencies bundled in a private `node_modules` folder.

Common backstage dependencies, expected to be in the backstage backend application, are not bundled in the dynamic plugin but rather changed as peer dependencies, so that they can be shared with the backstage backend application.

#### About embedding dependencies in the plugin package

The `export-dynamic-plugin` command can also embed some dependencies in the dynamic plugin package, by using the `--embed-package` option. For example:

```bash
yarn export-dynamic --embed-package @roadiehq/scaffolder-backend-module-http-request
```

This merges the code of the specified dependencies in the generated dynamic plugin code, and updates the `package.json` file to hoist their dependencies to the top level.

This is useful when wrapping a third-party plugin to make it compatible with the dynamic plugin support, as explained in the next section.

#### Wrapping a third-party plugin to add dynamic plugin support

In order to add dynamic plugin support to a third-party plugin, without touching the third-party plugin source code, a wrapper plugin can be created that will:

- import the third-party plugin,
- include the additions described above,
- export it as a dynamic plugin.

An example of such a wrapper plugin can be found in the [dynamic backend plugin showcase repository](https://github.com/janus-idp/dynamic-backend-plugins-showcase/tree/main/plugins/scaffolder-backend-module-http-request-wrapped): it wraps the `@roadiehq/scaffolder-backend-module-http-request` package to make it compatible with the dynamic plugin support and, through the use of the `--embed-package` option in the [`export-dynamic` script](https://github.com/janus-idp/dynamic-backend-plugins-showcase/blob/d254c065764ab49289c2bcaad9fd996d49003f9d/plugins/scaffolder-backend-module-http-request-wrapped/package.json#L21), embeds the wrapped plugin code in the generated code and hoist its `@backstage` dependencies as peer dependencies in the resulting dynamic plugin.

## Installing a dynamic plugin package in the showcase

### Local configuration

- Create a `dynamic-plugins-root` folder at the root of the showcase application repository.

- In the `app-config.yaml` file, add the following entry:

  ```yaml
  dynamicPlugins:
    rootDirectory: dynamic-plugins-root
  ```

- Copy the dynamic plugin package to the `dynamic-plugins-root` folder with the following commands:

  ```bash
  pkg=<local dist-dynamic sub-folder or remote package name of the dynamic plugin package>
  archive=$(npm pack $pkg)
  tar -xzf "$archive" && rm "$archive"
  mv package $(echo $archive | sed -e 's:\.tgz$::')
  ```

  It will create a sub-folder named after the package name, and containing the dynamic plugin package.

- Start the showcase application. During the initialization step it should have a log entry similar to the following:

  ```
  backstage info loaded dynamic backend plugin '@scope/some-plugin-dynamic' from 'file:///showacase-root/dynamic-plugins-root/scope-some-plugin-dynamic-0.0.1'
  ```

### Helm deployment

- In order to enable dynamic plugins support in the showcase application deployed through the [helm chart](https://github.com/janus-idp/helm-backstage), the helm values used during helm chart installation must be overriden by the values found [here](https://raw.githubusercontent.com/davidfestal/helm-backstage/a7a1cb42f5bffbb3f0668a3437b0366be9f819b8/charts/backstage/values.yaml)

- These updated Helm values contain a new `global.dynamicPlugins` value, which by default is an empty list. This list must be updated to contain the list of dynamic plugins to be installed. A package can be specified either as a local path to the dynamic plugin `dist-dynamic` sub-folder, or as a package specification in an NPM repository.

- So adding a dynamic plugin to the showcase is done by adding an entry to the `global.dynamicPlugins` list, with the package specification of the dynamic plugin package to be installed, as well as an optional plugin-specific `app-config` yaml fragment. For 2 plugins, one of which requires specific app-config, the list would be as follows:

  ```yaml
  global:
    dynamicPlugins:
      - package: <a package-spec used by npm pack>
      - package: <another package-spec used by npm pack>
        pluginConfig:
          some:
            app-config:
              package-specific-fragment: value
  ```

### Example Dynamic plugins

If you want to easily test the dynamic backend plugins support,
you can use the example dynamic backend plugins described
in the [dynamic backend plugin showcase repository](https://github.com/janus-idp/dynamic-backend-plugins-showcase/tree/main#provided-example-dynamic-plugins),
which have been pushed to NPMJS in the `dfatwork-pkgs` organization.

In order to do this, just add the following dynamic plugins to the `global.dynamicPlugins` list in the helm chart values:

```yaml
global:
  dynamicPlugins:
    - package: '@dfatwork-pkgs/scaffolder-backend-module-http-request-wrapped-dynamic'
    - package: '@dfatwork-pkgs/plugin-events-backend-module-test-dynamic'
    - package: '@dfatwork-pkgs/explore-backend-wrapped-dynamic'
      pluginConfig:
        proxy:
          endpoints:
            /explore-backend-completed:
              target: 'http://localhost:7017'
    - package: '@dfatwork-pkgs/search-backend-module-explore-wrapped-dynamic'
    - package: '@dfatwork-pkgs/plugin-catalog-backend-module-test-dynamic'
```

By adding those plugins one after the other, and waiting for a deployment restart after each change,
you should be able to follow the steps described in the related
[Proposed Demo Path](https://github.com/janus-idp/dynamic-backend-plugins-showcase/tree/main#proposed-demo-path).

### Using a custom NPM registry

Since dynamic plugin packages are grabbed through `npm pack`,
it is possible to configure the NPM registry URL, as well as
the authentication information, using a `.npmrc` file.

In order to add a `.npmrc` when using the helm chart,
just create a secret, named `dynamic-plugins-npmrc`,
with the following content:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: dynamic-plugins-npmrc
type: Opaque
stringData:
  .npmrc: |
    registry=<registry-url>
    //<registry-url>:_authToken=<auth-token>
```

This can also be done from the helm chart values directly, by adding the following lines to the `upstream.extraDeploy` value:

```yaml
upstream:
  extraDeploy:
    - apiVersion: v1
      kind: Secret
      metadata:
        name: dynamic-plugins-npmrc
      stringData:
        .npmrc: |
          registry=https://registry.npmjs.org/
          ...
```
