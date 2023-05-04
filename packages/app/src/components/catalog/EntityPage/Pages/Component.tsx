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
import { TektonPage } from '@janus-idp/backstage-plugin-tekton';
import { QuayPage, isQuayAvailable } from '@janus-idp/backstage-plugin-quay';
import { TopologyPage } from '@janus-idp/backstage-plugin-topology';
import { Grid } from '@material-ui/core';
import React from 'react';
import { defaultEntityPage } from './DefaultEntity';
import {
  overviewContent,
  isCIsAvailable,
  ciContent,
  cdContent,
  dependenciesContent,
  isIssuesAvailable,
  issuesContent,
  isPrsAvailable,
  prContent,
  securityContent,
  techdocsContent,
} from '../Content';

const componentEntityPage = (componentType: 'service' | 'website') => (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      {overviewContent}
    </EntityLayout.Route>

    <EntityLayout.Route if={isIssuesAvailable} path="/issues" title="Issues">
      {issuesContent}
    </EntityLayout.Route>

    <EntityLayout.Route
      if={isPrsAvailable}
      path="/pr"
      title="Pull/Merge Requests"
    >
      {prContent}
    </EntityLayout.Route>

    <EntityLayout.Route if={isCIsAvailable} path="/ci" title="CI">
      {ciContent}
    </EntityLayout.Route>

    {/* Use `isArgocdAvailable` once its fixed */}
    <EntityLayout.Route if={isCIsAvailable} path="/cd" title="CD">
      {cdContent}
    </EntityLayout.Route>

    <EntityLayout.Route path="/kubernetes" title="Kubernetes">
      <EntityKubernetesContent refreshIntervalMs={30000} />
    </EntityLayout.Route>

    <EntityLayout.Route path="/topology" title="Topology">
      <TopologyPage />
    </EntityLayout.Route>

    <EntityLayout.Route path="/tekton" title="Tekton">
      <TektonPage />
    </EntityLayout.Route>

    <EntityLayout.Route
      if={isQuayAvailable}
      path="/image-registry"
      title="Image Registry"
    >
      <QuayPage />
    </EntityLayout.Route>

    <EntityLayout.Route path="/security-insights" title="Security Insights">
      {securityContent}
    </EntityLayout.Route>

    {componentType === 'service' && (
      <EntityLayout.Route path="/api" title="API">
        <Grid container spacing={3}>
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
