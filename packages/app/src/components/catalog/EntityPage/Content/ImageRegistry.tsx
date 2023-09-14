import { type Entity } from '@backstage/catalog-model';
import { EntitySwitch } from '@backstage/plugin-catalog';
import {
  JfrogArtifactoryPage,
  isJfrogArtifactoryAvailable,
} from '@janus-idp/backstage-plugin-jfrog-artifactory';
import { QuayPage, isQuayAvailable } from '@janus-idp/backstage-plugin-quay';
import {
  isNexusRepositoryManagerAvailable,
  NexusRepositoryManagerPage,
} from '@janus-idp/backstage-plugin-nexus-repository-manager';
import Grid from '@mui/material/Grid';
import React from 'react';

const ifImageRegistries: ((e: Entity) => boolean)[] = [
  isQuayAvailable,
  isJfrogArtifactoryAvailable,
];

export const isImageRegistriesAvailable = (e: Entity) =>
  ifImageRegistries.some(f => f(e));

export const imageRegistry = (
  <Grid container spacing={3}>
    <EntitySwitch>
      <EntitySwitch.Case if={isQuayAvailable}>
        <Grid item xs={12}>
          <QuayPage />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
    <EntitySwitch>
      <EntitySwitch.Case if={isJfrogArtifactoryAvailable}>
        <Grid item xs={12}>
          <JfrogArtifactoryPage />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
    <EntitySwitch>
      <EntitySwitch.Case if={isNexusRepositoryManagerAvailable}>
        <Grid item xs={12}>
          <NexusRepositoryManagerPage />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </Grid>
);
