import React from 'react';

import { EntitySwitch, isKind } from '@backstage/plugin-catalog';
import Grid from '../Grid';

import { EntityApiDefinitionCard } from '@backstage/plugin-api-docs';

export const DefinitionTabContent = () => (
  <EntitySwitch>
    <EntitySwitch.Case if={isKind('api')}>
      <Grid item sx={{ gridColumn: '1 / -1' }}>
        <EntityApiDefinitionCard />
      </Grid>
    </EntitySwitch.Case>
  </EntitySwitch>
);
