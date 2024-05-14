import { Entity } from '@backstage/catalog-model';
import { EntityLayout, EntitySwitch } from '@backstage/plugin-catalog';
import Box from '@mui/material/Box';
import React from 'react';
import getMountPointData from '../../../utils/dynamicUI/getMountPointData';
import Grid from '../Grid';

export type DynamicEntityTabProps = {
  path: string;
  title: string;
  mountPoint: string;
  if?: (entity: Entity) => boolean;
  children?: React.ReactNode;
};

/**
 * Returns an configured route element suitable to use within an
 * EntityLayout component that will load content based on the dynamic
 * route and mount point configuration.  Accepts a {@link DynamicEntityTabProps}
 * Note - only call this as a function from within an EntityLayout
 * component
 * @param param0
 * @returns
 */
export const dynamicEntityTab = ({
  path,
  title,
  mountPoint,
  children,
  if: condition,
}: DynamicEntityTabProps) => (
  <EntityLayout.Route
    key={`${path}`}
    path={path}
    title={title}
    if={entity =>
      (condition ? condition(entity) : Boolean(children)) ||
      getMountPointData<React.ComponentType>(`${mountPoint}/cards`)
        .flatMap(({ config }) => config.if)
        .some(cond => cond(entity))
    }
  >
    {getMountPointData<React.ComponentType<React.PropsWithChildren>>(
      `${mountPoint}/context`,
    ).reduce(
      (acc, { Component }) => (
        <Component>{acc}</Component>
      ),
      <Grid container>
        {children}
        {getMountPointData<
          React.ComponentType<React.PropsWithChildren>,
          React.ReactNode
        >(`${mountPoint}/cards`).map(
          ({ Component, config, staticJSXContent }, index) => {
            return (
              <EntitySwitch key={`${Component.displayName}-${index}`}>
                <EntitySwitch.Case if={config.if}>
                  <Box sx={config.layout}>
                    <Component {...config.props}>{staticJSXContent}</Component>
                  </Box>
                </EntitySwitch.Case>
              </EntitySwitch>
            );
          },
        )}
      </Grid>,
    )}
  </EntityLayout.Route>
);
