import { Grid } from '@material-ui/core';
import React from 'react';

import {
  EntityGithubDependabotContent,
  EntitySecurityInsightsContent,
} from '@roadiehq/backstage-plugin-security-insights';

export const SecurityContent = () => (
  <Grid container spacing={3} alignItems="stretch">
    <Grid item md={12} xs={12}>
      <EntityGithubDependabotContent />
    </Grid>
    <Grid item md={12} xs={12}>
      <EntitySecurityInsightsContent />
    </Grid>
  </Grid>
);
