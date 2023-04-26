import { Entity } from '@backstage/catalog-model';
import { EntitySwitch } from '@backstage/plugin-catalog';
import {
  EntityGitlabMergeRequestsTable,
  isGitlabAvailable,
} from '@immobiliarelabs/backstage-plugin-gitlab';
import { Grid } from '@material-ui/core';
import {
  EntityGithubPullRequestsContent,
  isGithubPullRequestsAvailable,
} from '@roadiehq/backstage-plugin-github-pull-requests';
import React from 'react';

const ifPrs: ((e: Entity) => boolean)[] = [
  isGithubPullRequestsAvailable,
  isGitlabAvailable,
];

export const isPrsAvailable = (e: Entity) => ifPrs.some(f => f(e));

export const areAllPrsAvailable = (e: Entity) => ifPrs.every(f => f(e));

export const prContent = (
  <Grid container spacing={3} justifyContent="space-evenly">
    <EntitySwitch>
      <EntitySwitch.Case if={areAllPrsAvailable}>
        <Grid item xs={12}>
          <EntityGithubPullRequestsContent />
        </Grid>
        <Grid item xs={12}>
          <EntityGitlabMergeRequestsTable />
        </Grid>
      </EntitySwitch.Case>

      <EntitySwitch.Case if={isGithubPullRequestsAvailable}>
        <Grid item xs={12}>
          <EntityGithubPullRequestsContent />
        </Grid>
      </EntitySwitch.Case>

      <EntitySwitch.Case if={isGitlabAvailable}>
        <Grid item xs={12}>
          <EntityGitlabMergeRequestsTable />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </Grid>
);
