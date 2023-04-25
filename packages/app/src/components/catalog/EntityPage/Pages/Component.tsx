import {
  EntityConsumedApisCard,
  EntityProvidedApisCard,
} from '@backstage/plugin-api-docs';
import {
  EntityLayout,
  EntitySwitch,
  isComponentType,
} from '@backstage/plugin-catalog';
import { EntityKubernetesContent } from '@backstage/plugin-kubernetes';
import { QuayPage, isQuayAvailable } from '@janus-idp/backstage-plugin-quay';
import { TopologyPage } from '@janus-idp/backstage-plugin-topology';
import { Grid } from '@material-ui/core';
import React from 'react';
import { defaultEntityPage } from './DefaultEntity';
import {
  OverviewContent,
  CicdContent,
  DependenciesContent,
  GithubIssuesContent,
  githubPRContent,
  SecurityContent,
  TechdocsContent,
} from '../Content';

const componentEntityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <OverviewContent />
    </EntityLayout.Route>
    <EntityLayout.Route path="/github-issues" title="GitHub Issues">
      <GithubIssuesContent />
    </EntityLayout.Route>

    <EntityLayout.Route path="/github-pr" title="GitHub Pull Requests">
      {githubPRContent}
    </EntityLayout.Route>

    <EntityLayout.Route path="/ci-cd" title="CI/CD">
      <CicdContent />
    </EntityLayout.Route>

    <EntityLayout.Route path="/kubernetes" title="Kubernetes">
      <EntityKubernetesContent refreshIntervalMs={30000} />
    </EntityLayout.Route>

    <EntityLayout.Route path="/topology" title="Topology">
      <TopologyPage />
    </EntityLayout.Route>

    <EntityLayout.Route if={isQuayAvailable} path="/quay" title="Quay">
      <QuayPage />
    </EntityLayout.Route>

    <EntityLayout.Route path="/security-insights" title="Security Insights">
      <SecurityContent />
    </EntityLayout.Route>

    {false && (
      <EntityLayout.Route path="/api" title="API">
        <Grid container spacing={3} alignItems="stretch">
          <Grid item md={6}>
            <EntityProvidedApisCard />
          </Grid>
          <Grid item md={6}>
            <EntityConsumedApisCard />
          </Grid>
        </Grid>
      </EntityLayout.Route>
    )}

    <EntityLayout.Route path="/dependencies" title="Dependencies">
      <DependenciesContent />
    </EntityLayout.Route>

    <EntityLayout.Route path="/docs" title="Docs">
      <TechdocsContent />
    </EntityLayout.Route>
  </EntityLayout>
);

/**
 * NOTE: This page is designed to work on small screens such as mobile devices.
 * This is based on Material UI Grid. If breakpoints are used, each grid item must set the `xs` prop to a column size or to `true`,
 * since this does not default. If no breakpoints are used, the items will equitably share the available space.
 * https://material-ui.com/components/grid/#basic-grid.
 */

export const componentPage = (
  <EntitySwitch>
    <EntitySwitch.Case if={isComponentType('service')}>
      {componentEntityPage}
    </EntitySwitch.Case>

    <EntitySwitch.Case if={isComponentType('website')}>
      {componentEntityPage}
    </EntitySwitch.Case>

    <EntitySwitch.Case>{defaultEntityPage}</EntitySwitch.Case>
  </EntitySwitch>
);
