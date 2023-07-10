import { type Entity } from '@backstage/catalog-model';
import { EntitySwitch } from '@backstage/plugin-catalog';
import { GithubIssuesCard } from '@backstage/plugin-github-issues';
import {
  EntityGitlabIssuesTable,
  isGitlabAvailable,
} from '@immobiliarelabs/backstage-plugin-gitlab';
import Grid from '@mui/material/Grid';
import { isGithubPullRequestsAvailable } from '@roadiehq/backstage-plugin-github-pull-requests';
import {
  EntityJiraOverviewCard,
  isJiraAvailable,
} from '@roadiehq/backstage-plugin-jira';
import React from 'react';

const ifIssues: ((e: Entity) => boolean)[] = [
  isGithubPullRequestsAvailable,
  isGitlabAvailable,
  isJiraAvailable,
];

export const isIssuesAvailable = (e: Entity) => ifIssues.some(f => f(e));

export const issuesContent = (
  <Grid container spacing={3}>
    <EntitySwitch>
      <EntitySwitch.Case if={isGitlabAvailable}>
        <Grid item xs={12}>
          <EntityGitlabIssuesTable />
        </Grid>
      </EntitySwitch.Case>

      <EntitySwitch.Case if={isJiraAvailable}>
        <Grid item xs={12}>
          <EntityJiraOverviewCard />
        </Grid>
      </EntitySwitch.Case>

      {/* TODO: update GithubIssuesCard if entity check once its available */}
      <EntitySwitch.Case if={isGithubPullRequestsAvailable}>
        <Grid item xs={12}>
          <GithubIssuesCard />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </Grid>
);
