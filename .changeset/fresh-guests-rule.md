---
'backstage-plugin-catalog-backend-module-github-org': patch
'backstage-plugin-scaffolder-backend-module-gitlab': patch
'immobiliarelabs-backstage-plugin-gitlab-backend': patch
'backstage-plugin-catalog-backend-module-github': patch
'backstage-plugin-catalog-backend-module-gitlab': patch
'roadiehq-backstage-plugin-argo-cd-backend': patch
'roadiehq-scaffolder-backend-module-utils': patch
'roadiehq-backstage-plugin-github-pull-requests': patch
'backstage-plugin-azure-devops-backend': patch
'backstage-plugin-kubernetes-backend': patch
'roadiehq-backstage-plugin-security-insights': patch
'backstage-plugin-sonarqube-backend': patch
'roadiehq-scaffolder-backend-argocd': patch
'backstage-plugin-techdocs-backend': patch
'roadiehq-backstage-plugin-github-insights': patch
'backstage-plugin-jenkins-backend': patch
'immobiliarelabs-backstage-plugin-gitlab': patch
'roadiehq-backstage-plugin-argo-cd': patch
'roadiehq-backstage-plugin-datadog': patch
'backstage-plugin-github-actions': patch
'backstage-plugin-github-issues': patch
'roadiehq-backstage-plugin-jira': patch
'backstage-plugin-azure-devops': patch
'backstage-plugin-kubernetes': patch
'backstage-plugin-lighthouse': patch
'backstage-plugin-tech-radar': patch
'backstage-plugin-dynatrace': patch
'backstage-plugin-pagerduty': patch
'backstage-plugin-sonarqube': patch
'backstage-plugin-techdocs': patch
'backstage-plugin-jenkins': patch
'dynamic-plugins-imports': patch
'app': patch
---

- Upgrade the Janus CLI to include the change in default module interop mode (to use the same as the backstage CLI rollup build), along with the ability to override the interop mode either globally or for a specific import (see PR https://github.com/janus-idp/backstage-plugins/pull/971).
- Upgrade imported dynamic plugins to pick those built with this new CLI version.
