import { type Entity } from '@backstage/catalog-model';
import { EntitySwitch } from '@backstage/plugin-catalog';
import Grid from '@mui/material/Grid';
import {
  EntityDatadogContent,
  isDatadogAvailable,
} from '@roadiehq/backstage-plugin-datadog';
import React from 'react';

const ifMonitoring: ((e: Entity) => boolean)[] = [isDatadogAvailable];

export const isMonitoringAvailable = (e: Entity) =>
  ifMonitoring.some(f => f(e));

export const monitoringContent = (
  <Grid container spacing={3}>
    <EntitySwitch>
      <EntitySwitch.Case if={isDatadogAvailable}>
        <Grid item xs={12}>
          <EntityDatadogContent />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </Grid>
);
