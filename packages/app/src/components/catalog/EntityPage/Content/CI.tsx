import { Entity } from '@backstage/catalog-model';
import {
  EntityAzurePipelinesContent,
  isAzureDevOpsAvailable,
} from '@backstage/plugin-azure-devops';
import { EntitySwitch } from '@backstage/plugin-catalog';
import {
  EntityGithubActionsContent,
  isGithubActionsAvailable,
} from '@backstage/plugin-github-actions';
import {
  EntityGitlabMergeRequestsTable,
  isGitlabAvailable,
} from '@immobiliarelabs/backstage-plugin-gitlab';
import {
  LatestPipelineRun,
  isTektonCIAvailable,
} from '@janus-idp/backstage-plugin-tekton';
import { Grid } from '@mui/material';
import React from 'react';

const ifCIs: ((e: Entity) => boolean)[] = [
  isGithubActionsAvailable,
  isGitlabAvailable,
  isTektonCIAvailable,
  isAzureDevOpsAvailable,
];

export const isCIsAvailable = (e: Entity) => ifCIs.some(f => f(e));

export const ciContent = (
  <Grid container spacing={3} justifyContent="space-evenly">
    <EntitySwitch>
      <EntitySwitch.Case if={isGitlabAvailable}>
        <Grid item xs={12}>
          <EntityGitlabMergeRequestsTable />
        </Grid>
      </EntitySwitch.Case>

      <EntitySwitch.Case if={isTektonCIAvailable}>
        <Grid item xs={12}>
          <LatestPipelineRun linkTekton />
        </Grid>
      </EntitySwitch.Case>

      <EntitySwitch.Case if={isAzureDevOpsAvailable}>
        <Grid item xs={12}>
          <EntityAzurePipelinesContent defaultLimit={25} />
        </Grid>
      </EntitySwitch.Case>

      <EntitySwitch.Case if={isGithubActionsAvailable}>
        <Grid item xs={12}>
          <EntityGithubActionsContent />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </Grid>
);
