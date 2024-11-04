# Frequently Asked Questions

## What is Dynamic plugin derived package?

This is a special JavaScript package that is derived from an original plugin package source code.
It has `-dynamic` suffix in its name. Its purpose is to be dynamically loaded by the RHDH.
This plugin shouldn't be pushed into the [public npm registry](https://www.npmjs.com), but it can be published to a private or internal npm registry.

## How to configure up a dynamic plugin project to publish to an npm registry?

**WARNING:** Do not push derivated dynamic plugin packages to the public npm registry. Push it to a private or internal npm registry only. If possible use OCI images or tgz files to distribute the derived packages instead of npm registry. <!-- TODO: link to documentation about packaging plugins as OCI images or tgzs  -->

1. Generate plugin derived package by running the following command:

  **NOTE:** If you are not using the latest RHDH version, see [versions](../versions) document to see which version of the `@janus-idp/cli` you should use.

  ```sh
  npx @janus-idp/cli@latest package export-dynamic-plugin
  ```

1. Publish the generated package to an npm registry:

  ```sh
  cd dist-dynamic
  npm publish --registry <npm_registry_url>
  ```

Alernatively, you can add the following to your `package.json` before running `npx @janus-idp/cli@latest package export-dynamic-plugin`:

```json
{
  "publishConfig": {
    "registry": "<npm_registry_url>"
  }
}
```

and than just run `npm publish` inside the `dist-dynamic` directory.

```sh
cd dist-dynamic
npm publish
```

## How to configure RHDH to use private or internal npm registry?

See [Using a custom NPM registry](../dynamic-plugins#using-a-custom-npm-registry)

## How to install community Backstage plugin to the RHDH?

TODO

## How make a scaffolder field extension?

<!-- TODO: fix link once https://github.com/janus-idp/backstage-showcase/pull/1789 is merged -->

This is documented at [Provide custom Scaffolder field extensions](../dynamic-plugins#provide-custom-scaffolder-field-extensions)

## How to make a custom action?

TODO

## How to load a username transformer when ingesting catalog entities?

TODO

## How to properly migrate a plugin project and your local environment to Yarn 3.x?

TODO
