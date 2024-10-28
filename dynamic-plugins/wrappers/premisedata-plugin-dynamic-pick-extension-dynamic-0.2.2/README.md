# dynamic-pick-extension

Welcome to the dynamic-pick-extension plugin! This plugin is a [Custom Field Extension](https://backstage.io/docs/features/software-templates/writing-custom-field-extensions) that allow you to create `<Select>` components that fetches data dynamically from an endpoint. This can be used together with the `form-data-backend` plugin to write custom logic to fill the field.

## Installation

Read on how to install packages from GitHub Packages https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#installing-a-package

```
cd packages/app/
yarn add @premise/plugin-dynamic-pick-extension
```

## Configuration

Add the import to your `packages/app/src/App.tsx` on the frontend package of your backstage instance:

```js
import { DynamicPickFieldExtension } from '@premise/plugin-dynamic-pick-extension';
import { ScaffolderFieldExtensions } from '@backstage/plugin-scaffolder-react';
```

Then add the imported field extension as a child of `ScaffolderFieldExtensions` inside `Route`

```js
<Route path="/create" element={<ScaffolderPage />}>
  <ScaffolderFieldExtensions>
    <DynamicPickFieldExtension />
  </ScaffolderFieldExtensions>
</Route>
```

You should now see the custom filed `DynamicPickExtension` clicking "Custom field explored" here `http://localhost:3000/create/edit`.

## Usage

To use the extension on a [Backstage Template Action](https://backstage.io/docs/features/software-templates/writing-templates) just add the `ui-field` and `ui-options` fields to the parameter

### Basic usage:

```yaml
parameters:
  - category:
      title: Category
      type: string
      ui:field: DynamicPickExtension
      ui:options:
        # IMPORTANT: The endpoint needs to return a JSON array of strings.
        external_data: https://dummyjson.com/products/categories
```

### Using the `form-data-backend` plugin:

```yaml
parameters:
  - team:
      title: Github Team to add as admin of the repository
      type: string
      ui:field: DynamicPickExtension
      ui:options:
        # This is a provider added on the form-data-backend plugin
        form_data: github/teams
```

### Options

`no_options_text``: string - Text to show when no options are available - Default: "No options"

```yaml
parameters:
  - team:
      title: Github Team to add as admin of the repository
      type: string
      ui:field: DynamicPickExtension
      ui:options:
        # This is a provider added on the form-data-backend plugin
        form_data: github/teams
        no_options_text: 'No teams available'
```
