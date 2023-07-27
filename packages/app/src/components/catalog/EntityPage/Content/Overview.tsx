import { EmptyState } from '@backstage/core-components';
import {
  EntityAboutCard,
  EntityLinksCard,
  EntitySwitch,
} from '@backstage/plugin-catalog';
import Grid from '@mui/material/Grid';
import React from 'react';

import {
  EntityLatestJenkinsRunCard,
  isJenkinsAvailable,
} from '@backstage/plugin-jenkins';
import { EntitySonarQubeCard } from '@backstage/plugin-sonarqube';
import { isSonarQubeAvailable } from '@backstage/plugin-sonarqube-react';
import {
  EntityGitlabMergeRequestStatsCard,
  isGitlabAvailable,
} from '@immobiliarelabs/backstage-plugin-gitlab';
import { EntityArgoCDOverviewCard } from '@roadiehq/backstage-plugin-argo-cd';
import {
  EntityGithubInsightsComplianceCard,
  isGithubInsightsAvailable,
} from '@roadiehq/backstage-plugin-github-insights';
import {
  EntityGithubPullRequestsOverviewCard,
  isGithubPullRequestsAvailable,
} from '@roadiehq/backstage-plugin-github-pull-requests';
import {
  EntityDependabotAlertsCard,
  isSecurityInsightsAvailable,
} from '@roadiehq/backstage-plugin-security-insights';
import {
  isPluginApplicableToEntity as isPagerDutyAvailable,
  EntityPagerDutyCard,
} from '@backstage/plugin-pagerduty';
import {
  EntityLastLighthouseAuditCard,
  isLighthouseAvailable,
} from '@backstage/plugin-lighthouse';
import { isCIsAvailable } from './CI';
import { entityWarningContent } from './EntityWarning';
import { isPRsAvailable } from './PullRequests';

export const overviewContent = (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      {entityWarningContent}
    </Grid>

    <Grid item container spacing={3} xs={12} md={6} lg={4} direction="column">
      <Grid item>
        <EntityLinksCard />
      </Grid>

      <Grid item>
        <EntityAboutCard />
      </Grid>
    </Grid>

    <Grid item container spacing={3} xs={12} md={6} lg={4} direction="column">
      <EntitySwitch>
        <EntitySwitch.Case if={isGithubPullRequestsAvailable}>
          <Grid item>
            <EntityGithubPullRequestsOverviewCard />
          </Grid>
        </EntitySwitch.Case>

        <EntitySwitch.Case if={isGithubInsightsAvailable}>
          <Grid item>
            <EntityGithubInsightsComplianceCard />
          </Grid>
        </EntitySwitch.Case>

        <EntitySwitch.Case if={isGitlabAvailable}>
          <Grid item>
            <EntityGitlabMergeRequestStatsCard />
          </Grid>
        </EntitySwitch.Case>

        <EntitySwitch.Case if={e => !isPRsAvailable(e)}>
          <EmptyState
            title="A Git repository was not found for this entity"
            missing="info"
          />
        </EntitySwitch.Case>
      </EntitySwitch>
    </Grid>

    <Grid item container spacing={3} xs={12} md={6} lg={4} direction="column">
      <EntitySwitch>
        <EntitySwitch.Case if={isSonarQubeAvailable}>
          <Grid item>
            <EntitySonarQubeCard variant="gridItem" />
          </Grid>
        </EntitySwitch.Case>

        <EntitySwitch.Case if={isSecurityInsightsAvailable}>
          <Grid item>
            <EntityDependabotAlertsCard />
          </Grid>
        </EntitySwitch.Case>
      </EntitySwitch>
    </Grid>

    <Grid item container xs={8}>
      {/* Use `isArgocdAvailable` once its fixed */}
      <EntitySwitch>
        <EntitySwitch.Case if={isCIsAvailable}>
          <Grid item xs={12}>
            <EntityArgoCDOverviewCard />
          </Grid>
        </EntitySwitch.Case>

        <EntitySwitch.Case if={isJenkinsAvailable}>
          <Grid item xs={12}>
            <EntityLatestJenkinsRunCard branch="main,master" />
          </Grid>
        </EntitySwitch.Case>
      </EntitySwitch>
    </Grid>
    <Grid item container xs={4}>
      &nbsp;
    </Grid>
    <Grid container spacing={3} alignItems="stretch">
      <EntitySwitch>
        <EntitySwitch.Case if={isLighthouseAvailable}>
          <Grid item md={6}>
            <EntityLastLighthouseAuditCard />
          </Grid>
        </EntitySwitch.Case>
      </EntitySwitch>
      <EntitySwitch>
        <EntitySwitch.Case if={isPagerDutyAvailable}>
          <Grid item md={6}>
            <EntityPagerDutyCard />
          </Grid>
        </EntitySwitch.Case>
      </EntitySwitch>
    </Grid>
  </Grid>
);
