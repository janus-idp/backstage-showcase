import React from 'react';
import { Button, Grid } from '@material-ui/core';
import {
  EntityApiDefinitionCard,
  EntityConsumedApisCard,
  EntityConsumingComponentsCard,
  EntityHasApisCard,
  EntityProvidedApisCard,
  EntityProvidingComponentsCard,
} from '@backstage/plugin-api-docs';
import {
  EntityAboutCard,
  EntityDependsOnComponentsCard,
  EntityDependsOnResourcesCard,
  EntityHasComponentsCard,
  EntityHasResourcesCard,
  EntityHasSubcomponentsCard,
  EntityHasSystemsCard,
  EntityLayout,
  EntityLinksCard,
  EntitySwitch,
  EntityOrphanWarning,
  EntityProcessingErrorsPanel,
  isComponentType,
  isKind,
  hasCatalogProcessingErrors,
  isOrphan,
} from '@backstage/plugin-catalog';
import {
  isGithubActionsAvailable,
  EntityGithubActionsContent,
} from '@backstage/plugin-github-actions';
import {
  EntityUserProfileCard,
  EntityGroupProfileCard,
  EntityMembersListCard,
  EntityOwnershipCard,
} from '@backstage/plugin-org';
import { EntityTechdocsContent } from '@backstage/plugin-techdocs';
import { EmptyState } from '@backstage/core-components';
import {
  Direction,
  EntityCatalogGraphCard,
} from '@backstage/plugin-catalog-graph';
import {
  RELATION_API_CONSUMED_BY,
  RELATION_API_PROVIDED_BY,
  RELATION_CONSUMES_API,
  RELATION_DEPENDENCY_OF,
  RELATION_DEPENDS_ON,
  RELATION_HAS_PART,
  RELATION_PART_OF,
  RELATION_PROVIDES_API,
} from '@backstage/catalog-model';

import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import { GithubIssuesCard } from '@backstage/plugin-github-issues';
import {
  EntityGithubPullRequestsContent,
  EntityGithubPullRequestsOverviewCard,
  isGithubPullRequestsAvailable,
} from '@roadiehq/backstage-plugin-github-pull-requests';
import {
  isGithubInsightsAvailable,
  EntityGithubInsightsComplianceCard,
} from '@roadiehq/backstage-plugin-github-insights';
import { EntityKubernetesContent } from '@backstage/plugin-kubernetes';
import {
  EntityArgoCDOverviewCard,
  EntityArgoCDHistoryCard,
} from '@roadiehq/backstage-plugin-argo-cd';
import {
  ClusterAllocatableResourceCard,
  ClusterAvailableResourceCard,
  ClusterContextProvider,
  ClusterInfoCard,
  ClusterStatusCard,
} from '@janus-idp/backstage-plugin-ocm';
import { isType } from './utils';
import { QuayPage, isQuayAvailable } from '@janus-idp/backstage-plugin-quay';
import {
  EntitySecurityInsightsCard,
  EntityDependabotAlertsCard,
  EntityGithubDependabotContent,
  EntitySecurityInsightsContent,
} from '@roadiehq/backstage-plugin-security-insights';
import { TopologyPage } from '@janus-idp/backstage-plugin-topology';
import {
  SnykOverview,
  EntitySnykContent,
  isSnykAvailable,
} from 'backstage-plugin-snyk';

const techdocsContent = (
  <EntityTechdocsContent>
    <TechDocsAddons>
      <ReportIssue />
    </TechDocsAddons>
  </EntityTechdocsContent>
);

const cicdContent = (
  // This is an example of how you can implement your company's logic in entity page.
  // You can for example enforce that all components of type 'service' should use GitHubActions
  <Grid container spacing={3} alignItems="stretch">
    <EntitySwitch>
      <EntitySwitch.Case if={isGithubActionsAvailable}>
        <Grid item sm={12} md={12}>
          <EntityGithubActionsContent />
        </Grid>
        <Grid item sm={12} md={12}>
          <EntityArgoCDHistoryCard />
        </Grid>
      </EntitySwitch.Case>

      <EntitySwitch.Case>
        <EmptyState
          title="No CI/CD available for this entity"
          missing="info"
          description="You need to add an annotation to your component if you want to enable CI/CD for it. You can read more about annotations in Backstage by clicking the button below."
          action={
            <Button
              variant="contained"
              color="primary"
              href="https://backstage.io/docs/features/software-catalog/well-known-annotations"
            >
              Read more
            </Button>
          }
        />
      </EntitySwitch.Case>
    </EntitySwitch>
  </Grid>
);

const githubIssuesContent = (
  <Grid container spacing={3} alignItems="stretch">
    <Grid item md={12} xs={12}>
      <GithubIssuesCard />
    </Grid>
  </Grid>
);

const securityContent = (
  <Grid container spacing={3} alignItems="stretch">
    <Grid item md={12} xs={12}>
      <EntityGithubDependabotContent />
    </Grid>
    <Grid item md={12} xs={12}>
      <EntitySecurityInsightsContent />
    </Grid>
    <Grid item md={12} xs={12}>
      <EntitySnykContent />
    </Grid>
  </Grid>
);

const githubPRContent = (
  <Grid container spacing={3} alignItems="stretch">
    <EntitySwitch>
      <EntitySwitch.Case if={e => Boolean(isGithubPullRequestsAvailable(e))}>
        <Grid item md={12} xs={12}>
          <EntityGithubPullRequestsContent />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </Grid>
);

const entityWarningContent = (
  <>
    <EntitySwitch>
      <EntitySwitch.Case if={isOrphan}>
        <Grid item xs={12}>
          <EntityOrphanWarning />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>

    <EntitySwitch>
      <EntitySwitch.Case if={hasCatalogProcessingErrors}>
        <Grid item xs={12}>
          <EntityProcessingErrorsPanel />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>

    <EntitySwitch>
      <EntitySwitch.Case if={isSnykAvailable}>
        <Grid item md={6}>
          <SnykOverview />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </>
);

const dependenciesContent = (
  <Grid container spacing={3} alignItems="stretch">
    <Grid item xs={12} md={6}>
      <EntityCatalogGraphCard
        variant="gridItem"
        direction={Direction.TOP_BOTTOM}
        height={900}
      />
    </Grid>
    <Grid item xs={12} md={6} container spacing={3} alignItems="stretch">
      <Grid item xs={12}>
        <EntityDependsOnComponentsCard variant="gridItem" />
      </Grid>
      <Grid item xs={12}>
        <EntityDependsOnResourcesCard variant="gridItem" />
      </Grid>
      <Grid item xs={12}>
        <EntityHasSubcomponentsCard variant="gridItem" />
      </Grid>
      <Grid item xs={12}>
        <EntityProvidedApisCard />
      </Grid>
      <Grid item xs={12}>
        <EntityConsumedApisCard />
      </Grid>
    </Grid>
  </Grid>
);

const overviewContent = (
  <Grid container spacing={3} alignItems="stretch">
    {entityWarningContent}

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
          <EntitySwitch.Case if={e => Boolean(isGithubInsightsAvailable(e))}>
            <EntityGithubInsightsComplianceCard />
          </EntitySwitch.Case>
        </EntitySwitch>
      </Grid>
    </Grid>

    <Grid item xs={12} md={12}>
      <EntityArgoCDOverviewCard />
    </Grid>
  </Grid>
);

const serviceEntityPage = (
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

    <EntityLayout.Route path="/dependencies" title="Dependencies">
      {dependenciesContent}
    </EntityLayout.Route>

    <EntityLayout.Route path="/docs" title="Docs">
      {techdocsContent}
    </EntityLayout.Route>
  </EntityLayout>
);

const websiteEntityPage = (
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

    <EntityLayout.Route path="/dependencies" title="Dependencies">
      {dependenciesContent}
    </EntityLayout.Route>

    <EntityLayout.Route path="/docs" title="Docs">
      {techdocsContent}
    </EntityLayout.Route>
  </EntityLayout>
);

/**
 * NOTE: This page is designed to work on small screens such as mobile devices.
 * This is based on Material UI Grid. If breakpoints are used, each grid item must set the `xs` prop to a column size or to `true`,
 * since this does not default. If no breakpoints are used, the items will equitably share the available space.
 * https://material-ui.com/components/grid/#basic-grid.
 */

const defaultEntityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      {overviewContent}
    </EntityLayout.Route>

    <EntityLayout.Route path="/docs" title="Docs">
      {techdocsContent}
    </EntityLayout.Route>
  </EntityLayout>
);

const componentPage = (
  <EntitySwitch>
    <EntitySwitch.Case if={isComponentType('service')}>
      {serviceEntityPage}
    </EntitySwitch.Case>

    <EntitySwitch.Case if={isComponentType('website')}>
      {websiteEntityPage}
    </EntitySwitch.Case>

    <EntitySwitch.Case>{defaultEntityPage}</EntitySwitch.Case>
  </EntitySwitch>
);

const apiPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3}>
        {entityWarningContent}
        <Grid item md={6}>
          <EntityAboutCard />
        </Grid>
        <Grid item md={6} xs={12}>
          <EntityCatalogGraphCard variant="gridItem" height={400} />
        </Grid>
        <Grid item md={4} xs={12}>
          <EntityLinksCard />
        </Grid>
        <Grid container item md={12}>
          <Grid item md={6}>
            <EntityProvidingComponentsCard />
          </Grid>
          <Grid item md={6}>
            <EntityConsumingComponentsCard />
          </Grid>
        </Grid>
      </Grid>
    </EntityLayout.Route>

    <EntityLayout.Route path="/definition" title="Definition">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <EntityApiDefinitionCard />
        </Grid>
      </Grid>
    </EntityLayout.Route>
  </EntityLayout>
);

const userPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3}>
        {entityWarningContent}
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

const groupPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3}>
        {entityWarningContent}
        <Grid item xs={12} md={6}>
          <EntityGroupProfileCard variant="gridItem" />
        </Grid>
        <Grid item xs={12} md={6}>
          <EntityOwnershipCard variant="gridItem" />
        </Grid>
        <Grid item xs={12}>
          <EntityMembersListCard />
        </Grid>
      </Grid>
    </EntityLayout.Route>
  </EntityLayout>
);

const systemPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3} alignItems="stretch">
        {entityWarningContent}
        <Grid item md={6}>
          <EntityAboutCard variant="gridItem" />
        </Grid>
        <Grid item md={6} xs={12}>
          <EntityCatalogGraphCard variant="gridItem" height={400} />
        </Grid>
        <Grid item md={4} xs={12}>
          <EntityLinksCard />
        </Grid>
        <Grid item md={8}>
          <EntityHasComponentsCard variant="gridItem" />
        </Grid>
        <Grid item md={6}>
          <EntityHasApisCard variant="gridItem" />
        </Grid>
        <Grid item md={6}>
          <EntityHasResourcesCard variant="gridItem" />
        </Grid>
      </Grid>
    </EntityLayout.Route>
    <EntityLayout.Route path="/diagram" title="Diagram">
      <EntityCatalogGraphCard
        variant="gridItem"
        direction={Direction.TOP_BOTTOM}
        title="System Diagram"
        height={700}
        relations={[
          RELATION_PART_OF,
          RELATION_HAS_PART,
          RELATION_API_CONSUMED_BY,
          RELATION_API_PROVIDED_BY,
          RELATION_CONSUMES_API,
          RELATION_PROVIDES_API,
          RELATION_DEPENDENCY_OF,
          RELATION_DEPENDS_ON,
        ]}
        unidirectional={false}
      />
    </EntityLayout.Route>
  </EntityLayout>
);

const domainPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3} alignItems="stretch">
        {entityWarningContent}
        <Grid item md={6}>
          <EntityAboutCard variant="gridItem" />
        </Grid>
        <Grid item md={6} xs={12}>
          <EntityCatalogGraphCard variant="gridItem" height={400} />
        </Grid>
        <Grid item md={6}>
          <EntityHasSystemsCard variant="gridItem" />
        </Grid>
      </Grid>
    </EntityLayout.Route>
  </EntityLayout>
);

const resourcePage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3} alignItems="stretch">
        {entityWarningContent}
        <Grid item md={6}>
          <EntityAboutCard variant="gridItem" />
        </Grid>
        <Grid item md={6} xs={12}>
          <EntityCatalogGraphCard variant="gridItem" height={400} />
        </Grid>
        <Grid item md={6}>
          <EntityHasSystemsCard variant="gridItem" />
        </Grid>
      </Grid>
    </EntityLayout.Route>
    <EntityLayout.Route path="/status" title="status">
      <EntitySwitch>
        <EntitySwitch.Case if={isType('kubernetes-cluster')}>
          <ClusterContextProvider>
            <Grid container>
              <Grid container item direction="column" xs={3}>
                <Grid item>
                  <ClusterStatusCard />
                </Grid>
                <Grid item>
                  <ClusterAllocatableResourceCard />
                </Grid>
                <Grid item>
                  <ClusterAvailableResourceCard />
                </Grid>
              </Grid>
              <Grid item xs>
                <ClusterInfoCard />
              </Grid>
            </Grid>
          </ClusterContextProvider>
        </EntitySwitch.Case>
      </EntitySwitch>
    </EntityLayout.Route>
  </EntityLayout>
);

export const entityPage = (
  <EntitySwitch>
    <EntitySwitch.Case if={isKind('component')} children={componentPage} />
    <EntitySwitch.Case if={isKind('api')} children={apiPage} />
    <EntitySwitch.Case if={isKind('group')} children={groupPage} />
    <EntitySwitch.Case if={isKind('user')} children={userPage} />
    <EntitySwitch.Case if={isKind('system')} children={systemPage} />
    <EntitySwitch.Case if={isKind('domain')} children={domainPage} />
    <EntitySwitch.Case if={isKind('resource')} children={resourcePage} />

    <EntitySwitch.Case>{defaultEntityPage}</EntitySwitch.Case>
  </EntitySwitch>
);
