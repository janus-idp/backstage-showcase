import React from 'react';

import { Grid } from '@mui/material';
import { EntityArgoCDHistoryCard } from '@roadiehq/backstage-plugin-argo-cd';

export const cdContent = (
  <Grid container spacing={3} justifyContent="space-evenly">
    <Grid item xs={12}>
      <EntityArgoCDHistoryCard />
    </Grid>
  </Grid>
);
