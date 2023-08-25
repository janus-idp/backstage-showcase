import Grid from '@mui/material/Grid';
import {
  EntityGithubDependabotContent,
  EntitySecurityInsightsContent,
} from '@roadiehq/backstage-plugin-security-insights';
import React from 'react';

export const securityContent = (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <EntityGithubDependabotContent />
    </Grid>
    <Grid item xs={12}>
      <EntitySecurityInsightsContent />
    </Grid>
  </Grid>
);
