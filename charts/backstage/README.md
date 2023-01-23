# backstage

![Version: 0.1.6](https://img.shields.io/badge/Version-0.1.6-informational?style=flat-square) ![AppVersion: v1.7.0](https://img.shields.io/badge/AppVersion-v1.7.0-informational?style=flat-square)

A helm chart for deploying Backstage

**Homepage:** <https://github.com/janus-idp/helm-backstage>

## Installation

This chart can be installed to an individual namespace by first adding the chart repository, creating a new namespace (or using an existing namespace) and installing the chart by executing the following commands:

```shell
helm repo add janus-idp-backstage https://janus-idp.github.io/helm-backstage
helm create namespace backstage
helm upgrade -i backstage -n backstage janus-idp-backstage/backstage --set backstage.baseUrl=<BASE_URL>
```

The preceding command will create a new namespace called `backstage` and install the chart with a release name of `backstage`. At a minimum, the required parameter `backstage.baseUrl` refers to the URL that should be used to access the Backstage user interface.

## Uninstallation

To remove a previously installed chart, execute the following command:

```shell
helm uninstall <RELEASE>
```

Replace `<RELEASE>` with the name of the Helm release that was used when installing the chart.

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| additionalConfig | object | `{}` |  |
| backstage.baseUrl | string | `""` |  |
| backstage.catalog.locations[0].target | string | `"https://github.com/backstage/backstage/blob/master/packages/catalog-model/examples/all-components.yaml"` |  |
| backstage.catalog.locations[0].type | string | `"url"` |  |
| backstage.catalog.rules[0].allow[0] | string | `"Component"` |  |
| backstage.catalog.rules[0].allow[1] | string | `"System"` |  |
| backstage.catalog.rules[0].allow[2] | string | `"API"` |  |
| backstage.catalog.rules[0].allow[3] | string | `"Resource"` |  |
| backstage.catalog.rules[0].allow[4] | string | `"Location"` |  |
| backstage.companyname | string | `"Red Hat Backstage Helm Chart"` |  |
| fullnameOverride | string | `""` |  |
| image.pullPolicy | string | `"Always"` |  |
| image.registry | string | `"ghcr.io"` |  |
| image.repository | string | `"janus-idp/redhat-backstage-build"` |  |
| image.version | string | `"latest"` |  |
| imagePullSecrets | list | `[]` |  |
| ingress.className | string | `""` |  |
| ingress.enabled | bool | `false` |  |
| ingress.tls.secretName | string | `""` |  |
| name | string | `"backstage"` |  |
| nameOverride | string | `""` |  |
| postgres.database_host | string | `""` |  |
| postgres.database_name | string | `"postgres"` |  |
| postgres.database_password | string | `""` |  |
| postgres.database_port | int | `5432` |  |
| postgres.database_user | string | `"postgres"` |  |
| postgres.existingSecret | string | `""` |  |
| postgres.external | bool | `false` |  |
| postgres.image.pullPolicy | string | `"Always"` |  |
| postgres.image.registry | string | `"quay.io"` |  |
| postgres.image.repository | string | `"fedora/postgresql-13"` |  |
| postgres.image.version | string | `"13"` |  |
| postgres.resources.limits.cpu | string | `"400m"` |  |
| postgres.resources.limits.memory | string | `"596Mi"` |  |
| postgres.resources.requests.cpu | string | `"100m"` |  |
| postgres.resources.requests.memory | string | `"128Mi"` |  |
| postgres.secretKeys.adminPasswordKey | string | `""` |  |
| postgres.serviceAccount.annotations | object | `{}` |  |
| postgres.serviceAccount.create | bool | `true` |  |
| postgres.serviceAccount.name | string | `""` |  |
| postgres.storage.enabled | bool | `true` |  |
| postgres.storage.size | string | `"2Gi"` |  |
| replicaCount | int | `1` |  |
| resources | object | `{}` |  |
| route.annotations | object | `{}` |  |
| route.enabled | bool | `true` |  |
| route.termination | string | `"edge"` |  |
| securityContext | object | `{}` |  |
| service.port | int | `8080` |  |
| service.targetPort | int | `7007` |  |
| service.type | string | `"ClusterIP"` |  |
| serviceAccount.annotations | object | `{}` |  |
| serviceAccount.create | bool | `true` |  |
| serviceAccount.name | string | `""` |  |
