# Integrating with Amazon Web Services (AWS)

## Deploying in Elastic Kubernetes Services (EKS)

To deploy the Backstage Showcase Application in EKS, you need to:

- configure how the application will be exposed (ingress configuration),
- and configure volume permissions by setting an `fsGroup` field in the security context of the pods deployed.

To expose applications running in EKS, AWS recommends using the AWS Application Load Balancer (ALB). See [Application load balancing on Amawon EKS](https://docs.aws.amazon.com/eks/latest/userguide/alb-ingress.html). But you can also leverage any other Ingress Controller in your cluster, like [NGINX Ingress Controller](https://docs.nginx.com/nginx-ingress-controller/) or [Traefik](https://doc.traefik.io/traefik/providers/kubernetes-ingress/).

**NOTES**:

- If you do not know the desired group ID (from the container image), you can assign a random value to the corresponding `fsGroup` field. By setting `fsGroup` in the Pod Security Context, all processes of the containers are also made part of the supplementary group ID set in the field. The owner for volume mount location and any files created in that volume will be the group ID set in the field. However, be cautious with the use of `fsGroup`; changing the group ownership of an entire volume can cause pod startup delays for slow and/or large filesystems. Read these articles by [Snyk](https://snyk.io/blog/10-kubernetes-security-context-settings-you-should-understand/) and [Google Cloud](https://cloud.google.com/kubernetes-engine/docs/troubleshooting/troubleshooting-gke-storage#mounting_a_volume_stops_responding_due_to_the_fsgroup_setting) to learn more about it.

- Setting an HTTPS Listener with ALB requires a certificate with your custom domain. If you don't have any custom domain/certificate, you can define the HTTP Listener in ALB, and then create a CloudFront distribution using the ALB endpoint as the content origin. This way, it would be possible to access the Backstage application using the CloudFront domain name. See [Steps for creating a distribution](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-creating.html).

### Using Helm

See [Helm Chart installation](helm-chart.md) for more details.

You will need to set the following in your `values.yaml` file:

```yaml
global:
  # TODO: Adjust this value if you know the DNS name under which
  # your Showcase instance will be exposed.
  # If using ALB with dynamic load balancer DNS, you'll need to deploy first
  # (so as to get the ALB Ingress provisioned),
  # then change this value and redeploy.
  # Adjust if using a different Ingress Controller.
  host: <app_dns_name>
route:
  enabled: false # OpenShift Routes do not exist on vanilla Kubernetes
upstream:
  service:
    # NodePort is required for the ALB to route to the Service
    type: NodePort

  ingress:
    enabled: true # Use Kubernetes Ingress instead of OpenShift Route

    annotations:
      # TODO: alb because AWS recommends using ALB.
      # But adjust if using a different Ingress Controller
      # and remove the 'alb.*' annotations accordingly.
      kubernetes.io/ingress.class: alb

      # TODO: Add your subnets if needed
      # alb.ingress.kubernetes.io/subnets: subnet-xxx,subnet-yyy

      # Below annotation is to specify if the loadbalancer is "internal" or "internet-facing"
      alb.ingress.kubernetes.io/scheme: internet-facing

      # TODO: Using an ALB HTTPS Listener requires a certificate for your own domain. Fill in the ARN of your certificate, e.g.:
      # alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-west-2:xxxx:certificate/xxxxxx

      # TODO: The HTTPS listener below requires setting the certificate ARN above. Remove it if you plan to expose your instance differently, for example via a CloudFront distribution.
      alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS":443}]'

      # TODO: if needed, set HTTP to HTTPS redirects. Every HTTP listener configured will be redirected to below mentioned port over HTTPS.
      # alb.ingress.kubernetes.io/ssl-redirect: '443'

  backstage:
    podSecurityContext:
      fsGroup: 2000 # you can assign any random value as fsGroup
  postgresql:
    primary:
      podSecurityContext:
        enabled: true
        fsGroup: 3000 # you can assign any random value as fsGroup
  volumePermissions:
    enabled: true
```

**NOTES**:

- Setting the HTTPS Listener with ALB requires a certificate with your custom domain. If you don't have any custom domain/certificate, you can set the `alb.ingress.kubernetes.io/listen-ports` annotation to `[{"HTTP": 80}]`, and then create a CloudFront distribution using the ALB endpoint as the content origin. This way, it would be possible to access the application using the CloudFront domain name. See [Steps for creating a distribution](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-creating.html).
- Make sure to replace `<app_dns_name>` with the value of the Showcase application DNS name (e.g. a custom domain name known upfront, or an ALB DNS name, or a CloudFront DNS name like `d376s7j9emms3n.cloudfront.net` if you used CloudFront behind your ALB).
  If you are using ALB with a dynamic load balancer DNS, you'll need to deploy first (so as to get the ALB Ingress provisioned by AWS), then change the `global.host` value with the DNS name returned by AWS and redeploy.

### Using the Operator

#### Installing the Operator

See the [operator developer guide](https://github.com/janus-idp/operator/blob/main/docs/developer.md) for more details on how to deploy the operator.
In a nutshell:

- if you have the Operator Lifecycle Manager (OLM) installed in your cluster, you can run `make deploy-olm` to deploy the operator.
- otherwise, you can either run `make deploy` to deploy the operator right away, or run `make deployment-manifest` to generate a YAML file that you can adjust and apply against your cluster.

Since we need to configure volume permissions by setting an `fsGroup` field in the security context of the pods deployed by the operator, we will generate and manually update the deployment manifest.

- Clone the operator repo:

```sh
$ git clone --depth=1 https://github.com/janus-idp/operator.git backstage-operator \
  && cd backstage-operator
```

- Generate the deployment manifest with the command below. This will generate a file named `rhdh-operator-<VERSION>.yaml` that we will need to manually update.

```sh
$ make deployment-manifest
```

- Open the deployment manifest file with your favorite editor, and
  - locate the “db-statefulset.yaml” string and add the fsGroup to its `spec.template.spec.securityContext`, e.g.:

```yaml
  db-statefulset.yaml: |
    apiVersion: apps/v1
    kind: StatefulSet
--- TRUNCATED ---
    spec:
      --- TRUNCATED ---
      restartPolicy: Always
      securityContext:
        # You can assign any random value as fsGroup
        fsGroup: 2000
      serviceAccount: default
      serviceAccountName: default
--- TRUNCATED ---
```

- locate the “deployment.yaml” string and add the fsGroup to its spec, e.g.:

```yaml
  deployment.yaml: |
    apiVersion: apps/v1
    kind: Deployment
--- TRUNCATED ---
    spec:
      securityContext:
        # You can assign any random value as fsGroup
        fsGroup: 3000
      automountServiceAccountToken: false
--- TRUNCATED ---
```

- locate the “service.yaml” string and change the type to NodePort, e.g.:

```yaml
service.yaml: |
  apiVersion: v1
  kind: Service
  spec:
   # NodePort is required for the ALB to route to the Service
   type: NodePort
---
TRUNCATED ---
```

- Now apply the operator deployment manifest:

```sh
$ kubectl apply -f rhdh-operator-VERSION.yaml
```

- At this point, the operator will be created in the `backstage-system` namespace after some time. To check if it is running, you can run the following command and wait for the operator pod to be Running:

```sh
$ kubectl -n backstage-system get pods -w
```

#### Installing the Showcase application

Now that the operator is installed and running, we can create a Backstage instance in EKS.

- Create a Custom Resource file using the following template as content:

```yaml
apiVersion: rhdh.redhat.com/v1alpha1
kind: Backstage
metadata:
  # TODO: this the name of your showcase instance
  name: my-backstage
spec:
  application:
    route:
      enabled: false
```

- To expose and access the Backstage Instance, you will need to manually create an Ingress Resource. You can use the template below:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  # TODO: this the name of your showcase instance
  name: my-backstage
  annotations:
    # Below annotation is to specify if the loadbalancer is "internal" or "internet-facing"
    alb.ingress.kubernetes.io/scheme: internet-facing

    alb.ingress.kubernetes.io/target-type: ip

    # TODO: Using an ALB HTTPS Listener requires a certificate for your own domain. Fill in the ARN of your certificate, e.g.:
    # alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-west-2:xxxx:certificate/xxxxxx

    # TODO: The HTTPS listener below requires setting the certificate ARN above. Remove it if you plan to expose your instance differently, for example via a CloudFront distribution.
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS":443}]'

    # TODO: if needed, set HTTP to HTTPS redirects. Every HTTP listener configured will be redirected to below mentioned port over HTTPS.
    # alb.ingress.kubernetes.io/ssl-redirect: '443'

spec:
  # alb because we are using ALB.
  # But adjust if using a different Ingress Controller
  # and remove the 'alb.*' annotations accordingly.
  ingressClassName: alb
  rules:
    - http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                # TODO: my-backstage is the name of your Backstage Custom Resource.
                # Adjust if you changed it!
                name: backstage-my-backstage
                port:
                  name: http-backend
```

**Notes**:

- Setting the HTTPS Listener with ALB requires a certificate with your custom domain. If you don't have any custom domain/certificate, you can set the `alb.ingress.kubernetes.io/listen-ports` annotation to `[{"HTTP": 80}]`, and then create a CloudFront distribution using the ALB endpoint as the content origin. This way, it would be possible to access the application using the CloudFront domain name. See [Steps for creating a distribution](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-creating.html).

- We now need to set the URL to the application into the configuration of the deployed Backstage application.

  - Create a ConfigMap named `app-config-backstage` storing the Showcase configuration using the following template:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config-backstage
data:
  'app-config-backstage.yaml': |
    app:
      baseUrl: https://<app_dns_name>
    backend:
      auth:
        keys:
          - secret: "${BACKEND_SECRET}"
      baseUrl: https://<app_dns_name>
      cors:
        origin: https://<app_dns_name>
```

Make sure to replace `<app_dns_name>` with the value of the Showcase application DNS name (e.g. a custom domain name known upfront, or an ALB DNS name, like `k8s-rhdhoper-myrhdh-f9ec8d3481-1192320380.eu-north-1.elb.amazonaws.com` from our output above, or a CloudFront DNS name like `d376s7j9emms3n.cloudfront.net` if you used CloudFront behind your ALB).
If you are using ALB with a dynamic load balancer DNS, you'll need to deploy first (so as to get the ALB Ingress provisioned by AWS), then change the `global.host` value with the DNS name returned by AWS and redeploy.

- Create a Secret named `secrets-backstage` and add a key named `BACKEND_SECRET` with a Base64-encoded string as value. Use a unique value for each Backstage instance.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: secrets-backstage
stringData:
  # TODO: See https://backstage.io/docs/auth/service-to-service-auth/#setup:
  # node -p 'require("crypto").randomBytes(24).toString("base64")'
  BACKEND_SECRET: 'R2FxRVNrcmwzYzhhN3l0V1VRcnQ3L1pLT09WaVhDNUEK' # notsecret
```

- Then update your Backstage Custom Resource created in the first step above:

```yaml
apiVersion: rhdh.redhat.com/v1alpha1
kind: Backstage
metadata:
  # TODO: this the name of your showcase instance
  name: my-backstage
spec:
  application:
    route:
      enabled: false
    appConfig:
      configMaps:
        - name: 'app-config-backstage'
    extraEnvs:
      secrets:
        - name: 'secrets-backstage'
```

## Logging with Amazon CloudWatch Logs

Please refer to [Logging](monitoring-and-logging.md#logging) for more details on how to adjust the logging level of the Backstage application.

Amazon recommends using CloudWatch Container Insights to capture logs and metrics for Amazon EKS. More details in [Logging for Amazon EKS](https://docs.aws.amazon.com/prescriptive-guidance/latest/implementing-logging-monitoring-cloudwatch/kubernetes-eks-logging.html).

To do so, you can install the Amazon CloudWatch Observability EKS add-on in your cluster. More details in [this tutorial](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Container-Insights-setup-EKS-addon.html).

After you have Container Insights set up, you can view the container logs using the Logs Insights or Live Tail views. The log group in which all containers logs are gathered is named as follows by CloudWatch: `/aws/containerinsights/<ClusterName>/application`.
The following is an example query to get the logs coming from the Backstage instance:

```
fields @timestamp, @message, kubernetes.container_name
| filter kubernetes.container_name in ["install-dynamic-plugins", "backstage-backend"]
```

![AWS CloudWatch Logs](./images/aws-eks-cloudwatch-logs.png)

## Monitoring with [Amazon Prometheus](https://aws.amazon.com/prometheus/)

As depicted in [Setting up Metrics Monitoring and Logging for Backstage Showcase](monitoring-and-logging.md#setting-up-metrics-monitoring-and-logging-for-backstage-showcase), the Backstage Showcase exposes Prometheus metrics about the running application.
See [this tutorial](https://docs.aws.amazon.com/eks/latest/userguide/prometheus.html) on how to turn on or deploy Prometheus for EKS clusters.
Additionally, you will need to [create an Amazon Managed Service for Prometheus workspace](https://docs.aws.amazon.com/prometheus/latest/userguide/AMP-onboard-create-workspace.html), and [set up the ingestion](https://docs.aws.amazon.com/prometheus/latest/userguide/AMP-onboard-ingest-metrics.html) of the Backstage Prometheus metrics.

Once this is done, we can configure the metrics scraping to scrap from pods based on pod annotations.

### Configuration

The steps to add the Prometheus annotations for Helm and Operator-backed deployments are the same depicted in [Enabling Metrics Monitoring](monitoring-and-logging.md#enabling-metrics-monitoring-on-azure-kubernetes-service-aks).

### Verification

As described [here](https://docs.aws.amazon.com/eks/latest/userguide/prometheus.html#deploy-prometheus), one way to verify if scraping works correctly is by:

1. using `kubectl` to port-forward the Prometheus console to your local machine:

```bash
$ kubectl --namespace=prometheus port-forward deploy/prometheus-server 9090
```

2. pointing your web browser to http://localhost:9090 to view the Prometheus,
3. and monitoring any relevant metrics like `process_cpu_user_seconds_total`:

![Backstage Metrics from the Prometheus Console](./images/aws-eks-prometheus-console.png)

<!-- ## Using AWS Auth Provider

TODO -->
