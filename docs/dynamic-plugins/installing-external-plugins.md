# Installing External Plugins

RHDH supports dynamic plugins, which are plugins not included in the core RHDH distribution. These plugins can be installed or uninstalled without rebuilding the RHDH application; only a restart is required to apply the changes.

If your plugin not already packaged as a dynamic plugin, you must package it into one of the supported formats before installation.

## Packaging a Backstage Plugin as a Dynamic Plugin

To package a Backstage plugin as a dynamic plugin, you need access to its source code.

First you need to create a derived package using the `@janus-idp/cli` and then package it into one of the supported formats.

There are three possible packaging formats for dynamic plugins:

- OCI image
- `tgz` archive
- JavaScript package

**The OCI image is the recommended format.**

The derived dynamic plugin JavaScript packages should **not** be pushed to the public npm registry. They should only be published to a private npm registry.

### Step 1. Creating a Derived Dynamic Plugin Package

In the root directory of the plugin source code, run the following command:

```bash
npx @janus-idp/cli@latest package export-dynamic-plugin
```

This will create a `dist-dynamic` directory, which contains the derived dynamic plugin package. This directory can then be packaged into one of the supported formats.

### Step 2. Packaging a Plugin

#### Creating OCI Image

**Prerequisites:**

- `podman` or `docker` installed on your system.
- An exported derived dynamic plugin package (see: [Creating a Derived Dynamic Plugin Package](#step-1-creating-a-derived-dynamic-plugin-package).

To package the plugin into an OCI image, use the `package package-dynamic-plugins` command from `@janus-idp/cli` in the plugin’s source code root directory (not in the `dist-dynamic` directory).

The command will output the correct path definition for the plugin, which can be used in the `dynamic-plugin-config.yaml` file.

```bash
npx @janus-idp/cli@latest package package-dynamic-plugins --tag quay.io/example/image:v0.0.1
```

The `--tag` argument is required when using this packaging method. It specifies the image name and tag. The image won't be pushed to the registry automatically; use the `podman push` or `docker push` command to push the image to the registry.

#### Creagin a `tgz` Archive

**Prerequisites:**

- An exported derived dynamic plugin package (see: [Creating a Derived Dynamic Plugin Package](#step-1-creating-a-derived-dynamic-plugin-package)).

To package the plugin into a `tgz` archive, run the `npm pack` command in the `dist-dynamic` directory. This will create a `tgz` archive in the current directory that can be used to install the plugin.

```bash
cd dist-dynamic
npm pack
```

To load the plugin from a `tgz` archive, specify the integrity hash of the archive. You can obtain the hash from the output of the `npm pack` command by using the `--json` flag.

```bash
cd dist-dynamic
npm pack --json | head -n 10
# If you have jq installed, use this command to get the integrity hash directly:
# npm pack --json | jq -r '.[0].integrity'
```

To load the plugin from a `tgz` archive, host the archive on a web server accessible by your RHDH instance and specify the URL in the `dynamic-plugin-config.yaml` file.

If using OpenShift, you can leverage httpd builder to serve these dynamic plugin packages:

```bash
# Pack derived dynamic plugins into `tgz` archives.
# Repeat this step for multiple plugins (place them in the same folder).
npm pack --pack-destination ~/test/dynamic-plugins-root/
# Ensure you're using the same OpenShift project as the RHDH instance.
oc project rhdh
# Create a new build for the httpd image that will serve the `tgz` files with dynamic plugins.
oc new-build httpd --name=plugin-registry --binary
oc start-build plugin-registry --from-dir=dynamic-plugins-root --wait
oc new-app --image-stream=plugin-registry

## Configure your RHDH to use the dynamic plugins from the plugin-registry.
# Edit the `dynamic-plugin-config.yaml` file:
# plugins:
#   - package: http://plugin-registry:8080/backstage-plugin-myplugin-1.9.6.tgz
#   - package: http://plugin-registry:8080/backstage-plugin-myotherplugin-1.10.0.tgz
#
# If you add a new dynamic plugin archive in the ~/test/dynamic-plugins-root folder, and run the OpenShift build again:
# oc start-build plugin-registry --from-dir=dynamic-plugins-root --wait
```

#### Creatign JavaScript package

**Prerequisites:**

- An exported derived dynamic plugin package (see: [Creating a Derived Dynamic Plugin Package](#step-1-creating-a-derived-dynamic-plugin-package)).

To distribute the derived dynamic plugin package as a JavaScript package, publish it to a private or internal npm registry. Avoid using the public npm registry (npmjs.com), as the derived dynamic plugin package is structured like regular JavaScript packages but cannot be used the same way.

```bash
cd dist-dynamic
npm publish --registry <npm_registry_url>
```

Alternatively, add the following to your `package.json` before running `npx @janus-idp/cli@latest package export-dynamic-plugin`:

```json
{
  "publishConfig": {
    "registry": "<npm_registry_url>"
  }
}
```

If you modify the `publishConfig` after running `export-dynamic-plugin`, run it again to ensure the `dist-dynamic` directory contains a `package.json` with the correct `publishConfig`.

## Installing External Dynamic Plugins

Dynamic plugins can be packaged in three formats:

- OCI image
- `tgz` archive
- npm package

You can also load the dynamic plugin from a plain directory, though this is not recommended for production use. It can be helpful for development and testing.

To install a dynamic plugin, you need to add the plugin to the `dynamic-plugin-config.yaml` file.

The placement of `dynamic-plugin-config.yaml` depends on the deployment method. For more information, see [Installing Dynamic Plugins with the Red Hat Developer Hub Operator](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.3/html/installing_and_viewing_dynamic_plugins/proc-config-dynamic-plugins-rhdh-operator_title-plugins-rhdh-about) or [Installing Dynamic Plugins Using the Helm Chart](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.3/html/installing_and_viewing_dynamic_plugins/con-install-dynamic-plugin-helm_title-plugins-rhdh-about).

Plugins are defined in the `plugins` array in the `dynamic-plugin-config.yaml` file. Each plugin is defined as an object with the following properties:

- `package`: The package definition of the plugin. This can be an OCI image, `tgz` archive, npm package, or a directory path.
- `disabled`: A boolean value that determines whether the plugin is enabled or disabled.
- `integrity`: The integrity hash of the package. This is required for `tgz` archives and npm packages.
- `pluginConfig`: The configuration for the plugin. This is optional and can be used to pass configuration to the plugin. Anything that is added to this object will be merged with the main app-config.

### Loading a Plugin from an OCI Image

When defining the plugin packaged as an OCI image, use the `oci://` prefix, followed by the image name, tag, and plugin name separated by the `!` character (`oci://<image-name>:<tag>!<plugin-name>`).

```yaml
plugins:
  - disabled: false
    package: oci://quay.io/example/image:v0.0.1!backstage-plugin-myplugin
```

### Using a `tgz` Archive

When defining the plugin packaged as a `tgz` archive, use the URL of the archive and the integrity hash of the archive.

```yaml
plugins:
  - disabled: false
    package: https://example.com/backstage-plugin-myplugin-1.0.0.tgz
    integrity: sha512-9WlbgEdadJNeQxdn1973r5E4kNFvnT9GjLD627GWgrhCaxjCmxqdNW08cj+Bf47mwAtZMt1Ttyo+ZhDRDj9PoA==
```

### Using an JavaScript package reference

When defining the plugin packaged as an npm package, use the package name and version, and the integrity hash of the package.

```yaml
plugins:
  - disabled: false
    package: @example/backstage-plugin-myplugin@1.0.0
    integrity: sha512-9WlbgEdadJNeQxdn1973r5E4kNFvnT9GjLD627GWgrhCaxjCmxqdNW08cj+Bf47mwAtZMt1Ttyo+ZhDRDj9PoA==
```

To get the integrity hash of a JavaScript package from the npm registry, use:

```bash
npm view --registry https://example.com:4873/ @backstage-community/plugin-todo-dynamic@0.2.40 dist.integrity
```

See [Using a custom NPM registry](../dynamic-plugins#using-a-custom-npm-registry) on how to use your own private npm registry.
