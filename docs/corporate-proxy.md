# Running the Showcase application behind a corporate proxy

Out of the box, the Showcase application can be run behind a corporate proxy, by setting any of the following environment variables prior to starting the application:

- `HTTP_PROXY`: Proxy to use for HTTP requests.
- `HTTPS_PROXY`: Proxy to use for HTTPS requests.

Additionally, you can set the `NO_PROXY` environment variable to exclude certain domains from proxying. The value is a comma-separated list of hostnames that do not require a proxy to get reached, even if one is specified.

## Helm deployment

You can set the proxy information in your Helm `values` file, like so:

```yaml
upstream:
  backstage:
    extraEnvVars:
      # Proxy to use for HTTP requests
      - name: HTTP_PROXY
        value: '<my_http_proxy_url>'
      # Proxy to use for HTTPS requests
      - name: HTTPS_PROXY
        value: '<my_https_proxy_url>'
      - name: NO_PROXY
        # List of comma-separated URLs that should be excluded from proxying.
        # Example: 'foo.com,baz.com'
        value: '<my_no_proxy_settings>'
```

<details>
<summary>Example</summary>

```yaml
# --- Truncated ---
upstream:
  backstage:
    extraEnvVars:
      - name: HTTP_PROXY
        value: 'http://10.10.10.105:3128'
      - name: HTTPS_PROXY
        value: 'http://10.10.10.106:3128'
      - name: NO_PROXY
        value: 'localhost,example.org'
```

</details>

## Operator deployment

You can set the proxy information in your Custom Resource, like so:

```yaml
spec:
  application:
    extraEnvs:
      envs:
        # Proxy to use for HTTP requests
        - name: HTTP_PROXY
          value: '<my_http_proxy_url>'
        # Proxy to use for HTTPS requests
        - name: HTTPS_PROXY
          value: '<my_https_proxy_url>'
        - name: NO_PROXY
          # List of comma-separated URLs that should be excluded from proxying.
          # Example: 'foo.com,baz.com'
          value: '<my_no_proxy_settings>'
```

<details>
<summary>Example</summary>

```yaml
spec:
  # --- Truncated ---
  application:
    extraEnvs:
      envs:
        - name: HTTP_PROXY
          value: 'http://10.10.10.105:3128'
        - name: HTTPS_PROXY
          value: 'http://10.10.10.106:3128'
        - name: NO_PROXY
          value: 'localhost,example.org'
```

</details>

**NOTE**: Instead of specifying the proxy settings in each Custom Resource, you can edit the Operator default configuration once. To do so, look for a `ConfigMap` named `backstage-default-config` in the namespace where the Operator is deployed (typically `backstage-system` or `rhdh-operator`). Then edit the `deployment.yaml` key by adding the `HTTP(S)_PROXY` and `NO_PROXY` environment variables to the containers listed in this Deployment spec.
