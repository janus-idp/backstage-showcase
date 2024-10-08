# Create a new card

Any plugin can add additional cards/content by exporting a react component.

Cards commonly uses the [InfoCard](https://backstage.io/storybook/?path=/story/layout-information-card--default) component from `@backstage/core-components`.

1. Create and export a new react component:

   ```tsx
   import React from 'react';

   import { InfoCard, MarkdownContent } from '@backstage/core-components';

   export interface MarkdownCardProps {
     title?: string;
     content?: string;
   }

   export const MarkdownCard = (props: MarkdownCardProps) => {
     return (
       <InfoCard title={props.title}>
         <MarkdownContent dialect="gfm" content={props.content ?? ''} />
       </InfoCard>
     );
   };
   ```

2. Export the card in your `plugin.ts`:

   ```tsx
   export const Markdown = dynamicHomePagePlugin.provide(
     createComponentExtension({
       name: 'Markdown',
       component: {
         lazy: () => import('./components/Markdown').then(m => m.Markdown),
       },
     }),
   );
   ```

3. And finally, users can add them to their `app-config` to expose the component as mount point `home.page/cards`:

   ```yaml
   dynamicPlugins:
     frontend:
       your-plugin-id:
         mountPoints:
           - mountPoint: home.page/cards
             importName: YourHomePageCard
             config:
               layout: ...
               props: ...
   ```
