---
'backend': major
'app': major
---

Update the proxy object to include the endpoint property in `app-config.yaml`

e.g.

```yaml
proxy:
  endpoints:
    # Plugin: Quay
    '/quay/api':
      target: https://quay.io/
      headers:
        X-Requested-With: 'XMLHttpRequest'
        # Uncomment the following line to access a private Quay Repository using a token
        # Authorization: 'Bearer <YOUR TOKEN>'
      changeOrigin: true
      secure: true
```
