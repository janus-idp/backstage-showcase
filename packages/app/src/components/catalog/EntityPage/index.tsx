import { EntitySwitch, isKind } from '@backstage/plugin-catalog';
import React from 'react';

import {
  componentPage,
  defaultEntityPage,
  ApiPage,
  GroupPage,
  UserPage,
  SystemPage,
  DomainPage,
  ResourcePage,
} from './Pages';

export const entityPage = (
  <EntitySwitch>
    <EntitySwitch.Case if={isKind('component')} children={componentPage} />
    <EntitySwitch.Case if={isKind('api')} children={<ApiPage />} />
    <EntitySwitch.Case if={isKind('group')} children={<GroupPage />} />
    <EntitySwitch.Case if={isKind('user')} children={<UserPage />} />
    <EntitySwitch.Case if={isKind('system')} children={<SystemPage />} />
    <EntitySwitch.Case if={isKind('domain')} children={<DomainPage />} />
    <EntitySwitch.Case if={isKind('resource')} children={<ResourcePage />} />

    <EntitySwitch.Case>{defaultEntityPage}</EntitySwitch.Case>
  </EntitySwitch>
);
