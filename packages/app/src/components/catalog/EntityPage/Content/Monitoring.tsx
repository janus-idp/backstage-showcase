import { type Entity } from '@backstage/catalog-model';
import { EntitySwitch } from '@backstage/plugin-catalog';
import { Grid } from '@mui/material';
import {
  DynatraceTab,
  isDynatraceAvailable,
} from '@backstage/plugin-dynatrace';
import React from 'react';

const ifMonitoring: ((e: Entity) => boolean)[] = [isDynatraceAvailable];

export const isMonitoringAvailable = (e: Entity) =>
  ifMonitoring.some(f => f(e));

export const monitoringContent = (
  <Grid container spacing={3}>
    <EntitySwitch>
      <EntitySwitch.Case if={isDynatraceAvailable}>
        <Grid item>
          <DynatraceTab />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </Grid>
);
