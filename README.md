# [Janus Showcase](https://showcase.janus-idp.io)

[0]: https://quay.io/repository/janus-idp/backstage-showcase

[![Quay.io registry](https://img.shields.io/badge/Quay.io-janus--idp/backstage--showcase:latest-white?logoColor=white&labelColor=grey&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NSIgaGVpZ2h0PSIzOS43IiB2aWV3Qm94PSIwIDAgMzkuNyAzOS43Ij48ZyB0cmFuc2Zvcm09Im1hdHJpeCguMzk0NTggMCAwIC4zOTQ1OCAxLjA4MiAuMTA1KSI+PGNpcmNsZSBjeD0iNTUuMDY5IiBjeT0iNTAiIHI9IjUwIiBmaWxsPSIjRDcxRTAwIi8+PHBhdGggZmlsbD0iI0MyMUEwMCIgZD0iTTkwLjQyOSAxNC42NDFjMTkuNTI5IDE5LjUyOSAxOS41MjkgNTEuMTkgMCA3MC43MTgtMTkuNTI5IDE5LjUzLTUxLjE5MiAxOS41My03MC43MiAwbDcwLjcyLTcwLjcxOHoiLz48cGF0aCBmaWxsPSIjRkZGIiBkPSJtNTkuNjA4IDQ5Ljk5IDE1LjA2IDMxLjg2OWgtMTIuODNMNDYuNzg5IDQ5Ljk5bDE1LjA0OS0zMS44NWgxMi44M3oiLz48cGF0aCBmaWxsPSIjQjdCN0I3IiBkPSJtNzQuNjY4IDgxLjg1OSAxNS4wNS0zMS44NjktMTUuMDUtMzEuODUtNi40MSAxMy41NiA4LjY0IDE4LjI5LTguNjQgMTguMzAxeiIvPjxwYXRoIGZpbGw9IiNGRkYiIGQ9Im0zMy4yMzkgNDkuOTkgMTUuMDYgMzEuODY5aC0xMi44M0wyMC40MTkgNDkuOTlsMTUuMDUtMzEuODVoMTIuODN6Ii8+PHBhdGggZmlsbD0iI0I3QjdCNyIgZD0ibTQ4LjY1OSA0Ni4wNCA2LjQxLTEzLjU3LTYuNzctMTQuMzMtNi40MiAxMy41N3pNNDEuODc5IDY4LjI5MWw2LjQyIDEzLjU2OCA2Ljc3LTE0LjMzLTYuNDEtMTMuNTY4eiIvPjwvZz48L3N2Zz4K)][0]

## Purpose

Our purpose for this project is to first showcase the value of the plugins that we have created. These include the ArgoCD, GitHub Issues, Keycloak, Kubernetes, OCM, Tekton, and Topology plugin. Each of these plugins have been hand picked or created by the Janus IDP team for their practicality.

The second purpose is to demonstrate the power of an internal developer portal using Backstage as the solution. Backstage is an application that can simplify the onboarding process for organizations with plenty of customization through the use of their plugin system.

## Features

Today, we have several plugins integrated into the showcase app as a way to demonstrate the versatility of Backstage. Some of these integrations are plugins that we have built while others are ones that we see as must haves in most Backstage instances.

Our current list of plugins within the showcase app include:

- [OCM plugin](https://github.com/janus-idp/backstage-plugins/tree/main/plugins/ocm)
- [Quay plugin](https://github.com/janus-idp/backstage-plugins/tree/main/plugins/quay)
- [Kubernetes plugin](https://github.com/backstage/backstage/tree/master/plugins/kubernetes)
- [Topology plugin](https://github.com/janus-idp/backstage-plugins/tree/main/plugins/topology)
- [ArgoCD plugin](https://github.com/RoadieHQ/roadie-backstage-plugins/tree/main/plugins/frontend/backstage-plugin-argo-cd)
- [GitHub Insights plugin](https://github.com/RoadieHQ/roadie-backstage-plugins/tree/main/plugins/frontend/backstage-plugin-github-insights)
- [GitHub Pull Requests plugin](https://github.com/backstage/backstage/tree/master/plugins/github-pull-requests-board)
- [GitHub Actions plugin](https://github.com/backstage/backstage/tree/master/plugins/github-actions)
- [GitHub Issues plugin](https://github.com/backstage/backstage/tree/master/plugins/github-issues)
- [GitHub Discovery](https://backstage.io/docs/integrations/github/discovery) & [Org Data](https://backstage.io/docs/integrations/github/org)
- [Security Insights plugin](https://github.com/RoadieHQ/roadie-backstage-plugins/tree/main/plugins/frontend/backstage-plugin-security-insights)
- [Keycloak plugin](https://github.com/janus-idp/backstage-plugins/tree/main/plugins/keycloak-backend)
- [SonarQube plugin](https://roadie.io/backstage/plugins/sonarqube/)
- [Tekton plugin](https://github.com/janus-idp/backstage-plugins/tree/main/plugins/tekton)
- [Azure DevOps plugin](https://github.com/backstage/backstage/blob/master/plugins/azure-devops/README.md)
- [Jenkins plugin](https://github.com/backstage/backstage/tree/master/plugins/jenkins)
- [GitLab plugin](https://github.com/immobiliare/backstage-plugin-gitlab)
- [Jira plugin](https://github.com/RoadieHQ/roadie-backstage-plugins/tree/main/plugins/frontend/backstage-plugin-jira)
- [Jfrog Artifactory plugin](https://github.com/janus-idp/backstage-plugins/tree/main/plugins/jfrog-artifactory)
- [Datadog plugin](https://github.com/RoadieHQ/roadie-backstage-plugins/tree/main/plugins/frontend/backstage-plugin-datadog)
- [PagerDuty](https://github.com/backstage/backstage/tree/master/plugins/pagerduty)
- [Lighthouse plugin](https://github.com/backstage/backstage/tree/master/plugins/lighthouse)
- [Dynatrace plugin](https://github.com/backstage/backstage/tree/master/plugins/dynatrace)
- [Gitlab Scaffolder actions](https://github.com/backstage/backstage/tree/master/plugins/scaffolder-backend-module-gitlab)
- [Utils Scaffolder actions](https://github.com/RoadieHQ/roadie-backstage-plugins/tree/main/plugins/scaffolder-actions/scaffolder-backend-module-utils)
- [Nexus Repository Manager plugin](https://github.com/janus-idp/backstage-plugins/tree/main/plugins/nexus-repository-manager)
- [AAP Backend plugin](https://github.com/janus-idp/backstage-plugins/tree/main/plugins/aap-backend)

## Getting Started

Dependencies:

- [Node.js](https://nodejs.org/en/) 18
- [yarn](https://classic.yarnpkg.com/en/docs/install#debian-stable)

Information on running the showcase app can be found in our [Getting Started](https://github.com/janus-idp/backstage-showcase/blob/main/showcase-docs/getting-started.md) documentation. In the documentation is how to set up and run an instance of the showcase app locally. We plan to expand upon the documentation at a later point if there is enough interest in other methods for getting the app up and running.

We are excited to see people wanting to contribute to our project and welcome anyone who wishes to participate. You are more than welcome to browse through our open issues and tackle anything you feel confident in working on.

We also welcome non code contributions in the form of bug reporting and documentation writing. If you run across any bugs in the showcase app, please raise an issue here in [GitHub](https://github.com/janus-idp/backstage-showcase/issues/new?assignees=&labels=kind%2Fbug%2Cstatus%2Ftriage&template=bug.md).

## Community, Discussion, and Support

The Janus Community meeting is held biweekly on Thursday at 1:30 UTC via [Google Meet](https://meet.google.com/taq-tpfs-rre). An [agenda](https://docs.google.com/document/d/1RYkKxBRj6uMT5PTIugAuxAIYK9WxTkKgqdcdw1752Dc/edit?usp=sharing) can be found for the meeting and we encourage you to add any topics that you wish to discuss.

[Bugs](https://github.com/janus-idp/backstage-showcase/issues/new?assignees=&labels=kind%2Fbug%2Cstatus%2Ftriage&template=bug.md) should be filled out here on GitHub.

Join the [community slack channel](https://join.slack.com/t/janus-idp/shared_invite/zt-1pxtehxom-fCFtF9rRe3vFqUiFFeAkmg) for a quick way to reach us or members of the community for discussion and collaboration.

Want to see a plugin in the showcase? Create an [issue](https://github.com/janus-idp/backstage-showcase/issues/new?assignees=&labels=kind%2Ffeature%2Cstatus%2Ftriage&template=feature.md) and we will discuss if it is right for the project.

Have an idea for a plugin? Submit a [proposal](https://github.com/janus-idp/backstage-plugins/issues/new?assignees=&labels=plugin&template=plugin.yaml&title=%F0%9F%94%8C+Plugin%3A+) to the Janus IDP Backstage Plugins repo.

## Resources

Our [blog](https://janus-idp.io/blog) is a great way to see what we are up to.

You can find the Backstage Showcase app running at <https://showcase.janus-idp.io>.

For more information on our plugin offerings, consult the [Janus IDP Backstage Plugins](https://github.com/janus-idp/backstage-plugins) repo.

Want to know more about Backstage, consult the [documentation](https://backstage.io/docs/overview/what-is-backstage) and [GitHub](https://github.com/backstage/backstage) repo.

## Multi-arch support

RHDH is currently only available for amd64/x86_64. 

For additional architecture support, please vote for https://issues.redhat.com/browse/RHIDP-1351 with your reason for needing additional arches.

If you want an image that runs on Mac M1 (arm64/aarch64) or another architecture, you will need to build it yourself.

### Building locally

Check out this repo, choose the branch or tag you want to use, then build an image:

```
podman build -f docker/Dockerfile . -t janus-idp/backstage-showcase:local
```
