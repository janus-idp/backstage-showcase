import { type Entity } from '@backstage/catalog-model';
import {
  EntityAzurePullRequestsContent,
  isAzureDevOpsAvailable,
} from '@backstage/plugin-azure-devops';
import { EntitySwitch } from '@backstage/plugin-catalog';
import {
  EntityGitlabMergeRequestsTable,
  isGitlabAvailable,
} from '@immobiliarelabs/backstage-plugin-gitlab';
import Grid from '@mui/material/Grid';
import {
  EntityGithubPullRequestsContent,
  isGithubPullRequestsAvailable,
} from '@roadiehq/backstage-plugin-github-pull-requests';
import React from 'react';

const ifPRs: ((e: Entity) => boolean)[] = [
  isGithubPullRequestsAvailable,
  isGitlabAvailable,
  isAzureDevOpsAvailable,
];

export const isPRsAvailable = (e: Entity) => ifPRs.some(f => f(e));

export const prContent = (
  <Grid container spacing={3}>
    <EntitySwitch>
      <EntitySwitch.Case if={isGitlabAvailable}>
        <Grid item xs={12}>
          <EntityGitlabMergeRequestsTable />
        </Grid>
      </EntitySwitch.Case>

      <EntitySwitch.Case if={isAzureDevOpsAvailable}>
        <Grid item xs={12}>
          <EntityAzurePullRequestsContent defaultLimit={25} />
        </Grid>
      </EntitySwitch.Case>

      <EntitySwitch.Case if={isGithubPullRequestsAvailable}>
        <Grid item xs={12}>
          <EntityGithubPullRequestsContent />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </Grid>
);
