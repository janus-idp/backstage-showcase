---
'app': major
---

Use dynamic frontend plugins across the app:

1. Dynamic routes support home `/` override. You can define additional routes via `dynamicPlugins.frontend.dynamicRoutes` - these can't already exists in the app with 1 exception - `/`. This allows you to override the home page with your own plugin/component.

2. This change makes `dynamicPlugins.frontend.mountPoints` generic and declarative:

   Mountpoint now support following names/types:

   - Allow passing `*/context` mountpoints for React context
   - Allow passing `*/cards` for Card components (with layout)

   Mountpoint configs:

   - `entity.page.overview`
   - `entity.page.topology`
   - `entity.page.issues`
   - `entity.page.pull-requests`
   - `entity.page.ci`
   - `entity.page.cd`
   - `entity.page.kubernetes`
   - `entity.page.tekton`
   - `entity.page.image-registry`
   - `entity.page.monitoring`
   - `entity.page.lighthouse`
   - `entity.page.api`
   - `entity.page.dependencies`
   - `entity.page.docs`
   - `entity.page.definition`
   - `entity.page.diagram`

   Mountpoints support following configuration:

   - `layout` for layout features that propagates to <Box sx=... /> allowing users to use CSS properties gridColumnStart including responsiveness queries etc. (mui.com/system/ getting-started/the-sx-prop)
   - `if` for EntitySwitch.Case if=... - allows allOf|anyOf|oneOf conditionals with isKind|isType|hasAnnotation builtin methods or code imports via Scalprum (direct string reference)
   - `props` to pass additional props to the mounted component

   Current limitations of the dynamic frontend plugins:

   Allows you to mount to existing mountPoints only. You're unable to create additional tabs for example. (will be addressed in a follow up PR)
