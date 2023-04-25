import { EmptyState } from '@backstage/core-components';
import { EntitySwitch } from '@backstage/plugin-catalog';
import {
  EntityGithubActionsContent,
  isGithubActionsAvailable,
} from '@backstage/plugin-github-actions';
import { Button, Grid } from '@material-ui/core';
import React from 'react';

import { EntityArgoCDHistoryCard } from '@roadiehq/backstage-plugin-argo-cd';

export const CicdContent = () => (
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
