import { type Entity } from '@backstage/catalog-model';
import { EntitySwitch } from '@backstage/plugin-catalog';
import {
  JfrogArtifactoryPage,
  isJfrogArtifactoryAvailable,
} from '@janus-idp/backstage-plugin-jfrog-artifactory';
import { QuayPage, isQuayAvailable } from '@janus-idp/backstage-plugin-quay';
import { Grid } from '@mui/material';
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

      <EntitySwitch.Case if={isJfrogArtifactoryAvailable}>
        <Grid item xs={12}>
          <JfrogArtifactoryPage />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </Grid>
);
