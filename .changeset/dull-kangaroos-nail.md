---
'backend': patch
---

Fixed the ordering of the backend routers so that the `/metrics` and `/healthcheck` endpoints can be accessed in the image when the frontend and backend share the same baseUrl.
