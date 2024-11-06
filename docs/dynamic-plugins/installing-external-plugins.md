# Installing external plugins

RHDH supports dynamic plugins, which are plugins that are not part of the core RHDH distribution. These plugins can be installed and uninstalled without the need to rebuild the RHDH application. Only restart is required to apply the changes.

To install external plugin in RHDH, you will first need to package the plugin into one of the supported formats before you can install it.

## Packaging a Backstage plugin as a dynamic plugin

To package a Backstage plugin as a dynamic plugin, you will need access to the source code of the plugin.

As a first step you need to create a derived package. This can be one using `@janus-idp/cli`.

### 1. Creating a derived dynamic plugin package

In the root of the plugin directory run the following command:

```bash
npx @janus-idp/cli@latest package export-dynamic-plugin
```

This will create `dist-dynamic` directory, which contains the derived dynamic plugin package. This directory can be then packaged into one of the supported formats.

There are three possible packaging formats for dynamic plugins:

- OCI image
- tgz archive
- JavaScript package

**The OCI image is the recommended format.**

The derived dynamic plugin JavaScript packages should not be pushed to the public npm registry. They should be only published to the private npm registry.

### 2.a Packaging plugin into OCI image

Prerequisites:

- `podman` or `docker` installed on your system
- exported derived dynamic plugin package (see: [Creating a derived dynamic plugin package](#Packaging a Backstage plugin as a dynamic plugin))

To package the plugin into OCI image, you can use the  `package package-dynamic-plugins` from `@janus-idp/cli` command and run it in the root of the plugin directory (not in `dist-dynamic` directory).

The command will output the correct path definition for the plugin that can be used in the `dynamic-plugin-config.yaml` file.

```bash
npx @janus-idp/cli@latest package package-dynamic-plugins --tag quay.io/example/image:v0.0.1
```

`--tag` argument is required and it specifies the image name and tag. The image won't be pushed to the registry. You need to use the `podman push` or `docker push` command to push the image to the registry.

### 2.b Packaging plugin into tgz archive

Prerequisites:

- exported derived dynamic plugin package (see: [Creating a derived dynamic plugin package](#Packaging a Backstage plugin as a dynamic plugin))

To package the plugin into tgz archive, you can use `npm pack` command in the `dist-dynamic` directory. This will create a tgz archive in the current directory that can be used to install the plugin.

```bash
cd dist-dynamic
npm pack
```

For loading the plugin from tgz archive, you will need to specify integrity hash of the archive you can get the hash from the output of the `npm pack` command by when using `--json` flag.

```bash
cd dist-dynamic
npm pack --json | head -n 10
# if you have jq installed you can use this command to get the integrity hash directly
# npm pack --json | jq -r '.[0].integrity'
```

To be able to load the plugin from tgz archive, you need to host the archive on the web server that is accessible by your RHDH instance and specify the URL in the `dynamic-plugin-config.yaml` file.

When you are using OpenShift you can can use `oc new-app` to create a service that will serve those dynamic plugin packages.

```bash
# pack derived dynamic plugins into tgz archive
# you can repeat this step for multiple plugins (place them in the same folder)
npm pack --pack-destination ~/test/dynamic-plugins-root/
# makes sure that you are using the same OpenShift project as the RHDH
oc project rhdh
# create a new build for the httpd image that will serve the tgz files with dynamic plugins
oc new-build httpd --name=plugin-registry --binary
oc start-build plugin-registry --from-dir=dynamic-plugins-root --wait
oc new-app --image-stream=plugin-registry

## configure your RHDH to use the dynamic plugins from the plugin-registry
# edit the dynamic-plugin-config.yaml file
#  plugins:
#    - package: http://plugin-registry:8080/backstage-plugin-myplugin-1.9.6.tgz
#    - package: http://plugin-registry:8080/backstage-plugin-myotherplugin-1.10.0.tgz
#
# If you add a new dynamic plugin archive in the ~/test/dynamic-plugins-root folder, and run the Openshift build again:
# oc start-build plugin-registry --from-dir=dynamic-plugins-root --wait
```

### 2.c Packaging plugin into npm package

Prerequisites:

- exported derived dynamic plugin package (see: [Creating a derived dynamic plugin package](#Packaging a Backstage plugin as a dynamic plugin))

To distribute the derived dynamic plugin package as an JavaScript package, you can simply publish it to the npm registry.
Don't use public npm registry for this purpose. Derived dynamic plugin package has structure like regular JavaScript packages, but they can't be used the same way. Use private or internal npm registry to host the derived dynamic plugin packages.

```bash
cd dist-dynamic
npm publish --registry <npm_registry_url>
```

Alernatively, you can add the following to your `package.json`.
You have to do this before running `npx @janus-idp/cli@latest package export-dynamic-plugin`, or run `export-dynamic-plugin` again after adding the `publishConfig` to the `package.json`. Otherwise the `dist-dynamic` directory will not contain the `package.json` file with the correct `publishConfig`.

```json
{
  "publishConfig": {
    "registry": "<npm_registry_url>"
  }
}
```

## Installing external dynamic plugins

There are three possible packaging formats for dynamic plugins:

- OCI image
- tar.gz archive
- npm package

You can also load the dynamic plugin from a plain directory. This is not recommended for production use. But it can be useful for development and testing purposes.

### Loading plugin from OCI image

In your `dynamic-plugin-config.yaml` file, you can specify the plugin that is packaged inside the OCI image.

The placement of `dynamic-plugin-config.yaml` depend on the deployment method.
For more information, see [Installing dynamic plugins with the Red Hat Developer Hub Operator](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.3/html/installing_and_viewing_dynamic_plugins/proc-config-dynamic-plugins-rhdh-operator_title-plugins-rhdh-about)
 or [Installing dynamic plugins using the Helm chart](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.3/html/installing_and_viewing_dynamic_plugins/con-install-dynamic-plugin-helm_title-plugins-rhdh-about).

When defining the plugin that is packaged into OCI image, you need to specify the `oci://` prefix followed by the image name and tag and than plugin name separated by `!` character. (`oci://<image-name>:<tag>!<plugin-name>`)

When building OCI image using `package package-dynamic-plugins` from `@janus-idp/cli` the output will display the correct path definition for the plugin.
See [Packaging plugin into OCI image](#2.a Packaging plugin into OCI image) for more information.

Example of how to define plugin that is packaged into OCI image:

```yaml
plugins:
  - disabled: false
    package: oci://quay.io/example/image:v0.0.1!backstage-plugin-myplugin
```

### Loading plugin from tgz archive

In your `dynamic-plugin-config.yaml` file, you can specify tgz file that is hosted on the web server.
The placement of `dynamic-plugin-config.yaml` depend on the deployment method.
For more information, see [Installing dynamic plugins with the Red Hat Developer Hub Operator](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.3/html/installing_and_viewing_dynamic_plugins/proc-config-dynamic-plugins-rhdh-operator_title-plugins-rhdh-about)
 or [Installing dynamic plugins using the Helm chart](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.3/html/installing_and_viewing_dynamic_plugins/con-install-dynamic-plugin-helm_title-plugins-rhdh-about).

When defining the plugin that is packaged into tgz archive, you need to specify the URL of the tgz archive.

```yaml
plugins:
  - disabled: false
    package: https://example.com/backstege-plugin-myplugin-1.0.0.tgz
    integrity: sha512-9WlbgEdadJNeQxdn1973r5E4kNFvnT9GjLD627GWgrhCaxjCmxqdNW08cj+Bf47mwAtZMt1Ttyo+ZhDRDj9PoA==
```

See [Packaging plugin into tgz archive](#2.b Packaging plugin into tgz archive) for information how to create tgz archive from the derived dynamic plugin package, including information on how to get the integrity hash.

### Loading plugin from npm package

In your `dynamic-plugin-config.yaml` file, you can specify JavaScript package published to the npm registry.
The placement of `dynamic-plugin-config.yaml` depend on the deployment method.
For more information, see [Installing dynamic plugins with the Red Hat Developer Hub Operator](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.3/html/installing_and_viewing_dynamic_plugins/proc-config-dynamic-plugins-rhdh-operator_title-plugins-rhdh-about)
 or [Installing dynamic plugins using the Helm chart](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.3/html/installing_and_viewing_dynamic_plugins/con-install-dynamic-plugin-helm_title-plugins-rhdh-about).

When defining the plugin that is published to the npm registry, you need to specify the package name, version and integrity checksum.
  
```yaml
plugins:
  - disabled: false
    package: @example/backstage-plugin-myplugin@1.0.0
    integrity: sha512-9WlbgEdadJNeQxdn1973r5E4kNFvnT9GjLD627GWgrhCaxjCmxqdNW08cj+Bf47mwAtZMt1Ttyo+ZhDRDj9PoA==
```

See [Packaging plugin into npm package](#2.c Packaging plugin into npm package) for information how to publish the derived dynamic plugin package to the npm registry.

To get the integrity hash of the JavaScript package from npm registry, you can use the following command:

```bash
npm view --registry https://example.com:4873/ @backstage-community/plugin-todo-dynamic@0.2.40 dist.integrity
```
