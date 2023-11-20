---
'app': minor
---

Instead of embedding all MUI4 icons into the bundle, we can depend in app.getSystemIcon() icon catalog. This PR allows users to extend it via dynamic plugins and therefore cleanup our bundle of unnecessary icons.
