import {
  UserSettingsAppearanceCard,
  UserSettingsIdentityCard,
  UserSettingsProfileCard,
} from '@backstage/plugin-user-settings';
import Grid from '@mui/material/Grid';
import React from 'react';
import { infoCard } from './InfoCard';

export const generalPage = (
  <Grid container direction="row" spacing={3}>
    <Grid item xs={12} md={6}>
      <UserSettingsProfileCard />
    </Grid>
    <Grid item xs={12} md={6}>
      <UserSettingsAppearanceCard />
    </Grid>
    <Grid item xs={12} md={6}>
      <UserSettingsIdentityCard />
    </Grid>
    <Grid item xs={12} md={6}>
      {infoCard}
    </Grid>
  </Grid>
);
