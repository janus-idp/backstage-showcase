---
'app': patch
---

Add extra error handling while initializing dynamic front-end plugins. If a plugin fails to initialize, it won't be registered and won't be rendered at the expected place.
