import {
  EntityAboutCard,
  EntityHasSystemsCard,
  EntityLayout,
  EntitySwitch,
} from '@backstage/plugin-catalog';
import { EntityCatalogGraphCard } from '@backstage/plugin-catalog-graph';
import { Grid } from '@mui/material';
import React from 'react';

import {
  ClusterAllocatableResourceCard,
  ClusterAvailableResourceCard,
  ClusterContextProvider,
  ClusterInfoCard,
  ClusterStatusCard,
} from '@janus-idp/backstage-plugin-ocm';
import { isType } from '../../utils';
import { entityWarningContent } from '../Content/EntityWarning';

export const resourcePage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {entityWarningContent}
        </Grid>

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
