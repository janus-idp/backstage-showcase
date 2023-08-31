import {
  EntityApiDefinitionCard,
  EntityConsumingComponentsCard,
  EntityProvidingComponentsCard,
} from '@backstage/plugin-api-docs';
import {
  EntityAboutCard,
  EntityLayout,
  EntityLinksCard,
} from '@backstage/plugin-catalog';
import { EntityCatalogGraphCard } from '@backstage/plugin-catalog-graph';
import Grid from '@mui/material/Grid';
import React from 'react';
import { entityWarningContent } from '../Content/EntityWarning';

export const apiPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3} justifyContent="space-between">
        <Grid item xs={12}>
          {entityWarningContent}
        </Grid>

        <Grid
          item
          container
          spacing={3}
          xs={12}
          md={6}
          lg={4}
          direction="column"
        >
          <Grid item>
            <EntityAboutCard />
          </Grid>
          <Grid item>
            <EntityLinksCard />
          </Grid>
        </Grid>

        <Grid item md={6} xs={12}>
          <EntityCatalogGraphCard variant="gridItem" height={400} />
        </Grid>

        <Grid container item md={12}>
          <Grid item md={6}>
            <EntityProvidingComponentsCard />
          </Grid>
          <Grid item md={6}>
            <EntityConsumingComponentsCard />
          </Grid>
        </Grid>
      </Grid>
    </EntityLayout.Route>

    <EntityLayout.Route path="/definition" title="Definition">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <EntityApiDefinitionCard />
        </Grid>
      </Grid>
    </EntityLayout.Route>
  </EntityLayout>
);
