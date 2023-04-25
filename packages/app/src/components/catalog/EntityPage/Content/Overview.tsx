import { EmptyState } from '@backstage/core-components';
import {
  EntityAboutCard,
  EntityLinksCard,
  EntitySwitch,
} from '@backstage/plugin-catalog';
import { Button, Grid } from '@material-ui/core';
import React from 'react';

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
  EntitySecurityInsightsCard,
  isSecurityInsightsAvailable,
} from '@roadiehq/backstage-plugin-security-insights';
import { isCIsAvailable } from './CI';
import { entityWarningContent } from './EntityWarning';
import {
  isJenkinsAvailable,
  EntityLatestJenkinsRunCard,
} from '@backstage/plugin-jenkins';

export const overviewContent = (
  <Grid container spacing={3} justifyContent="space-evenly">
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

    <EntitySwitch>
      <EntitySwitch.Case
        if={e =>
          isGithubPullRequestsAvailable(e) || isGithubInsightsAvailable(e)
        }
      >
        <Grid
          item
          container
          spacing={3}
          xs={12}
          md={6}
          lg={4}
          direction="column"
        >
          <EntitySwitch>
            <EntitySwitch.Case if={isGithubPullRequestsAvailable}>
              <Grid item>
                <EntityGithubPullRequestsOverviewCard />
              </Grid>
            </EntitySwitch.Case>
          </EntitySwitch>

          <EntitySwitch>
            <EntitySwitch.Case if={isGithubInsightsAvailable}>
              <Grid item>
                <EntityGithubInsightsComplianceCard />
              </Grid>
            </EntitySwitch.Case>
          </EntitySwitch>
        </Grid>
      </EntitySwitch.Case>

      <EntitySwitch.Case>
        <Grid
          item
          container
          spacing={3}
          xs={12}
          md={6}
          lg={4}
          direction="column"
        >
          <EmptyState
            title="GitHub was not used for this entity"
            missing="info"
            action={
              <Button
                variant="contained"
                color="primary"
                href="https://github.com/RoadieHQ/roadie-backstage-plugins/tree/main/plugins/frontend/backstage-plugin-github-pull-requests#widget-setup"
              >
                Example
              </Button>
            }
          />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>

    <EntitySwitch>
      <EntitySwitch.Case if={isGitlabAvailable}>
        <Grid
          item
          container
          spacing={3}
          xs={12}
          md={6}
          lg={4}
          direction="column"
        >
          <Grid item>
            <EntityGitlabMergeRequestStatsCard />
          </Grid>
        </Grid>
      </EntitySwitch.Case>

      <EntitySwitch.Case>
        <Grid
          item
          container
          spacing={3}
          xs={12}
          md={6}
          lg={4}
          direction="column"
        >
          <EmptyState
            title="GitLab was not used for this entity"
            missing="info"
            action={
              <Button
                variant="contained"
                color="primary"
                href="https://github.com/immobiliare/backstage-plugin-gitlab#screenshots"
              >
                Example
              </Button>
            }
          />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>

    <EntitySwitch>
      <EntitySwitch.Case if={isSecurityInsightsAvailable}>
        <Grid item xs={12} md={6} lg={4}>
          <EntityDependabotAlertsCard />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>

    <EntitySwitch>
      <EntitySwitch.Case if={isSecurityInsightsAvailable}>
        <Grid item xs={12} md={6} lg={4}>
          <EntitySecurityInsightsCard />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>

    <EntitySwitch>
      <EntitySwitch.Case if={isSonarQubeAvailable}>
        <Grid item xs={12} md={6} lg={4}>
          <EntitySonarQubeCard variant="gridItem" />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>

    {/* Use `isArgocdAvailable` once its fixed */}
    <EntitySwitch>
      <EntitySwitch.Case if={isCIsAvailable}>
        <Grid item xs={12}>
          <EntityArgoCDOverviewCard />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>

    <EntitySwitch>
      <EntitySwitch.Case if={isJenkinsAvailable}>
        <Grid item xs={12}>
          <EntityLatestJenkinsRunCard branch="main,master" />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </Grid>
);
