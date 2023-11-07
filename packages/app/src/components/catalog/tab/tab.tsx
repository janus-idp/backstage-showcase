import React from 'react';
import getMountPointData from '../../../utils/dynamicUI/getMountPointData';
import { EntityLayout, EntitySwitch } from '@backstage/plugin-catalog';
import Grid from '../Grid';
import { Entity } from '@backstage/catalog-model';

export type TabProps = {
  path: string;
  title: string;
  mountPoint: string;
  if?: (e: Entity) => boolean;
  children?: React.ReactNode;
};

const tab = ({
  path,
  title,
  mountPoint,
  children,
  if: condition,
}: TabProps) => (
  <EntityLayout.Route
    path={path}
    title={title}
    if={e =>
      (condition ? condition(e) : Boolean(children)) ||
      getMountPointData<React.ComponentType>(`${mountPoint}/cards`)
        .flatMap(({ config }) => config.if)
        .some(c => c(e))
    }
  >
    {getMountPointData<React.ComponentType>(`${mountPoint}/context`).reduce(
      (acc, { component: Component }) => (
        <Component>{acc}</Component>
      ),
      <Grid container>
        {children}
        {getMountPointData<React.ComponentType>(`${mountPoint}/cards`).map(
          ({ component: Component, config }) => (
            <EntitySwitch key={`${Component.displayName}`}>
              <EntitySwitch.Case if={config.if}>
                <div style={config.layout}>
                  <Component {...config.props} />
                </div>
              </EntitySwitch.Case>
            </EntitySwitch>
          ),
        )}
      </Grid>,
    )}
  </EntityLayout.Route>
);

export default tab;
