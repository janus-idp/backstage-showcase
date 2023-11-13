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

To enable metrics monitoring for Backstage Showcase on Azure Kubernetes Service (AKS), you can use the [Azure Monitor managed service for Prometheus](https://learn.microsoft.com/en-us/azure/azure-monitor/essentials/prometheus-metrics-overview). The AKS cluster will need to have an associated [Azure Monitor workspace](https://learn.microsoft.com/en-us/azure/azure-monitor/containers/prometheus-metrics-enable?tabs=azure-portal).

One method is to configure the metrics scraping of your AKS cluster using the [Azure Monitor _metrics_ add-on](https://learn.microsoft.com/en-us/azure/azure-monitor/containers/prometheus-metrics-scrape-configuration).

The other method is to configure the Azure Monitor _monitoring_ add-on which also allows you to [send Prometheus metrics to the Log Analytics workspace](https://learn.microsoft.com/en-us/azure/azure-monitor/containers/container-insights-prometheus-logs). These metrics can then be queried using [Log Analytics queries](https://learn.microsoft.com/en-us/azure/azure-monitor/containers/container-insights-log-query#prometheus-metrics) as well as be visible in a Grafana instance.

In both methods, we can configure the metrics scraping to scrap from pods based on pod Annotations. To add annotations to the backstage pod, add the following to the Janus Helm chart `values.yaml`:

```yaml title="values.yaml"
upstream:
  backstage:
    # Other configurations above
    podAnnotations:
      # Other annotations above
      prometheus.io/scrape: 'true'
      prometheus.io/path: '/metrics'
      prometheus.io/port: '7007'
      prometheus.io/scheme: 'http'
```

#### Metrics Add-on

#### Monitoring Add-on

<details>
<summary>For the _monitoring_ add-on, we will need to add the a modified instance of <a href=https://raw.githubusercontent.com/microsoft/Docker-Provider/ci_prod/kubernetes/container-azm-ms-agentconfig.yaml>this ConfigMap</a> to the `kube-system` namespace of the AKS cluster. Please replace the values of namespace with the namespace you deployed into:</summary>

```yaml
kind: ConfigMap
apiVersion: v1
metadata:
  name: container-azm-ms-agentconfig
  namespace: kube-system
data:
  schema-version:
    #string.used by agent to parse config. supported versions are {v1}. Configs with other schema versions will be rejected by the agent.
    v1
  config-version:
    #string.used by customer to keep track of this config file's version in their source control/repository (max allowed 10 chars, other chars will be truncated)
    ver1
  log-data-collection-settings: |-
    # Log data collection settings
    # Any errors related to config map settings can be found in the KubeMonAgentEvents table in the Log Analytics workspace that the cluster is sending data to.

    [log_collection_settings]
       [log_collection_settings.stdout]
          # In the absence of this configmap, default value for enabled is true
          enabled = true
          # exclude_namespaces setting holds good only if enabled is set to true
          # kube-system,gatekeeper-system log collection are disabled by default in the absence of 'log_collection_settings.stdout' setting. If you want to enable kube-system,gatekeeper-system, remove them from the following setting.
          # If you want to continue to disable kube-system,gatekeeper-system log collection keep the namespaces in the following setting and add any other namespace you want to disable log collection to the array.
          # In the absence of this configmap, default value for exclude_namespaces = ["kube-system","gatekeeper-system"]
          exclude_namespaces = ["kube-system","gatekeeper-system"]

       [log_collection_settings.stderr]
          # Default value for enabled is true
          enabled = true
          # exclude_namespaces setting holds good only if enabled is set to true
          # kube-system,gatekeeper-system log collection are disabled by default in the absence of 'log_collection_settings.stderr' setting. If you want to enable kube-system,gatekeeper-system, remove them from the following setting.
          # If you want to continue to disable kube-system,gatekeeper-system log collection keep the namespaces in the following setting and add any other namespace you want to disable log collection to the array.
          # In the absence of this configmap, default value for exclude_namespaces = ["kube-system","gatekeeper-system"]
          exclude_namespaces = ["kube-system","gatekeeper-system"]

       [log_collection_settings.env_var]
          # In the absence of this configmap, default value for enabled is true
          enabled = true
       [log_collection_settings.enrich_container_logs]
          # In the absence of this configmap, default value for enrich_container_logs is false
          enabled = false
          # When this is enabled (enabled = true), every container log entry (both stdout & stderr) will be enriched with container Name & container Image
       [log_collection_settings.collect_all_kube_events]
          # In the absence of this configmap, default value for collect_all_kube_events is false
          # When the setting is set to false, only the kube events with !normal event type will be collected
          enabled = false
          # When this is enabled (enabled = true), all kube events including normal events will be collected
       #[log_collection_settings.schema]
          # In the absence of this configmap, default value for containerlog_schema_version is "v1"
          # Supported values for this setting are "v1","v2"
          # See documentation at https://aka.ms/ContainerLogv2 for benefits of v2 schema over v1 schema before opting for "v2" schema
          # containerlog_schema_version = "v2"
       #[log_collection_settings.enable_multiline_logs]
          # fluent-bit based multiline log collection for .NET, Go, Java, and Python stacktraces.
          # if enabled will also stitch together container logs split by docker/cri due to size limits(16KB per log line)
          # enabled = "false"

  prometheus-data-collection-settings: |-
    # Custom Prometheus metrics data collection settings
    [prometheus_data_collection_settings.cluster]
        # Cluster level scrape endpoint(s). These metrics will be scraped from agent's Replicaset (singleton)
        # Any errors related to prometheus scraping can be found in the KubeMonAgentEvents table in the Log Analytics workspace that the cluster is sending data to.

        #Interval specifying how often to scrape for metrics. This is duration of time and can be specified for supporting settings by combining an integer value and time unit as a string value. Valid time units are ns, us (or µs), ms, s, m, h.
        interval = "1m"

        ## Uncomment the following settings with valid string arrays for prometheus scraping
        #fieldpass = ["metric_to_pass1", "metric_to_pass12"]

        #fielddrop = ["metric_to_drop"]

        # An array of urls to scrape metrics from.
        # urls = ["http://myurl:9101/metrics"]

        # An array of Kubernetes services to scrape metrics from.
        # kubernetes_services = ["http://my-service-dns.my-namespace:9102/metrics"]
        # kubernetes_services = ["http://test-hub-backstage.rhdh.svc.cluster.local:7007/metrics"]

        # When monitor_kubernetes_pods = true, replicaset will scrape Kubernetes pods for the following prometheus annotations:
        # - prometheus.io/scrape: Enable scraping for this pod
        # - prometheus.io/scheme: Default is http
        # - prometheus.io/path: If the metrics path is not /metrics, define it with this annotation.
        # - prometheus.io/port: If port is not 9102 use this annotation
        monitor_kubernetes_pods = true

        # Restricts Kubernetes monitoring to namespaces for pods that have annotations set and are scraped using the monitor_kubernetes_pods setting.
        # This will take effect when monitor_kubernetes_pods is set to true
        #   ex: monitor_kubernetes_pods_namespaces = ["default1", "default2", "default3"]
        monitor_kubernetes_pods_namespaces = ["<your-namespace>"]

        ## Label selector to target pods which have the specified label
        ## This will take effect when monitor_kubernetes_pods is set to true
        ## Reference the docs at https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#label-selectors
        # kubernetes_label_selector = "env=dev,app=nginx"

        ## Field selector to target pods which have the specified field
        ## This will take effect when monitor_kubernetes_pods is set to true
        ## Reference the docs at https://kubernetes.io/docs/concepts/overview/working-with-objects/field-selectors/
        ## eg. To scrape pods on a specific node
        # kubernetes_field_selector = "spec.nodeName=$HOSTNAME"

    [prometheus_data_collection_settings.node]
        # Node level scrape endpoint(s). These metrics will be scraped from agent's DaemonSet running in every node in the cluster
        # Any errors related to prometheus scraping can be found in the KubeMonAgentEvents table in the Log Analytics workspace that the cluster is sending data to.

        #Interval specifying how often to scrape for metrics. This is duration of time and can be specified for supporting settings by combining an integer value and time unit as a string value. Valid time units are ns, us (or µs), ms, s, m, h.
        interval = "1m"

        ## Uncomment the following settings with valid string arrays for prometheus scraping

        # An array of urls to scrape metrics from. $NODE_IP (all upper case) will substitute of running Node's IP address
        # urls = ["http://$NODE_IP:9103/metrics"]

        #fieldpass = ["metric_to_pass1", "metric_to_pass12"]

        #fielddrop = ["metric_to_drop"]

  metric_collection_settings: |-
    # Metrics collection settings for metrics sent to Log Analytics and MDM
    [metric_collection_settings.collect_kube_system_pv_metrics]
      # In the absence of this configmap, default value for collect_kube_system_pv_metrics is false
      # When the setting is set to false, only the persistent volume metrics outside the kube-system namespace will be collected
      enabled = false
      # When this is enabled (enabled = true), persistent volume metrics including those in the kube-system namespace will be collected

  alertable-metrics-configuration-settings: |-
    # Alertable metrics configuration settings for container resource utilization
    [alertable_metrics_configuration_settings.container_resource_utilization_thresholds]
        # The threshold(Type Float) will be rounded off to 2 decimal points
        # Threshold for container cpu, metric will be sent only when cpu utilization exceeds or becomes equal to the following percentage
        container_cpu_threshold_percentage = 95.0
        # Threshold for container memoryRss, metric will be sent only when memory rss exceeds or becomes equal to the following percentage
        container_memory_rss_threshold_percentage = 95.0
        # Threshold for container memoryWorkingSet, metric will be sent only when memory working set exceeds or becomes equal to the following percentage
        container_memory_working_set_threshold_percentage = 95.0

    # Alertable metrics configuration settings for persistent volume utilization
    [alertable_metrics_configuration_settings.pv_utilization_thresholds]
        # Threshold for persistent volume usage bytes, metric will be sent only when persistent volume utilization exceeds or becomes equal to the following percentage
        pv_usage_threshold_percentage = 60.0

    # Alertable metrics configuration settings for completed jobs count
    [alertable_metrics_configuration_settings.job_completion_threshold]
        # Threshold for completed job count , metric will be sent only for those jobs which were completed earlier than the following threshold
        job_completion_threshold_time_minutes = 360
  integrations: |-
    [integrations.azure_network_policy_manager]
        collect_basic_metrics = false
        collect_advanced_metrics = false
    [integrations.azure_subnet_ip_usage]
        enabled = false

  # Doc - https://github.com/microsoft/Docker-Provider/blob/ci_prod/Documentation/AgentSettings/ReadMe.md
  agent-settings: |-
    # prometheus scrape fluent bit settings for high scale
    # buffer size should be greater than or equal to chunk size else we set it to chunk size.
    # settings scoped to prometheus sidecar container. all values in mb
    [agent_settings.prometheus_fbit_settings]
      tcp_listener_chunk_size = 10
      tcp_listener_buffer_size = 10
      tcp_listener_mem_buf_limit = 200

    # prometheus scrape fluent bit settings for high scale
    # buffer size should be greater than or equal to chunk size else we set it to chunk size.
    # settings scoped to daemonset container. all values in mb
    # [agent_settings.node_prometheus_fbit_settings]
      # tcp_listener_chunk_size = 1
      # tcp_listener_buffer_size = 1
      # tcp_listener_mem_buf_limit = 10

    # prometheus scrape fluent bit settings for high scale
    # buffer size should be greater than or equal to chunk size else we set it to chunk size.
    # settings scoped to replicaset container. all values in mb
    # [agent_settings.cluster_prometheus_fbit_settings]
      # tcp_listener_chunk_size = 1
      # tcp_listener_buffer_size = 1
      # tcp_listener_mem_buf_limit = 10

    # The following settings are "undocumented", we don't recommend uncommenting them unless directed by Microsoft.
    # They increase the maximum stdout/stderr log collection rate but will also cause higher cpu/memory usage.
    ## Ref for more details about Ignore_Older -  https://docs.fluentbit.io/manual/v/1.7/pipeline/inputs/tail
    # [agent_settings.fbit_config]
    #   log_flush_interval_secs = "1"                 # default value is 15
    #   tail_mem_buf_limit_megabytes = "10"           # default value is 10
    #   tail_buf_chunksize_megabytes = "1"            # default value is 32kb (comment out this line for default)
    #   tail_buf_maxsize_megabytes = "1"              # default value is 32kb (comment out this line for default)
    #   tail_ignore_older = "5m"                      # default value same as fluent-bit default i.e.0m

    # On both AKS & Arc K8s enviornments, if Cluster has configured with Forward Proxy then Proxy settings automatically applied and used for the agent
    # Certain configurations, proxy config should be ignored for example Cluster with AMPLS + Proxy
    # in such scenarios, use the following config to ignore proxy settings
    # [agent_settings.proxy_config]
    #    ignore_proxy_settings = "true"  # if this is not applied, default value is false

    # The following settings are "undocumented", we don't recommend uncommenting them unless directed by Microsoft.
    # Configuration settings for the waittime for the network listeners to be available
    # [agent_settings.network_listener_waittime]
    #   tcp_port_25226 = 45                           # Port 25226 is used for telegraf to fluent-bit data in ReplicaSet
    #   tcp_port_25228 = 60                           # Port 25228 is used for telegraf to fluentd data
    #   tcp_port_25229 = 45                           # Port 25229 is used for telegraf to fluent-bit data in DaemonSet

    # The following settings are "undocumented", we don't recommend uncommenting them unless directed by Microsoft.
    # [agent_settings.mdsd_config]
    #   monitoring_max_event_rate = "50000" # default 20K eps
    #   backpressure_memory_threshold_in_mb = "1500" # default 3500MB
    #   upload_max_size_in_mb = "20"  # default 2MB
    #   upload_frequency_seconds = "1" # default 60 upload_frequency_seconds
    #   compression_level = "0"  # supported levels 0 to 9 and 0 means no compression
```

</details>

To view the metrics, you can create a Grafana instance, [connect it to the Azure Monitor workspace](https://docs.microsoft.com/en-us/azure/azure-monitor/visualize/tutorial-logs-dashboards-with-grafana#connect-grafana-to-azure-monitor) and view the metrics with PromQL.

Alternatively, you can use [Log Analytics]() to query the metrics. You can query the metrics using the following query, to only get metrics from the Backstage instance:

```kql
let custom_metrics = "custom-metric-name";
InsightsMetrics
| where Namespace contains "prometheus"
| where Name == custom_metrics
| extend tags = parse_json(Tags)
| where tostring(tags['app.kubernetes.io/component']) == "backstage"
```

## Logging

Logging in backstage showcase is conducted using the [winston](https://github.com/winstonjs/winston) library. By default, logs of level `debug` are not logged. To enable debug logs, you will need to set the environment variable `LOG_LEVEL` to `debug` in your deployment in the helm chart's `values.yaml` as follows:

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
