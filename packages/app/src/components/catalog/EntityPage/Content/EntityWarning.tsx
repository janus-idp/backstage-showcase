import {
  EntityOrphanWarning,
  EntityProcessingErrorsPanel,
  EntitySwitch,
  hasCatalogProcessingErrors,
  isOrphan,
} from '@backstage/plugin-catalog';
import { Grid } from '@material-ui/core';
import React from 'react';

export const entityWarningContent = (
  <Grid container spacing={3} justifyContent="space-evenly">
    <EntitySwitch>
      <EntitySwitch.Case if={isOrphan}>
        <Grid item xs={12}>
          <EntityOrphanWarning />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>

    <EntitySwitch>
      <EntitySwitch.Case if={hasCatalogProcessingErrors}>
        <Grid item xs={12}>
          <EntityProcessingErrorsPanel />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </Grid>
);
