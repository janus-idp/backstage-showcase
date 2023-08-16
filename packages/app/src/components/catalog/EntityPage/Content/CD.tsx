import Grid from '@mui/material/Grid';
import { EntityArgoCDHistoryCard } from '@roadiehq/backstage-plugin-argo-cd';
import React from 'react';

export const cdContent = (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <EntityArgoCDHistoryCard />
    </Grid>
  </Grid>
);
