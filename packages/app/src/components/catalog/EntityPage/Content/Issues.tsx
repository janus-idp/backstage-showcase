import { Entity } from '@backstage/catalog-model';
import { EntitySwitch } from '@backstage/plugin-catalog';
import { GithubIssuesCard } from '@backstage/plugin-github-issues';
import {
  EntityGitlabIssuesTable,
  isGitlabAvailable,
} from '@immobiliarelabs/backstage-plugin-gitlab';
import { Grid } from '@material-ui/core';
import { isGithubPullRequestsAvailable } from '@roadiehq/backstage-plugin-github-pull-requests';
import React from 'react';

const ifIssues: ((e: Entity) => boolean)[] = [
  isGithubPullRequestsAvailable,
  isGitlabAvailable,
];

export const isIssuesAvailable = (e: Entity) => ifIssues.some(f => f(e));

export const areAllIssuesAvailable = (e: Entity) => ifIssues.every(f => f(e));

export const issuesContent = (
  <Grid container spacing={3} justifyContent="space-evenly">
    <EntitySwitch>
      <EntitySwitch.Case if={areAllIssuesAvailable}>
        <Grid item xs={12}>
          <GithubIssuesCard />
        </Grid>
        <Grid item xs={12}>
          <EntityGitlabIssuesTable />
        </Grid>
      </EntitySwitch.Case>

      <EntitySwitch.Case if={isGithubPullRequestsAvailable}>
        <Grid item xs={12}>
          <GithubIssuesCard />
        </Grid>
      </EntitySwitch.Case>

      <EntitySwitch.Case if={isGitlabAvailable}>
        <Grid item xs={12}>
          <EntityGitlabIssuesTable />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </Grid>
);
