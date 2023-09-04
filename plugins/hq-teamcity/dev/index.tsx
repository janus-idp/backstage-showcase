import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { teamcityPlugin, EntityTeamcityContent } from '../src/plugin';

createDevApp()
  .registerPlugin(teamcityPlugin)
  .addPage({
    element: <EntityTeamcityContent />,
    title: 'Root Page',
    path: '/teamcity',
  })
  .render();
