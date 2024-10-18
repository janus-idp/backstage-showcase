# Version Compatibility Matrix

## RHDH 1.4 (pre-release, versions can change for final release)

<!-- source
https://github.com/janus-idp/backstage-showcase/blob/main/backstage.json
-->

Based on Backstage 1.29.2
To bootstrap Backstage app that is compatible with RHDH 1.4, you can should use:

```bash
npx @backstage/create-app@0.5.17
```

### Frontend packages

@backstage/catalog-model: 1.5.0
@backstage/config: 1.2.0
@backstage/core-app-api: 1.14.1
@backstage/core-components: 0.14.9
@backstage/core-plugin-api: 1.9.3
@backstage/integration-react: 1.1.29

If you want to check versions of other packages, you can check the [`package.json`](https://github.com/janus-idp/backstage-showcase/blob/main/packages/app/package.json) in the [`app`](https://github.com/janus-idp/backstage-showcase/tree/main/packages/app) package in the `main` branch of the [RHDH repository](https://github.com/janus-idp/backstage-showcase/tree/main).

### Backend packages

"@backstage/backend-app-api": "0.8.0",
"@backstage/backend-common": "0.23.3",
"@backstage/backend-defaults": "0.4.1",
"@backstage/backend-dynamic-feature-service": "0.2.15",
"@backstage/backend-plugin-api": "0.7.0",
"@backstage/catalog-model": "1.5.0",
"@backstage/cli-node": "0.2.7",
"@backstage/config": "1.2.0",
"@backstage/config-loader": "1.8.1",

If you want to check versions of other packages, you can check the [`package.json`](https://github.com/janus-idp/backstage-showcase/blob/main/packages/backend/package.json) in the [`backend`](https://github.com/janus-idp/backstage-showcase/tree/main/packages/backend) package in the `main` branch of the [RHDH repository](https://github.com/janus-idp/backstage-showcase/tree/main).

## RHDH 1.3

Based on Backstage 1.29.2
@backstage/create-app: 0.5.17

## RHDH 1.2

Based on Backstage 1.26.5
@backstage/create-app 0.5.14
