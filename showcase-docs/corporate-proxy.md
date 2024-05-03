# Running the Showcase application behind a corporate proxy

Out of the box, the Showcase application can be run behind a corporate proxy, by setting any of the following environment variables prior to starting the application:

- `HTTP_PROXY`: HTTP proxy to use.
- `HTTPS_PROXY`: distinct proxy to use for HTTPS requests.

Additionally, you can set the `NO_PROXY` environment variable to exclude certain domains from proxying. The value is a comma-separated list of hostnames that do not require a proxy to get reached, even if one is specified.

## Helm deployment

You can set the proxy information in your Helm `values` file, like so:

```yaml
upstream:
  backstage:
    extraEnvVars:
      - name: HTTP_PROXY
        # HTTP proxy to use
        value: '<my_http_proxy_url>'
      - name: HTTPS_PROXY
        # Distinct proxy to use for HTTPS requests
        value: '<my_https_proxy_url>'
      - name: NO_PROXY
        # Pattern of comma-separated URLs that should be excluded from proxying.
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
        - name: HTTP_PROXY
          # HTTP proxy to use
          value: '<my_http_proxy_url>'
        - name: HTTPS_PROXY
          # Distinct proxy to use for HTTPS requests
          value: '<my_https_proxy_url>'
        - name: NO_PROXY
          # Pattern of comma-separated URLs that should be excluded from proxying.
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

## Local development

If you are behind a corporate proxy and are running the Showcase locally, as depicted in [Running locally with a basic configuration](./getting-started.md#running-locally-with-a-basic-configuration) or [Running locally with the Optional Plugins](./getting-started.md#running-locally-with-the-optional-plugins), you will need to additionally set the `GLOBAL_AGENT_ENVIRONMENT_VARIABLE_NAMESPACE` to an empty value prior to running `yarn start`.

Example:

```shell
$ GLOBAL_AGENT_ENVIRONMENT_VARIABLE_NAMESPACE='' \
  HTTP_PROXY=http://10.10.10.105:3128 \
  HTTPS_PROXY=http://10.10.10.106:3128 \
  NO_PROXY='localhost,example.org' \
  yarn start
```
