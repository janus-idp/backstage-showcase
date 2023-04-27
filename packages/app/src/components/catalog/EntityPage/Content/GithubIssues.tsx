import { Grid } from '@material-ui/core';
import React from 'react';

import { GithubIssuesCard } from '@backstage/plugin-github-issues';

export const githubIssuesContent = (
  <Grid container spacing={3} alignItems="stretch">
    <Grid item md={12} xs={12}>
      <GithubIssuesCard />
    </Grid>
  </Grid>
);
