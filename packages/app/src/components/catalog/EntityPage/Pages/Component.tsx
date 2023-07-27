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
import { TopologyPage } from '@janus-idp/backstage-plugin-topology';
import {
  EntityLighthouseContent,
  isLighthouseAvailable,
} from '@backstage/plugin-lighthouse';
import Grid from '@mui/material/Grid';
import React from 'react';
import {
  cdContent,
  ciContent,
  dependenciesContent,
  imageRegistry,
  isCIsAvailable,
  isImageRegistriesAvailable,
  isIssuesAvailable,
  isMonitoringAvailable,
  isPRsAvailable,
  issuesContent,
  monitoringContent,
  overviewContent,
  prContent,
  techdocsContent,
} from '../Content';
import { defaultEntityPage } from './DefaultEntity';

const componentEntityPage = (componentType: 'service' | 'website') => (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      {overviewContent}
    </EntityLayout.Route>

    <EntityLayout.Route path="/topology" title="Topology">
      <TopologyPage />
    </EntityLayout.Route>

    <EntityLayout.Route if={isIssuesAvailable} path="/issues" title="Issues">
      {issuesContent}
    </EntityLayout.Route>

    <EntityLayout.Route
      if={isPRsAvailable}
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

    <EntityLayout.Route path="/tekton" title="Tekton">
      <TektonPage />
    </EntityLayout.Route>

    <EntityLayout.Route
      if={isImageRegistriesAvailable}
      path="/image-registry"
      title="Image Registry"
    >
      {imageRegistry}
    </EntityLayout.Route>

    <EntityLayout.Route
      if={isMonitoringAvailable}
      path="/monitoring"
      title="Monitoring"
    >
      {monitoringContent}
    </EntityLayout.Route>

    <EntityLayout.Route
      path="/lighthouse"
      title="Lighthouse"
      if={isLighthouseAvailable}
    >
      <EntityLighthouseContent />
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
