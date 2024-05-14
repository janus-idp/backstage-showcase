# Local development behind a corporate proxy

As mentioned in [Running the Showcase application behind a corporate proxy](../showcase-docs/corporate-proxy.md), the `HTTP(S)_PROXY` and `NO_PROXY` environment variables are supported.

If you are behind a corporate proxy and are running the Showcase locally, as depicted in [Running locally with a basic configuration](../showcase-docs/getting-started.md#running-locally-with-a-basic-configuration) or [Running locally with the Optional Plugins](../showcase-docs/getting-started.md#running-locally-with-the-optional-plugins), you will need to additionally set the `GLOBAL_AGENT_ENVIRONMENT_VARIABLE_NAMESPACE` to an empty value prior to running `yarn start`.

Example:

```shell
$ GLOBAL_AGENT_ENVIRONMENT_VARIABLE_NAMESPACE='' \
  HTTP_PROXY=http://localhost:3128 \
  HTTPS_PROXY=http://localhost:3128 \
  NO_PROXY='localhost,example.org' \
  yarn start
```

You can use the command below to quickly start a local corporate proxy server (based on [Squid](https://www.squid-cache.org/)):

```shell
podman container run --rm --name squid-container \
  -e TZ=UTC \
  -p 3128:3128 \
  -it docker.io/ubuntu/squid:latest
```

# Plugin vendors

The upstream Backstage project recommends the use of the `node-fetch` libraries in backend plugins for HTTP data fetching - see [ADR013](https://backstage.io/docs/architecture-decisions/adrs-adr013/).

We currently only support corporate proxy settings for Axios, `fetch` and `node-fetch` libraries. Backend plugins using any of these libraries have nothing special to do to support corporate proxies.

# Testing

The most challenging part of writing an end-to-end test from the context of a corporate proxy is to set up an environment where an application is forbidden access to the public Internet except through that proxy.

One possible approach is to simulate such an environment in a Kubernetes namespace with the help of [Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/) to control ingress and egress traffic for pods within that namespace.

To do so:

1. Make sure the network plugin in your Kubernetes cluster supports network policies. [k3d](https://k3d.io) for example supports Network Policies out of the box.

2. Create a separate proxy namespace, and deploy a [Squid](https://www.squid-cache.org/)-based proxy application there. The full URL to access the proxy server from within the cluster would be `http://squid-service.proxy.svc.cluster.local:3128`.

```shell
kubectl create namespace proxy

cat <<EOF | kubectl -n proxy apply -f -
apiVersion: v1
kind: Service
metadata:
  name: squid-service
  labels:
    app: squid
spec:
  ports:
  - port: 3128
  selector:
    app: squid

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: squid-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: "squid"
  template:
    metadata:
      labels:
        app: squid
    spec:
      containers:
      - name: squid
        image: docker.io/ubuntu/squid:latest
        ports:
        - containerPort: 3128
          name: squid
          protocol: TCP
EOF
```

3. Create the namespace where the Showcase application will be running, e.g.:

```shell
kubectl create namespace my-ns
```

4. Add the network policies in the namespace above. The first one denies all egress traffic except to the DNS resolver and the Squid proxy. The second one allows ingress and egress traffic in the same namespace, because the Showcase app pod needs to contact the local Database pod.

```shell
cat <<EOF | kubectl -n my-ns apply -f -
---
# Deny all egress traffic in this namespace => proxy settings can be used to overcome this.
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: default-deny-egress-with-exceptions
spec:
  podSelector: {}
  policyTypes:
  - Egress
  egress:
  # allow DNS resolution (we need this allowed, otherwise we won't be able to resolve the DNS name of the Squid proxy service)
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
      - port: 53
        protocol: UDP
      - port: 53
        protocol: TCP
  # allow traffic to Squid proxy
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: proxy
    ports:
    - port: 3128
      protocol: TCP

---
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: allow-same-namespace
spec:
  podSelector: {}
  ingress:
  - from:
    - podSelector: {}
  egress:
  - to:
    - podSelector: {}
EOF
```

5. Follow the instructions to add the proxy environment variables for an [Operator-based](../showcase-docs/corporate-proxy.md#operator-deployment) or [Helm-based](../showcase-docs/corporate-proxy.md#helm-deployment) deployment.

Example with a Custom Resource:

```yaml
apiVersion: rhdh.redhat.com/v1alpha1
kind: Backstage
metadata:
  name: my-rhdh
spec:
  application:
    # Support for Proxy settings added in PR 1225. Remove this once this PR is merged.
    # image: quay.io/janus-idp/backstage-showcase:pr-1225
    appConfig:
      configMaps:
        - name: app-config-rhdh
    dynamicPluginsConfigMapName: dynamic-plugins-rhdh
    extraEnvs:
      envs:
        - name: HTTP_PROXY
          value: 'http://squid-service.proxy.svc.cluster.local:3128'
        - name: HTTPS_PROXY
          value: 'http://squid-service.proxy.svc.cluster.local:3128'
        - name: NO_PROXY
          value: 'localhost'
        - name: ROARR_LOG
          # Logs from global-agent (to inspect proxy settings)
          value: 'true'
      secrets:
        - name: secrets-rhdh
# --- TRUNCATED ---
```
