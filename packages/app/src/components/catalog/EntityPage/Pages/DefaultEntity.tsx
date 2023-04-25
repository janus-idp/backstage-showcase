import { EntityLayout } from '@backstage/plugin-catalog';
import React from 'react';
import { OverviewContent, TechdocsContent } from '../Content';

export const defaultEntityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <OverviewContent />
    </EntityLayout.Route>

    <EntityLayout.Route path="/docs" title="Docs">
      <TechdocsContent />
    </EntityLayout.Route>
  </EntityLayout>
);
