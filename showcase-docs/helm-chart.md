---
title: Helm Chart
custom_edit_url: https://github.com/janus-idp/backstage-showcase/blob/main/showcase-docs/helm-chart.md
tags:
  - Helm Chart
---

:::warning
This documentation is currently out of date
:::

The Helm Chart that this project is currently using is the Backstage Helm Chart. This Helm Chart is used to simplify the process of deploying the Backstage Showcase app to a Kubernetes cluster. For more information on the Backstage Helm Chart consult the [official documentation](https://github.com/backstage/charts).

## Getting Started

Ensure that you have Helm installed on your local machine, you can find out more information on the [Helm website](https://helm.sh/docs/intro/install/).

Next is to add the Backstage Helm Chart and its dependent repository.

```shell
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add backstage https://backstage.github.io/charts
```

## Deploying to a Kubernetes cluster

This guide will have a focus deploying to an OpenShift cluster as that is the main target for this project.

1. Build and push an image of the Backstage Showcase app that you can test.

   ```shell
   podman build -t <registry>/<repository>:<tag> . -f docker/Dockerfile
   podman push <registry>/<repository>:<tag>
   ```

2. Create a file to hold environment variables called `values-backstage-showcase.yaml` and populate it with the following content.

   ```yaml
   backstage:
     image:
       registry: <registry>
       repository: <repository>
       tag: <tag>
     extraEnvVars:
       - name: 'APP_CONFIG_app_baseUrl'
         value: 'http://{{ .Values.ingress.host }}:7007'
       - name: 'APP_CONFIG_backend_baseUrl'
         value: 'http://{{ .Values.ingress.host }}:7007'
       - name: 'APP_CONFIG_backend_cors_origin'
         value: 'http://{{ .Values.ingress.host }}:7007'

   ingress:
     enabled: false
     host: localhost
   ```

   1. Environment variables using the prefix APP_CONFIG will override the default variables that are configured within the app-config.yaml file. Ensure to update the `<registry>` `<repository>` and `<tag>` fields to point to your image.

3. Deploy the Backstage Showcase app to the OpenShift cluster

   ```shell
   helm install -n backstage --create-namespace backstage backstage/backstage -f values-backstage-showcase.yaml
   ```

4. You can see confirm that the Backstage Showcase pod is running using the command

   ```shell
   oc get pods -n backstage
   ```

5. Finally forward the port to access the Backstage Showcase app

   ```shell
   oc port-forward -n backstage svc/backstage 7007:7007
   ```

   1. The app can be accessed at [http://localhost:7007](http://localhost:7007)

## Additional Resources

For more information on the Helm Chart consult the [official Backstage Helm Chart](https://github.com/backstage/charts).

Here are also two blogs focused on deploying Backstage using the Helm Chart.

- [Getting Started with the Backstage Helm Chart (Part 1)](https://janus-idp.io/blog/getting-started-with-the-backstage-helm-chart-part-1)
- [Exploring the Flexibility of the Backstage Helm Chart (Part 2)](https://janus-idp.io/blog/exploring-the-flexibility-of-the-backstage-helm-chart-part-2)
