import React from 'react';

import { Entity } from '@backstage/catalog-model';
import { EntitySwitch } from '@backstage/plugin-catalog';

import { Grid } from '@mui/material';

import {
  isJfrogArtifactoryAvailable,
  JfrogArtifactoryPage,
} from '@janus-idp/backstage-plugin-jfrog-artifactory';
import { isQuayAvailable, QuayPage } from '@janus-idp/backstage-plugin-quay';

const ifImageRegistries: ((e: Entity) => boolean)[] = [
  isQuayAvailable,
  isJfrogArtifactoryAvailable,
];

export const isImageRegistriesAvailable = (e: Entity) =>
  ifImageRegistries.some(f => f(e));

export const imageRegistry = (
  <Grid container spacing={3} justifyContent="space-evenly">
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
