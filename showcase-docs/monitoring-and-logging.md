# Setting up Metrics Monitoring and Logging for Backstage Showcase

The Backstage Showcase provides a `/metrics` endpoint that provides Prometheus metrics about your backstage application. This endpoint can be used to monitor your backstage instance using Prometheus and Grafana.

When deploying Backstage Showcase onto a kubernetes cluster with the [Janus Helm chart](https://github.com/janus-idp/helm-backstage), monitoring and logging for your Janus instance can be configured using the following steps.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- PV provisioner support in the underlying infrastructure
- The [Janus Helm chart repositories](https://github.com/janus-idp/helm-backstage#installing-from-the-chart-repository) have been added

## Metrics Monitoring

### Enabling Metrics Monitoring on Openshift

To enable metrics on Openshift, you will need to modify the `values.yaml` of the [Janus Helm chart](https://github.com/janus-idp/helm-backstage/blob/main/charts/backstage/values.yaml)

To obtain the `values.yaml`, you can run the following command:

```bash
helm show values janus-idp/backstage > values.yaml
```

Then, you will need to modify the `values.yaml` to enable metrics monitoring by adding the following configurations:

```yaml title="values.yaml"
upstream:
  # Other Configurations Above
  metrics:
    serviceMonitor:
      enabled: true
      path: /metrics
```

Then you can deploy the Janus Helm chart with the modified `values.yaml`:

```bash
helm upgrade -i <release_name> janus-idp/backstage -f values.yaml
```

This will create a `ServiceMonitor` resource in your Openshift cluster that will be used by Prometheus to scrape metrics from your Backstage instance. For the metrics to be ingested by the built-in Prometheus instances in Openshift, please ensure you enabled [monitoring for user-defined projects](https://docs.openshift.com/container-platform/latest/monitoring/enabling-monitoring-for-user-defined-projects.html)

You can then verify metrics are being captured by navigating to the Openshift Console. Go to `Developer` Mode, change to the namespace the showcase is deployed on, selecting `Observe` and navigating to the `Metrics` tab. Here you can create PromQL queries to query the metrics being captured by Prometheus.
![Openshift Metrics](./images/openshift-metrics.png)

### Enabling Metrics Monitoring on Azure Kubernetes Service (AKS)

## Logging

Logging in backstage showcase is conducted using the [winston](https://github.com/winstonjs/winston) library. By default, logs of level `debug` are not logged. To enable debug logs, you will need to set the environment variable `LOG_LEVEL` to `debug` in your deployment via the helm chart `values.yaml` as follows:

```yaml title="values.yaml"
upstream:
  backstage:
    # Other configurations above
    extraEnvVars:
      - name: LOG_LEVEL
        value: debug
```

### Openshift Logging Integration

[Openshift Logging](https://access.redhat.com/documentation/en-us/openshift_container_platform/4.13/html/logging/index) can be used to monitor Backstage logs. The only requirement is to correctly filter logs in Kibana. A possible filter is using the field `kubernetes.container_name` with operator `is` and value `backstage-backend`.

### Logging with Azure Monitor Container Insights

[Azure Monitor Container Insights](https://learn.microsoft.com/en-us/azure/azure-monitor/containers/container-insights-log-query#container-logs) can be used to query logs from your Backstage instance. The AKS cluster must have Container Insights configured with container logs turned on. You can then query logs from your Backstage instance by querying from the `ContainerLogV2` table:

```kql
ContainerLogV2
| where ContainerName == "backstage-backend"
| project TimeGenerated, LogMessage
```
