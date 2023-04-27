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
  overviewContent,
  cicdContent,
  dependenciesContent,
  githubIssuesContent,
  githubPRContent,
  securityContent,
  techdocsContent,
} from '../Content';

const componentEntityPage = (componentType: 'service' | 'website') => (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      {overviewContent}
    </EntityLayout.Route>
    <EntityLayout.Route path="/github-issues" title="GitHub Issues">
      {githubIssuesContent}
    </EntityLayout.Route>

    <EntityLayout.Route path="/github-pr" title="GitHub Pull Requests">
      {githubPRContent}
    </EntityLayout.Route>

    <EntityLayout.Route path="/ci-cd" title="CI/CD">
      {cicdContent}
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
      {securityContent}
    </EntityLayout.Route>

    {componentType === 'service' && (
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
      {dependenciesContent}
    </EntityLayout.Route>

    <EntityLayout.Route path="/docs" title="Docs">
      {techdocsContent}
    </EntityLayout.Route>
  </EntityLayout>
);

export const componentPage = (
  <EntitySwitch>
    <EntitySwitch.Case if={isComponentType('service')}>
      {componentEntityPage('service')}
    </EntitySwitch.Case>

    <EntitySwitch.Case if={isComponentType('website')}>
      {componentEntityPage('website')}
    </EntitySwitch.Case>

    <EntitySwitch.Case>{defaultEntityPage}</EntitySwitch.Case>
  </EntitySwitch>
);
