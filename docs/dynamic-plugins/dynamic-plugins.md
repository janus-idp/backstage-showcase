# Dynamic Plugins support

The dynamic plugin support is based on the [backend plugin manager package](https://github.com/backstage/backstage/tree/master/packages/backend-dynamic-feature-service), which is a service that scans a configured root directory (`dynamicPlugins.rootDirectory` in the app config) for dynamic plugin packages, and loads them dynamically.

While this package remains in an experimental phase and is a private package in the upstream backstage repository, it is primarily awaiting seamless integration with the new backend system before its APIs can be finalized and frozen. It is worth noting that it is already in use in the backstage showcase application, facilitated by a derivative package published in the `@janus-idp` NPM organization.
