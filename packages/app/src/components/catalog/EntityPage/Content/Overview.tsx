import {
  EntityAboutCard,
  EntityLinksCard,
  EntitySwitch,
} from '@backstage/plugin-catalog';
import { Grid } from '@material-ui/core';
import React from 'react';

import { EntitySonarQubeCard } from '@backstage/plugin-sonarqube';
import { EntityArgoCDOverviewCard } from '@roadiehq/backstage-plugin-argo-cd';
import {
  EntityGithubInsightsComplianceCard,
  isGithubInsightsAvailable,
} from '@roadiehq/backstage-plugin-github-insights';
import { EntityGithubPullRequestsOverviewCard } from '@roadiehq/backstage-plugin-github-pull-requests';
import {
  EntityDependabotAlertsCard,
  EntitySecurityInsightsCard,
} from '@roadiehq/backstage-plugin-security-insights';
import { EntityWarningContent } from './EntityWarning';

export const OverviewContent = () => (
  <Grid container spacing={3} alignItems="stretch">
    <EntityWarningContent />

    <Grid item xs={12} md={12} container spacing={3} alignItems="stretch">
      <Grid item xs={12} md={4}>
        <EntityLinksCard />
        <div style={{ marginBottom: '24px' }} />
        <EntityAboutCard />
      </Grid>

      <Grid item xs={12} md={4}>
        <EntityDependabotAlertsCard />
        <EntitySecurityInsightsCard />
      </Grid>

      <Grid item xs={12} md={4}>
        <EntityGithubPullRequestsOverviewCard />
        <EntitySwitch>
          <EntitySwitch.Case if={isGithubInsightsAvailable}>
            <EntityGithubInsightsComplianceCard />
          </EntitySwitch.Case>
        </EntitySwitch>
      </Grid>
    </Grid>

    <Grid item xs={12} md={12} container spacing={3} alignItems="stretch">
      <Grid item md={4}>
        <EntitySonarQubeCard variant="gridItem" />
      </Grid>

      <Grid item xs={12} md={8}>
        <EntityArgoCDOverviewCard />
      </Grid>
    </Grid>
  </Grid>
);
