# Dynamic Plugins support

## Overview

This document describes how to enable the dynamic plugins feature in the Janus Backstage showcase application.

## How it works

The dynamic plugin support is based on the [backend plugin manager package](https://github.com/backstage/backstage/tree/master/packages/backend-dynamic-feature-service), which is a service that scans a configured root directory (`dynamicPlugins.rootDirectory` in the app config) for dynamic plugin packages, and loads them dynamically.

While this package remains in an experimental phase and is a private package in the upstream backstage repository, it is primarily awaiting seamless integration with the new backend system before its APIs can be finalized and frozen. It is worth noting that it is already in use in the backstage showcase application, facilitated by a derivative package published in the `@janus-idp` NPM organization.

## Preparing dynamic plugins for the showcase

### Backend plugins

The backstage showcase application is still using the legacy backend system.
So to be compatible with the showcase dynamic plugin support, and used as dynamic plugins, existing plugins must be completed code-wise, as well as rebuilt with a dedicated CLI command.

#### Required code changes

In the old backend system, the wiring of the plugin in the application must be done manually, based on instructions generally passed in the readme of the plugin. This is obviously not compatible with the dynamic plugin support, which requires the plugin to be wired automatically.

So there are some changes to be made to the plugin code, in order to make it compatible with the dynamic plugin support:

1. The plugin must:

- import the `@backstage/backend-dynamic-feature-service` package,
- add the `@janus-idp/cli` dependency, which provides a new, required, `export-dynamic-plugin` command.
- add the `export-dynamic` script entry,
- add the following elements to the package `files` list:

  `"dist-dynamic/*.*", "dist-dynamic/dist/**", "dist-dynamic/alpha/*"`

These recommended changes to the `package.json` are summarized below:

```json
  ...
  "scripts": {
    ...
    "export-dynamic": "janus-cli package export-dynamic-plugin"
    ...
  },
  ...
  "dependencies": {
    ...
    "@backstage/backend-dynamic-feature-service": "0.1.0",
    ...
  }
  ...
  "devDependencies": {
    "@janus-idp/cli": "^1.4.7"
  },
  ...
  "files": [
    ...
    "dist-dynamic/*.*",
    "dist-dynamic/dist/**",
    "dist-dynamic/alpha/*"
  ],
```

1. A `src/dynamic/index.ts` file must be added, and must export a named entry point (`dynamicPluginInstaller`) of a specific type (`BackendDynamicPluginInstaller`) that will contain the code of the plugin wiring:

```ts
import { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

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

1. The `dynamicPluginInstaller` entry point must be exported in the main `src/index.ts` file:

```ts
export * from './dynamic/index';
```

#### Note about the new backend system support

While the Showcase application has not yet integrated the new backend system, the underlying mechanism responsible for discovering and loading dynamic backend plugins is already compatible with both the new and old backend systems.

As the new backend system gains broader acceptance and is implemented in the Janus Showcase, it is advisable to adapt dynamic backend plugins to rely on this new system. Therefore, we **strongly recommend** creating the anticipated entry points for the new backend system (using `createBackendPlugin` or `createBackendModule`) when implementing code changes to enable a backend plugin's dynamic functionality. This proactive step ensures preparedness for the eventual transition to the new backend system.

For a practical example of a dynamic plugin entry point built upon the new backend system, please refer to the [Janus plugins repository](https://github.com/janus-idp/backstage-plugins/blob/main/plugins/aap-backend/src/dynamic/alpha.ts#L14).

#### Exporting the backend plugin as a dynamic plugin package

Once the code changes are done, the plugin can be exported as a dynamic plugin package, using the `export-dynamic` script entry:

```bash
yarn export-dynamic
```

The resulting package will be located in the `dist-dynamic` sub-folder of the plugin folder. It is renamed by adding the `-dynamic` suffix to the plugin name.

This allows packing it with `npm pack`, or publishing it to an npm registry.

The dynamic export mechanism identifies private, non-backstage dependencies, and sets the `bundleDependencies` field in the `package.json` file for them, so that the dynamic plugin package can be published as a self-contained package, along with its private dependencies bundled in a private `node_modules` folder.

Common backstage dependencies, expected to be in the backstage backend application, are not bundled in the dynamic plugin but rather changed as peer dependencies, so that they can be shared with the backstage backend application.

#### Publishing the dynamic backend plugin package to an NPM registry

The dynamic plugin package, located in the `dist-dynamic` sub-folder within the plugin directory, can be uploaded to an NPM registry using the standard `npm publish` command as it is not part of any Yarn monorepo.

As previously mentioned, this independently published package is self-contained and includes its own private dependencies in an enclosed `node_modules` folder. It is then prepared for installation as a dynamic plugin package in the showcase application, as elaborated further in the [Helm Deployment](#helm-deployment) section below.

#### About embedding dependencies in the plugin package

The `export-dynamic-plugin` command can also embed some dependencies in the dynamic plugin package, by using the `--embed-package` option. For example:

```bash
yarn export-dynamic --embed-package @roadiehq/scaffolder-backend-module-http-request
```

This merges the code of the specified dependencies in the generated dynamic plugin code, and updates the `package.json` file to hoist their dependencies to the top level.

This is useful when wrapping a third-party plugin to make it compatible with the dynamic plugin support, as explained in the next section.

#### Wrapping a third-party backend plugin to add dynamic plugin support

In order to add dynamic plugin support to a third-party backend plugin, without touching the third-party plugin source code, a wrapper plugin can be created that will:

- import the third-party plugin as a dependency.
- include the additions to the `package.json` and `src/dynamic/index.ts` file as described above.
- export it as a dynamic plugin.

Examples of such a wrapper plugins can be found in the [Janus showcase repository](https://github.com/janus-idp/backstage-showcase/tree/main/dynamic-plugins/wrappers). For example, [roadiehq-scaffolder-backend-module-utils-dynamic](https://github.com/janus-idp/backstage-showcase/tree/main/dynamic-plugins/wrappers/roadiehq-scaffolder-backend-module-utils-dynamic) wraps the `@roadiehq/scaffolder-backend-module-utils` package to make it compatible with the dynamic plugin support. It then embeds the wrapped plugin code in the generated code and hoist its `@backstage` dependencies as peer dependencies in the resulting dynamic plugin through the use of the `--embed-package` option in the [`export-dynamic` script](https://github.com/janus-idp/backstage-showcase/blob/main/dynamic-plugins/wrappers/roadiehq-scaffolder-backend-module-utils-dynamic/package.json#L26).

### Frontend plugins

#### Required code changes

The plugin must:

- add the `@janus-idp/cli` dependency,
- add the `export-dynamic` script entry,
- add the following element to the package `files` list: `"dist-scalprum"`
- optional: add `scalprum` section that declares exported module entrypoint and webpack package name

These recommended changes to the `package.json` are summarized below:

```json
  ...
  "scripts": {
    ...
    "export-dynamic": "janus-cli package export-dynamic-plugin"
    ...
  },
  ...
  "devDependencies": {
    "@janus-idp/cli": "^1.4.7"
  },
  ...
  "files": [
    ...
    "dist-scalprum"
  ]
  ...
```

Our CLI can generate the default configuration for Scalprum on the fly. For generated defaults see logs when running `yarn export-dynamic`. We default to the following configuration:

```json
  ...
  "scalprum": {
    "name": "<package_name>",  // Webpack container name is the same as NPM package name without "@" symbol and "/" replaced with "."
    "exposedModules": {
      "PluginRoot": "./src/index.ts" // PluginRoot module name is the default, therefore it doesn't have to be explicitly specified later in the app-config.yaml file
    }
  },
  ...
```

However if you want to customize Scalprum's behavior, you can do so by including additional section to the `package.json` under `scalprum` key:

```json
  ...
  "scalprum": {
    "name": "custom-package-name",
    "exposedModules": {
      "FooModuleName": "./src/foo.ts",
      "BarModuleName": "./src/bar.ts",
      ...
      // You can export multiple modules here. Each module will be exposed as a separate entrypoint in the Webpack container.
    }
  },
  ...
```

Dynamic plugins may also need to adopt to specific Backstage needs like static JSX children for mountpoints and dynamic routes. These changes are strictly optional and exported symbols are incompatible with static plugins.

To include static JSX as element children with your dynamically imported component, please define an additional export as follows and use that as your dynamic plugin `importName`:

```tsx
// Used by a static plugin
export const EntityTechdocsContent = () => {...}

// Used by a dynamic plugin
export const DynamicEntityTechdocsContent = {
  element: EntityTechdocsContent,
  staticJSXContent: (
    <TechDocsAddons>
      <ReportIssue />
    </TechDocsAddons>
  ),
};
```

#### Exporting the plugin as a dynamic plugin package

Once the code changes are done, the plugin can be exported as a dynamic plugin package, using the `export-dynamic` script entry:

```bash
yarn export-dynamic
```

The resulting assets will be located in the `dist-scalprum` sub-folder of the plugin folder.

Since the `dist-scalprum` was added to the `files` array, a resulting NPM package (`npm pack` or `npm publish`) will support both static and dynamic plugin loading of the package.

#### Wrapping a third-party frontend plugin to add dynamic plugin support

In order to add dynamic plugin support to a third-party front plugin, without touching the third-party plugin source code, a wrapper plugin can be created that will:

- install the third-party plugin as a dependency,
- reexport the third-party plugin in `src/index.ts` via `export {default} from '<package_name>'`,
- include the additions to the `package.json` described above,
- export it as a dynamic plugin.

## Installing a dynamic plugin package in the showcase

### Local configuration

- Create a `dynamic-plugins-root` folder at the root of the showcase application repository.

- To use the `dynamic` plugins packaged within this project, generate and copy them to the `dynamic-plugins-root` using the following commands:

  ```bash
  yarn tsc
  yarn build
  yarn export-dynamic
  yarn copy-dynamic-plugins ../dynamic-plugins-root
  ```

  **Note**: Review the list of the dynamic plugins copied and keep the ones you need or use all of them !

- Copy your dynamic plugin package(s) to be tested/developed to the `dynamic-plugins-root` folder using the following commands:

  ```bash
  pkg=<local dist-dynamic sub-folder or external package name of the dynamic plugin package>
  archive=$(npm pack $pkg)
  tar -xzf "$archive" && rm "$archive"
  mv package $(echo $archive | sed -e 's:\.tgz$::')
  ```

  It will create a sub-folder named after the package name, and containing the dynamic plugin package.

- In the `app-config.local.yaml` file, add the following entry at the end:

  ```yaml
  dynamicPlugins:
    rootDirectory: dynamic-plugins-root
  ```

- Append next to this file the `frontend` [configurations](..%2Fdynamic-plugins.default.yaml) as they are not loaded automatically when backstage runs locally vs on ocp (as packaged within the backstage-showcase image):

  ```yaml
  dynamicPlugins:
    rootDirectory: qshift-dynamic-plugins-root
    frontend:
      # Your plugin config !

      # Kubernetes, Topology, Tekton, etc config

      # RBAC page in the app-provided Administration page
      janus-idp.backstage-plugin-rbac:
        dynamicRoutes:
          - path: /admin/rbac
            module: RbacPlugin
            importName: RbacPage
        mountPoints:
          - mountPoint: admin.page.rbac/cards
            module: RbacPlugin
            importName: RbacPage
            config:
              layout:
                gridColumn: '1 / -1'
                width: 100vw
              props:
                useHeader: false
  ```

- Start the showcase application. During the initialization step it should have a log entry similar to the following:

  ```bash
  backstage info loaded dynamic backend plugin '@scope/some-plugin-dynamic' from 'file:///showcase-root/dynamic-plugins-root/scope-some-plugin-dynamic-0.0.1'
  ```

### Helm deployment

- Starting from version 2.10.1, the [helm chart](https://github.com/redhat-developer/rhdh-chart) for deploying the showcase application introduces new values.

Note: 2.12 is the last version released from <https://github.com/janus-idp/helm-backstage>, with 2.13 being the start of the releases from <https://github.com/redhat-developer/rhdh-chart>

- The updated Helm values introduces a new parameter named `global.dynamic`, consisting of two fields:

  - `plugins`: the dynamic plugins intended for installation. By default, the list is empty. A package can be designated either as a local relative path (beginning with `./`) to the dynamic plugin's folder for a local installation or as a package specification in an NPM repository for an external installation.
  - `includes`: a list of YAML files utilizing the same syntax. The `includes` file's `plugins` list will be merged with the `plugins` list in the main Helm values. If a plugin package is mentioned in both `plugins` lists, the fields of the plugin entry in the `plugins` list in the main Helm values will override the fields of the plugin entry in the `includes` file's `plugins` list. The default configuration includes the [`dynamic-plugins.default.yaml`](https://github.com/janus-idp/backstage-showcase/blob/main/dynamic-plugins.default.yaml) file, encompassing all the dynamic plugins [included in the showcase application container image](#dynamic-plugins-included-in-the-showcase-container-image), whether they are disabled or enabled.

- To incorporate a dynamic plugin into the showcase, add an entry to the `global.dynamic.plugins` list. Each entry should include the following fields:

  - `package`: a [package specification](https://docs.npmjs.com/cli/v10/using-npm/package-spec) indicating the dynamic plugin package to install (can be from a local path or an NPM repository).
  - `integrity`: (required for external packages) An integrity checksum in the [format of `<alg>-<digest>`](https://w3c.github.io/webappsec-subresource-integrity/#integrity-metadata-description) specific to the package. Supported algorithms include `sha256`, `sha384`, and `sha512`.

    You can easily obtain the integrity checksum using the following command:

    ```console
    npm view <package name>@<version> dist.integrity
    ```

  - `pluginConfig`: an optional plugin-specific `app-config` YAML fragment. Refer to [plugin configuration](#plugin-configuration) for more details.
  - `disabled`: if set to `true`, disables the dynamic plugin. Default: `false`.

- To include two plugins, one from a local source and another from an external source, where the latter requires a specific app-config, the configuration would be as follows:

  ```yaml
  global:
    dynamic:
      plugins:
        - package: <local package-spec used by npm pack>
        - package: <external package-spec used by npm pack>
          integrity: sha512-<some hash>
          pluginConfig: ...
  ```

- To disable a plugin from an included file, use the following snippet:

  ```yaml
  global:
    dynamic:
      includes:
        - dynamic-plugins.default.yaml
      plugins:
        - package: <some imported plugins listed in dynamic-plugins.default.yaml>
          disabled: true
  ```

- To enable a plugin that is disabled in an included file, use the following snippet:

  ```yaml
  global:
    dynamic:
      includes:
        - dynamic-plugins.default.yaml
      plugins:
        - package: <some imported plugins listed in dynamic-plugins.custom.yaml>
          disabled: false
  ```

### Dynamic plugins included in the Showcase container image

The showcase container image is pre-loaded with a variety of dynamic plugins, the majority of which are initially disabled due to mandatory configuration requirements. The comprehensive list of these plugins is outlined in the [`dynamic-plugins.default.yaml`](https://github.com/janus-idp/backstage-showcase/blob/main/dynamic-plugins.default.yaml) file.

Upon the application startup, for each plugin disabled by default, the `install-dynamic-plugins` init container within the `backstage` Pod's log will exhibit a line similar to the following:

```console
======= Skipping disabled dynamic plugin ./dynamic-plugins/dist/backstage-plugin-catalog-backend-module-github-dynamic
```

To activate this plugin, simply add a package with the same name and adjust the `disabled` field in the Helm chart values as illustrated below:

```diff
global:
  dynamic:
    includes:
      - dynamic-plugins.default.yaml
    plugins:
+      - package: ./dynamic-plugins/dist/backstage-plugin-catalog-backend-module-github-dynamic
+        disabled: false
```

While the plugin's default configuration comes from the `dynamic-plugins.default.yaml` file, you still have the option to replace it by incorporating a `pluginConfig` entry into the plugin configuration.

Note: The plugin's default configuration typically references environment variables, and it is essential to ensure that these variables are set in the Helm chart values.

### Example of external dynamic backend plugins

If you wish to easily test the installation of dynamic backend plugins from an external NPM registry, you can utilize the example dynamic backend plugins outlined in the [dynamic backend plugin showcase repository](https://github.com/janus-idp/dynamic-backend-plugins-showcase/tree/main#provided-example-dynamic-plugins), which have been published to NPMJS for demonstration purposes.

To achieve this, simply include the following dynamic plugins in the `global.dynamic.plugins` list within the Helm chart values:

```yaml
global:
  dynamic:
    plugins:
      - package: '@dfatwork-pkgs/scaffolder-backend-module-http-request-wrapped-dynamic@4.0.9-0'
        # Integrity can be found at https://registry.npmjs.org/@dfatwork-pkgs/scaffolder-backend-module-http-request-wrapped-dynamic
        integrity: 'sha512-+YYESzHdg1hsk2XN+zrtXPnsQnfbzmWIvcOM0oQLS4hf8F4iGTtOXKjWnZsR/14/khGsPrzy0oq1ytJ1/4ORkQ=='
      - package: '@dfatwork-pkgs/plugin-events-backend-module-test-dynamic@0.0.1'
        # https://registry.npmjs.org/@dfatwork-pkgs/plugin-events-backend-module-test-dynamic
        integrity: 'sha512-YaOmijWWWZqlNubQnpiaHwtZNlELzE2av2kkuzeLPg4YaupnaVTdXsR71d4uz6bfqA8QOYi9o4sJD4cJivE6jA=='
      - package: '@dfatwork-pkgs/explore-backend-wrapped-dynamic@0.0.9-next.11'
        # https://registry.npmjs.org/@dfatwork-pkgs/explore-backend-wrapped-dynamic
        integrity: 'sha512-/qUxjSedxQ0dmYqMWsZ2+OLGeovaaigRRrX1aTOz0GJMwSjOAauUUD1bMs56VPX74qWL1rf3Xr4nViiKo8rlIA=='
        pluginConfig:
          proxy:
            endpoints:
              /explore-backend-completed:
                target: 'http://localhost:7017'
      - package: '@dfatwork-pkgs/search-backend-module-explore-wrapped-dynamic@0.1.3-next.1'
        # https://registry.npmjs.org/@dfatwork-pkgs/search-backend-module-explore-wrapped-dynamic
        integrity: 'sha512-mv6LS8UOve+eumoMCVypGcd7b/L36lH2z11tGKVrt+m65VzQI4FgAJr9kNCrjUZPMyh36KVGIjYqsu9+kgzH5A=='
      - package: '@dfatwork-pkgs/plugin-catalog-backend-module-test-dynamic@0.0.0'
        # https://registry.npmjs.org/@dfatwork-pkgs/plugin-catalog-backend-module-test-dynamic
        integrity: 'sha512-YsrZMThxJk7cYJU9FtAcsTCx9lCChpytK254TfGb3iMAYQyVcZnr5AA/AU+hezFnXLsr6gj8PP7z/mCZieuuDA=='
```

By sequentially adding these plugins and allowing for a deployment restart after each change, you should be able to follow the steps outlined in the associated [Proposed Demo Path](https://github.com/janus-idp/dynamic-backend-plugins-showcase/tree/main#proposed-demo-path).

### Using a custom NPM registry

To configure the NPM registry URL and authentication information for dynamic plugin packages obtained through `npm pack`, you can utilize a `.npmrc` file. When using the Helm chart, you can add this file by creating a secret named `dynamic-plugins-npmrc` with the following content:

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

Alternatively, you can achieve the same from the Helm chart values directly by incorporating the following lines into the `upstream.extraDeploy` value:

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

This allows for seamless configuration of the NPM registry URL and authentication details for dynamic plugin packages during the deployment process.

### Air Gapped Environment

To install external plugins in an air gapped environment, set up a custom NPM registry and consult the [Using a custom NPM registry](#using-a-custom-npm-registry) section for guidance.

## Plugin configuration

As hinted above, dynamic plugins may require additional configuration to be included into `app-config.yaml`. This can be done via the `pluginConfig` key for each plugin entry in the `global.dynamic.plugins` list. This is later aggregated into an `app-config.yaml` file and passed to the Backstage instance.

```yaml
# values.yaml
global:
  dynamic:
    plugins:
      - package: <packageName>
        pluginConfig:
          # app-config.yaml fragment
```

### Frontend layout configuration

Compared to the backend plugins, where mount points are defined in code and consumed by the backend plugin manager, frontend plugins require additional configuration in the `app-config.yaml`. A plugin missing this configuration will not be loaded into the application and will not be displayed.

Similarly to traditional Backstage instances, there are 3 types of functionality a dynamic frontend plugin can offer:

- Full new page that declares a completely new route in the app
- Extension to existing page via router `bind`ings
- Use of mount points within the application
- Extend internal library of available icons
- Provide additional Utility APIs or replace existing ones

The overall configuration is as follows:

```yaml
# app-config.yaml
dynamicPlugins:
  frontend:
    <package_name>: # same as `scalprum.name` key in plugin's `package.json`
      dynamicRoutes: ...
      mountPoints: ...
      routeBindings: ...
      appIcons: ...
      apiFactories: ...
```

#### Extend internal library of available icons

Backstage offers an internal catalog of system icons available across the application. This is traditionally used within Catalog items as icons for links for example. Dynamic plugins also use this catalog when fetching icons for [dynamically configured routes with sidebar navigation menu entry](#dynamic-routes). Therefore if a plugin requires a custom icon to be used for menu item, this icon must be added to the internal icon catalog. This is done via `appIcons` configuration:

```yaml
# app-config.yaml
dynamicPlugins:
  frontend:
    <package_name>: # same as `scalprum.name` key in plugin's `package.json`
      appIcons:
        - name: fooIcon # unique icon name
          module: CustomModule # optional, same as key in `scalprum.exposedModules` key in plugin's `package.json`
          importName: FooIcon # optional, actual component name that should be rendered
```

- `name` - Unique name in the app's internal icon catalog.
- `module` - Optional. Since dynamic plugins can expose multiple distinct modules, you may need to specify which set of assets you want to access within the plugin. If not provided, the default module named `PluginRoot` is used. This is the same as the key in `scalprum.exposedModules` key in plugin's `package.json`.
- `importName` - Optional. The actual component name that should be rendered as a standalone page. If not specified the `default` export is used.

#### Dynamic routes

Traditionally, [Backstage full page extensions](https://backstage.io/docs/plugins/composability/#using-extensions-in-an-app) are done within the `packages/app/src/App.tsx` file. It may look like this:

```tsx
...
  <AppRouter>
    <Root>
      <FlatRoutes>
        {/* Standard routes usually available in each Backstage instance */}
        <Route path="/catalog" element={<CatalogIndexPage />} />
        <Route path="/settings" element={<UserSettingsPage />} />
        ...
        {/* Additional routes defined by user */}
        <Route path="/my-plugin" element={<FooPluginPage />} />
        ...
      </FlatRoutes>
    </Root>
  </AppRouter>
...
```

This change is usually coupled with an extension to the main sidebar navigation, achieved by editing `packages/app/src/components/Root/Root.tsx`.

In dynamic plugins this mechanism has changed and users are no longer allowed to edit `.tsx` files. Instead they declare their desire to expose additional routes within dynamic plugin configuration:

```yaml
# app-config.yaml
dynamicPlugins:
  frontend:
    <package_name>: # same as `scalprum.name` key in plugin's `package.json`
      dynamicRoutes: # exposes full routes
        - path: /my-plugin # unique path in the app, can override `/`
          module: CustomModule # optional, same as key in `scalprum.exposedModules` key in plugin's `package.json`
          importName: FooPluginPage # optional, actual component name that should be rendered
          menuItem: # optional, allows you to populate main sidebar navigation
            icon: fooIcon # Backstage system icon
            text: Foo Plugin Page # menu item text
          config:
            props: ... # optional, React props to pass to the component
```

Each plugin can expose multiple routes and each route is required to define its `path` and `importName` (if it differs from the default export).

- `path` - Unique path in the app. Cannot override existing routes with the exception of the `/` home route: the main home page can be replaced via the dynamic plugins mechanism.
- `module` - Optional. Since dynamic plugins can expose multiple distinct modules, you may need to specify which set of assets you want to access within the plugin. If not provided, the default module named `PluginRoot` is used. This is the same as the key in `scalprum.exposedModules` key in plugin's `package.json`.
- `importName` - Optional. The actual component name that should be rendered as a standalone page. If not specified the `default` export is used.
- `menuItem` - This property allows users to extend the main sidebar navigation and point to their new route. It accepts `text` and `icon` properties. `icon` refers to a Backstage system icon name. See [Backstage system icons](https://backstage.io/docs/getting-started/app-custom-theme/#icons) for the list of default icons and [Extending Icons Library](#extend-internal-library-of-available-icons) to extend this with dynamic plugins.
- `config.props` - Optional. Additionally you can pass React props to the component.

#### Bind to existing plugins

Another extension option available to Backstage is to [bind to the external routes](https://backstage.io/docs/plugins/composability/#binding-external-routes-in-the-app) of existing plugins. This is traditionally done via the `bindRoutes` interface as:

```tsx
createApp({
  bindRoutes({ bind }) {
    bind(barPlugin.externalRoutes, {
      headerLink: fooPlugin.routes.root,
    });
  },
});
```

Dynamic plugins offer similar functionality via `routeBindings` configuration:

```yaml
# app-config.yaml
dynamicPlugins:
  frontend:
    <package_name>: # same as `scalprum.name` key in plugin's `package.json`
      routeBindings:
        targets: # Declare a new bind target
          - name: barPlugin # Optional, defaults to importName. Explicit name of the plugin that exposes the bind target
            importName: barPlugin # Required. Explicit import name that reference a BackstagePlugin<{}> implementation.
            module: CustomModule # Optional, same as key in `scalprum.exposedModules` key in plugin's `package.json`
        bindings:
          - bindTarget: 'barPlugin.externalRoutes' # Required. One of the supported or imported bind targets
            bindMap: # Required. Map of bindings, same as the `bind` function options argument in the example above
              headerLink: 'fooPlugin.routes.root'
```

This configuration allows you to bind to existing plugins and their routes as well as declare new targets sourced from dynamic plugins:

1. Define new targets:
   `routeBindings.targets` allow you to define new targets. It accepts a list of targets where:
   - `importName` is required and has to resolve to a `BackstagePlugin<{}>` implementation
   - `name` is an optional argument which sets the name of the target. If not provided, `importName` is used instead.
   - `module` is an optional argument which allows you to specify which set of assets you want to access within the plugin. If not provided, the default module named `PluginRoot` is used. This is the same as the key in `scalprum.exposedModules` key in plugin's `package.json`.
2. Declare bindings:
   - `bindTarget` - Required. One of the supported or imported bind targets. This value can refer to any of the new dynamically added targets or available static targets:
     - `catalogPlugin.externalRoutes`
     - `catalogImportPlugin.externalRoutes`
     - `techdocsPlugin.externalRoutes`
     - `scaffolderPlugin.externalRoutes`

- `bindMap`: Required. Map of bindings, same as the `bind` function options argument in the traditional Backstage example above

#### Using mount points

This section aims to allow users dynamic extension of [Catalog Components](https://backstage.io/docs/plugins/composability/#catalog-components), but can be used to extend additional views in the future as well.

Mount points are defined identifiers available across the applications. These points specifically allow users to extend existing pages with additional content.

The following mount points are available:

| Mount point                  | Description                                                                                                      | Visible even when no plugins are enabled                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `entity.page.overview`       | Catalog entity overview page                                                                                     | YES for all entities                                           |
| `entity.page.topology`       | Catalog entity "Topology" tab                                                                                    | NO                                                             |
| `entity.page.quarkus`        | Catalog entity "[Quarkus](https://github.com/q-shift/backstage-plugins/?tab=readme-ov-file#quarkus-console)" tab | NO                                                             |
| `entity.page.issues`         | Catalog entity "Issues" tab                                                                                      | NO                                                             |
| `entity.page.pull-requests`  | Catalog entity "Pull Requests" tab                                                                               | NO                                                             |
| `entity.page.ci`             | Catalog entity "CI" tab                                                                                          | NO                                                             |
| `entity.page.cd`             | Catalog entity "CD" tab                                                                                          | NO                                                             |
| `entity.page.kubernetes`     | Catalog entity "Kubernetes" tab                                                                                  | NO                                                             |
| `entity.page.image-registry` | Catalog entity "Image Registry" tab                                                                              | NO                                                             |
| `entity.page.monitoring`     | Catalog entity "Monitoring" tab                                                                                  | NO                                                             |
| `entity.page.lighthouse`     | Catalog entity "Lighthouse" tab                                                                                  | NO                                                             |
| `entity.page.api`            | Catalog entity "API" tab                                                                                         | YES for entity of `kind: Component` and `spec.type: 'service'` |
| `entity.page.dependencies`   | Catalog entity "Dependencies" tab                                                                                | YES for entity of `kind: Component`                            |
| `entity.page.docs`           | Catalog entity "Documentation" tab                                                                               | YES for entity that satisfies `isTechDocsAvailable`            |
| `entity.page.definition`     | Catalog entity "Definitions" tab                                                                                 | YES for entity of `kind: Api`                                  |
| `entity.page.diagram`        | Catalog entity "Diagram" tab                                                                                     | YES for entity of `kind: System`                               |
| `search.page.types`          | Search result type                                                                                               | YES, default catalog search type is available                  |
| `search.page.filters`        | Search filters                                                                                                   | YES, default catalog kind and lifecycle filters are visible    |
| `search.page.results`        | Search results content                                                                                           | YES, default catalog search is present                         |

Note: Mount points within Catalog aka `entity.page.*` are rendered as tabs. They become visible only if at least one plugin contributes to them or they can render static content (see column 3 in previous table).

Each `entity.page.*` mount point has 2 complementary variations:

- `*/context` type that serves to create React contexts
- `*/cards` type for regular React components

```yaml
# app-config.yaml
dynamicPlugins:
  frontend:
    <package_name>: # same as `scalprum.name` key in plugin's `package.json`
      mountPoints: # optional, uses existing mount points
        - mountPoint: <mountPointName>/[cards|context]
          module: CustomModule # optional, same as key in `scalprum.exposedModules` key in plugin's `package.json`
          importName: FooPluginPage # actual component name that should be rendered
          config: # optional, allows you to pass additional configuration to the component
            layout: {} # accepts MUI sx properties
            if: # Set of conditions that must be met for the component to be rendered
              allOf|anyOf|oneOf:
                - isMyPluginAvailable # an imported function from the same `module` within the plugin returns boolean
                - isKind: component # Check if the entity is of a specific kind
                - isType: service # Check if the entity is of a specific type
                - hasAnnotation: annotationKey # Check if the entity has a specific annotation key
            props: {} # React props to pass to the component
```

Each mount point supports additional configuration:

- `layout` - Used only in `*/cards` type which renders visible content. Allows you to pass MUI sx properties to the component. This is useful when you want to control the layout of the component. `entity.page.*` mount points are rendered as CSS grid, so SX property allows you to control the grid layout and exact positioning of the rendered component.
- `props` - React props passed to the component. This is useful when you want to pass some additional data to the component.
- `if` - Used only in `*/cards` type which renders visible content. This is passed to `<EntitySwitch.Case if={<here>}`.

  The following conditions are available:

  - `allOf`: All conditions must be met
  - `anyOf`: At least one condition must be met
  - `oneOf`: Only one condition must be met

  Conditions can be:

  - `isKind`: Accepts a string or a list of string with entity kinds. For example `isKind: component` will render the component only for entity of `kind: Component`.
  - `isType`: Accepts a string or a list of string with entity types. For example `isType: service` will render the component only for entities of `spec.type: 'service'`.
  - `hasAnnotation`: Accepts a string or a list of string with annotation keys. For example `hasAnnotation: my-annotation` will render the component only for entities that have `metadata.annotations['my-annotation']` defined.
  - condition imported from the plugin's `module`: Must be function name exported from the same `module` within the plugin. For example `isMyPluginAvailable` will render the component only if `isMyPluginAvailable` function returns `true`. The function must have following signature: `(e: Entity) => boolean`

#### Provide additional Utility APIs

Backstage offers an Utility API mechanism that provide ways for plugins to communicate during their entire life cycle. Utility APIs are registered as:

- Core APIs, which are always present in any Backstage application
- Custom plugin-made API that can be already self contained within any plugin (including dynamic plugins)
- [App API implementations and overrides](https://backstage.io/docs/api/utility-apis/#app-apis) which needs to be added separately.

Dynamic plugins provides you with a way to utilize the App API concept via `apiFactories` configuration:

```yaml
# app-config.yaml
dynamicPlugins:
  frontend:
    <package_name>: # same as `scalprum.name` key in plugin's `package.json`
      apiFactories:
        - importName: BarApi # Optional, explicit import name that reference a AnyApiFactory<{}> implementation. Defaults to default export.
          module: CustomModule # Optional, same as key in `scalprum.exposedModules` key in plugin's `package.json`
```

Each plugin can expose multiple API Factories and each factory is required to define its `importName` (if it differs from the default export).

- `importName` is an optional import name that reference a `AnyApiFactory<{}>` implementation. Defaults to `default` export.
- `module` is an optional argument which allows you to specify which set of assets you want to access within the plugin. If not provided, the default module named `PluginRoot` is used. This is the same as the key in `scalprum.exposedModules` key in plugin's `package.json`.
