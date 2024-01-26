import { InfoCard as BSInfoCard } from '@backstage/core-components';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import React from 'react';
import rhdhSettings from '../../rhdh.json';

export const infoCard = (
  <BSInfoCard title="Backstage Metadata">
    <Grid container spacing={1}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          RHDH Version: {rhdhSettings.rhdhVersion}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="subtitle1">
          Backstage Version: {rhdhSettings.backstageVersion}
        </Typography>
      </Grid>
    </Grid>
  </BSInfoCard>
);
