import React from 'react';

import { EntitySwitch, isKind } from '@backstage/plugin-catalog';

import {
  apiPage,
  componentPage,
  defaultEntityPage,
  domainPage,
  groupPage,
  resourcePage,
  systemPage,
  userPage,
} from './Pages';

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
