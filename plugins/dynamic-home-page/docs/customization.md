# Customization

The dynamic home page allows admins to constomize the homepage in the `app-config`, and plugin authors to extend the home page with additional cards or content.

Additional cards can automatically appear based on installed and enabled plugins.

## Default home page

The default home page shows a Search input field, a "Quick Access" card, and a "Your Starred Entities" card by default.

![Default home page](default-homepage.png)

The customization can happen in any loaded `app-config` from the `dynamicPlugins` section.

The home page loads automatically a configuration like this, when no other configiration is passed:

```yaml
dynamicPlugins:
  frontend:
    janus-idp.backstage-plugin-dynamic-home-page:
      dynamicRoutes:
        - path: /
          importName: DynamicHomePage
      mountPoints:
        - mountPoint: home.page/cards
          importName: SearchBar
          config:
            layouts:
              xl: { w: 10, h: 1, x: 1 }
              lg: { w: 10, h: 1, x: 1 }
              md: { w: 10, h: 1, x: 1 }
              sm: { w: 10, h: 1, x: 1 }
              xs: { w: 12, h: 1 }
              xxs: { w: 12, h: 1 }
        - mountPoint: home.page/cards
          importName: QuickAccessCard
          config:
            layouts:
              xl: { w: 7, h: 8 }
              lg: { w: 7, h: 8 }
              md: { w: 7, h: 8 }
              sm: { w: 12, h: 8 }
              xs: { w: 12, h: 8 }
              xxs: { w: 12, h: 8 }
        - mountPoint: home.page/cards
          importName: CatalogStarredEntitiesCard
          config:
            layouts:
              xl: { w: 5, h: 4, x: 7 }
              lg: { w: 5, h: 4, x: 7 }
              md: { w: 5, h: 4, x: 7 }
              sm: { w: 12, h: 4 }
              xs: { w: 12, h: 4 }
              xxs: { w: 12, h: 4 }
```

## Adding cards from a plugin

Plugins can add additional cards/content by exporting a react component.

Each card can have a `layouts` definition and `props` that are depending on the used component like this:

```yaml
dynamicPlugins:
  frontend:
    janus-idp.backstage-plugin-dynamic-home-page:
      mountPoints:
        - mountPoint: home.page/cards
          importName: Headline
          config:
            layouts:
              xl: { h: 1 }
              lg: { h: 1 }
              md: { h: 1 }
              sm: { h: 1 }
              xs: { h: 1 }
              xxs: { h: 1 }
            props:
              title: Important info
```
