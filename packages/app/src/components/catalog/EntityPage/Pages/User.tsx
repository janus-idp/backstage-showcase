import { EntityLayout } from '@backstage/plugin-catalog';
import {
  EntityOwnershipCard,
  EntityUserProfileCard,
} from '@backstage/plugin-org';
import { Grid } from '@material-ui/core';
import React from 'react';
import { EntityWarningContent } from '../Content/EntityWarning';

export const UserPage = () => (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3}>
        <EntityWarningContent />
        <Grid item xs={12} md={6}>
          <EntityUserProfileCard variant="gridItem" />
        </Grid>
        <Grid item xs={12} md={6}>
          <EntityOwnershipCard variant="gridItem" />
        </Grid>
      </Grid>
    </EntityLayout.Route>
  </EntityLayout>
);
