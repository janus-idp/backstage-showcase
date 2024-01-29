import { InfoCard as BSInfoCard } from '@backstage/core-components';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import React from 'react';
import buildMetadata from '../../build-metadata.json';

export const infoCard = (
  <BSInfoCard title={buildMetadata.title}>
    <Grid container spacing={1}>
      {buildMetadata.card.map(text => (
        <Grid item xs={12} key={text}>
          <Typography variant="subtitle1" gutterBottom>
            {text}
          </Typography>
        </Grid>
      ))}
    </Grid>
  </BSInfoCard>
);
