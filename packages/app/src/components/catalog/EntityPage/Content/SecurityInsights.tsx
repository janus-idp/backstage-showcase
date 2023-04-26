import { Grid } from '@material-ui/core';
import {
  EntityGithubDependabotContent,
  EntitySecurityInsightsContent,
} from '@roadiehq/backstage-plugin-security-insights';
import React from 'react';

export const securityContent = (
  <Grid container spacing={3} justifyContent="space-evenly">
    <Grid item xs={12}>
      <EntityGithubDependabotContent />
    </Grid>
    <Grid item xs={12}>
      <EntitySecurityInsightsContent />
    </Grid>
  </Grid>
);
