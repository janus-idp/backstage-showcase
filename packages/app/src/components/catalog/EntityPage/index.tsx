import React from 'react';
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
  EntityOrphanWarning,
  EntityProcessingErrorsPanel,
  EntityRelationWarning,
  EntitySwitch,
  hasCatalogProcessingErrors,
  hasRelationWarnings,
  isKind,
  isOrphan,
} from '@backstage/plugin-catalog';
import tab from '../tab';
import { hasLinks, isType } from '../utils';
import {
  Direction,
  EntityCatalogGraphCard,
} from '@backstage/plugin-catalog-graph';
import {
  EntityGroupProfileCard,
  EntityMembersListCard,
  EntityOwnershipCard,
  EntityUserProfileCard,
} from '@backstage/plugin-org';
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
import Grid from '../Grid';

export const entityPage = (
  <EntityLayout>
    {tab({
      path: '/',
      title: 'Overview',
      mountPoint: 'entity.page.overview',
      children: (
        <>
          <EntitySwitch>
            <EntitySwitch.Case if={isOrphan}>
              <Grid item sx={{ gridColumn: '1 / -1' }}>
                <EntityOrphanWarning />
              </Grid>
            </EntitySwitch.Case>
          </EntitySwitch>
          <EntitySwitch>
            <EntitySwitch.Case if={hasRelationWarnings}>
              <Grid item sx={{ gridColumn: '1 / -1' }}>
                <EntityRelationWarning />
              </Grid>
            </EntitySwitch.Case>
          </EntitySwitch>
          <EntitySwitch>
            <EntitySwitch.Case if={hasCatalogProcessingErrors}>
              <Grid item sx={{ gridColumn: '1 / -1' }}>
                <EntityProcessingErrorsPanel />
              </Grid>
            </EntitySwitch.Case>
          </EntitySwitch>
          <Grid
            item
            sx={{
              gridColumn: {
                lg: '1 / span 4',
                md: '1 / span 6',
                xs: '1 / -1',
              },
              gridRowEnd: 'span 2',
            }}
          >
            <Grid container>
              <EntitySwitch>
                <EntitySwitch.Case if={hasLinks}>
                  <Grid item sx={{ gridColumn: '1 / -1' }}>
                    <EntityLinksCard />
                  </Grid>
                </EntitySwitch.Case>
              </EntitySwitch>
              <Grid item sx={{ gridColumn: '1 / -1' }}>
                <EntityAboutCard />
              </Grid>
            </Grid>
          </Grid>
          <EntitySwitch>
            <EntitySwitch.Case if={isKind('domain')}>
              <Grid
                item
                sx={{
                  gridColumn: {
                    lg: '5 / -1',
                    md: '7 / -1',
                    xs: '1 / -1',
                  },
                }}
              >
                <EntityCatalogGraphCard variant="gridItem" height={400} />
              </Grid>
              <Grid
                item
                sx={{
                  gridColumn: {
                    lg: '5 / -1',
                    md: '7 / -1',
                    xs: '1 / -1',
                  },
                }}
              >
                <EntityHasSystemsCard variant="gridItem" />
              </Grid>
            </EntitySwitch.Case>
            <EntitySwitch.Case if={isKind('group')}>
              <Grid
                item
                sx={{
                  gridColumn: {
                    lg: '5 / -1',
                    md: '7 / -1',
                    xs: '1 / -1',
                  },
                }}
              >
                <EntityGroupProfileCard variant="gridItem" />
              </Grid>
              <Grid
                item
                sx={{
                  gridColumn: {
                    lg: '5 / -1',
                    xs: '1 / -1',
                  },
                }}
              >
                <EntityOwnershipCard variant="gridItem" />
              </Grid>
              <Grid
                item
                sx={{
                  gridColumn: {
                    lg: '5 / -1',
                    xs: '1 / -1',
                  },
                }}
              >
                <EntityMembersListCard />
              </Grid>
            </EntitySwitch.Case>
            <EntitySwitch.Case if={isKind('user')}>
              <Grid
                item
                sx={{
                  gridColumn: {
                    lg: '5 / -1',
                    md: '7 / -1',
                    xs: '1 / -1',
                  },
                }}
              >
                <EntityUserProfileCard variant="gridItem" />
              </Grid>
              <Grid
                item
                sx={{
                  gridColumn: {
                    lg: '5 / -1',
                    xs: '1 / -1',
                  },
                }}
              >
                <EntityOwnershipCard variant="gridItem" />
              </Grid>
            </EntitySwitch.Case>
            <EntitySwitch.Case if={isKind('api')}>
              <Grid
                item
                sx={{
                  gridColumn: {
                    lg: '5 / -1',
                    md: '7 / -1',
                    xs: '1 / -1',
                  },
                }}
              >
                <EntityCatalogGraphCard variant="gridItem" height={400} />
              </Grid>
              <Grid
                item
                sx={{
                  gridColumn: {
                    lg: '1 / span 6',
                    xs: '1 / -1',
                  },
                }}
              >
                <EntityProvidingComponentsCard />
              </Grid>
              <Grid
                item
                sx={{
                  gridColumn: {
                    lg: '7 / span 6',
                    xs: '1 / -1',
                  },
                }}
              >
                <EntityConsumingComponentsCard />
              </Grid>
            </EntitySwitch.Case>
            <EntitySwitch.Case if={isKind('system')}>
              <Grid
                item
                sx={{
                  gridColumn: {
                    lg: '5 / -1',
                    md: '7 / -1',
                    xs: '1 / -1',
                  },
                }}
              >
                <EntityCatalogGraphCard variant="gridItem" height={400} />
              </Grid>
              <Grid
                item
                sx={{
                  gridColumn: {
                    lg: '5 / -1',
                    xs: '1 / -1',
                  },
                }}
              >
                <EntityHasComponentsCard />
              </Grid>
              <Grid
                item
                sx={{
                  gridColumn: {
                    lg: '1 / span 6',
                    xs: '1 / -1',
                  },
                }}
              >
                <EntityHasApisCard />
              </Grid>
              <Grid
                item
                sx={{
                  gridColumn: {
                    lg: '7 / span 6',
                    xs: '1 / -1',
                  },
                }}
              >
                <EntityHasResourcesCard />
              </Grid>
            </EntitySwitch.Case>
            <EntitySwitch.Case if={isKind('resource')}>
              <Grid
                item
                sx={{
                  gridColumn: {
                    lg: '5 / -1',
                    md: '7 / -1',
                    xs: '1 / -1',
                  },
                }}
              >
                <EntityCatalogGraphCard variant="gridItem" height={400} />
              </Grid>
            </EntitySwitch.Case>
          </EntitySwitch>
        </>
      ),
    })}

    {tab({
      path: '/topology',
      title: 'Topology',
      mountPoint: 'entity.page.topology',
    })}

    {tab({
      path: '/issues',
      title: 'Issues',
      mountPoint: 'entity.page.issues',
    })}

    {tab({
      path: '/pr',
      title: 'Pull/Merge Requests',
      mountPoint: 'entity.page.pull-requests',
    })}

    {tab({
      path: '/ci',
      title: 'CI',
      mountPoint: 'entity.page.ci',
    })}

    {tab({
      path: '/cd',
      title: 'CD',
      mountPoint: 'entity.page.cd',
    })}

    {tab({
      path: '/kubernetes',
      title: 'Kubernetes',
      mountPoint: 'entity.page.kubernetes',
    })}

    {tab({
      path: '/kiali',
      title: 'Kiali',
      mountPoint: 'entity.page.kiali',
    })}

    {tab({
      path: '/image-registry',
      title: 'Image Registry',
      mountPoint: 'entity.page.image-registry',
    })}

    {tab({
      path: '/monitoring',
      title: 'Monitoring',
      mountPoint: 'entity.page.monitoring',
    })}

    {tab({
      path: '/lighthouse',
      title: 'Lighthouse',
      mountPoint: 'entity.page.lighthouse',
    })}

    {tab({
      path: '/api',
      title: 'Api',
      mountPoint: 'entity.page.api',
      if: e => isType('service')(e) && isKind('component')(e),
      children: (
        <EntitySwitch>
          <EntitySwitch.Case
            if={e => isType('service')(e) && isKind('component')(e)}
          >
            <Grid
              item
              sx={{
                gridColumn: {
                  lg: '1 / span 6',
                  xs: '1 / -1',
                },
              }}
            >
              <EntityProvidedApisCard />
            </Grid>
            <Grid
              item
              sx={{
                gridColumn: {
                  lg: '7 / span 6',
                  xs: '1 / -1',
                },
              }}
            >
              <EntityConsumedApisCard />
            </Grid>
          </EntitySwitch.Case>
        </EntitySwitch>
      ),
    })}

    {tab({
      path: '/dependencies',
      title: 'Dependencies',
      mountPoint: 'entity.page.dependencies',
      if: isKind('component'),
      children: (
        <EntitySwitch>
          <EntitySwitch.Case if={isKind('component')}>
            <Grid
              item
              sx={{
                gridColumn: {
                  lg: '1 / span 6',
                  xs: '1 / -1',
                },
                gridRowEnd: 'span 6',
              }}
            >
              <EntityCatalogGraphCard
                variant="gridItem"
                direction={Direction.TOP_BOTTOM}
                height={900}
              />
            </Grid>
            <Grid
              item
              sx={{
                gridColumn: {
                  lg: '7 / -1',
                  xs: '1 / -1',
                },
              }}
            >
              <EntityDependsOnComponentsCard variant="gridItem" />
            </Grid>
            <Grid
              item
              sx={{
                gridColumn: {
                  lg: '7 / -1',
                  xs: '1 / -1',
                },
              }}
            >
              <EntityDependsOnResourcesCard variant="gridItem" />
            </Grid>
            <Grid
              item
              sx={{
                gridColumn: {
                  lg: '7 / -1',
                  xs: '1 / -1',
                },
              }}
            >
              <EntityHasSubcomponentsCard variant="gridItem" />
            </Grid>
            <Grid
              item
              sx={{
                gridColumn: {
                  lg: '7 / -1',
                  xs: '1 / -1',
                },
              }}
            >
              <EntityProvidedApisCard />
            </Grid>
            <Grid
              item
              sx={{
                gridColumn: {
                  lg: '7 / -1',
                  xs: '1 / -1',
                },
              }}
            >
              <EntityConsumedApisCard />
            </Grid>
          </EntitySwitch.Case>
        </EntitySwitch>
      ),
    })}

    {tab({
      path: '/docs',
      title: 'Docs',
      mountPoint: 'entity.page.docs',
    })}

    {tab({
      path: '/definition',
      title: 'Definition',
      mountPoint: 'entity.page.definition',
      if: isKind('api'),
      children: (
        <EntitySwitch>
          <EntitySwitch.Case if={isKind('api')}>
            <Grid item sx={{ gridColumn: '1 / -1' }}>
              <EntityApiDefinitionCard />
            </Grid>
          </EntitySwitch.Case>
        </EntitySwitch>
      ),
    })}

    {tab({
      path: '/diagram',
      title: 'Diagram',
      mountPoint: 'entity.page.diagram',
      if: isKind('system'),
      children: (
        <EntitySwitch>
          <EntitySwitch.Case if={isKind('system')}>
            <Grid item sx={{ gridColumn: '1 / -1' }}>
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
            </Grid>
          </EntitySwitch.Case>
        </EntitySwitch>
      ),
    })}
  </EntityLayout>
);
