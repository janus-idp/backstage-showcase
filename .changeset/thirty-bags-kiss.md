---
'backend': patch
---

Fix a bug in the upstream CommonJSLoader, which prevented laoding modules from embedded node_modules folders of private packages located in the plugin node_modules folder.
