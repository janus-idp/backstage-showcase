import { EntitySwitch } from '@backstage/plugin-catalog';
import Grid from '@mui/material/Grid';
import {
  EntityArgoCDHistoryCard,
  isArgocdAvailable,
} from '@roadiehq/backstage-plugin-argo-cd';
import React from 'react';

export const cdContent = (
  <Grid container spacing={3}>
    <EntitySwitch>
      <EntitySwitch.Case if={isArgocdAvailable}>
        <Grid item xs={12}>
          <EntityArgoCDHistoryCard />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </Grid>
);
