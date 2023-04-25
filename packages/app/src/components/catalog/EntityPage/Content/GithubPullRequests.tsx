import { EntitySwitch } from '@backstage/plugin-catalog';
import { Grid } from '@material-ui/core';
import React from 'react';

import {
  EntityGithubPullRequestsContent,
  isGithubPullRequestsAvailable,
} from '@roadiehq/backstage-plugin-github-pull-requests';

export const githubPRContent = (
  <Grid container spacing={3} alignItems="stretch">
    <EntitySwitch>
      <EntitySwitch.Case if={isGithubPullRequestsAvailable}>
        <Grid item md={12} xs={12}>
          <EntityGithubPullRequestsContent />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </Grid>
);
