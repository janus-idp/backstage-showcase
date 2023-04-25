import {
  EntityConsumedApisCard,
  EntityProvidedApisCard,
} from '@backstage/plugin-api-docs';
import {
  EntityDependsOnComponentsCard,
  EntityDependsOnResourcesCard,
  EntityHasSubcomponentsCard,
} from '@backstage/plugin-catalog';
import {
  Direction,
  EntityCatalogGraphCard,
} from '@backstage/plugin-catalog-graph';
import { Grid } from '@material-ui/core';
import React from 'react';

export const DependenciesContent = () => (
  <Grid container spacing={3} alignItems="stretch">
    <Grid item xs={12} md={6}>
      <EntityCatalogGraphCard
        variant="gridItem"
        direction={Direction.TOP_BOTTOM}
        height={900}
      />
    </Grid>
    <Grid item xs={12} md={6} container spacing={3} alignItems="stretch">
      <Grid item xs={12}>
        <EntityDependsOnComponentsCard variant="gridItem" />
      </Grid>
      <Grid item xs={12}>
        <EntityDependsOnResourcesCard variant="gridItem" />
      </Grid>
      <Grid item xs={12}>
        <EntityHasSubcomponentsCard variant="gridItem" />
      </Grid>
      <Grid item xs={12}>
        <EntityProvidedApisCard />
      </Grid>
      <Grid item xs={12}>
        <EntityConsumedApisCard />
      </Grid>
    </Grid>
  </Grid>
);
