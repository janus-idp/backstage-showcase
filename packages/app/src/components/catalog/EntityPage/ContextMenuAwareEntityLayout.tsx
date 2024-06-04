import React, { ReactNode, useMemo, useState } from 'react';
import { EntityLayout } from '@backstage/plugin-catalog';
import getMountPointData from '../../../utils/dynamicUI/getMountPointData';
import { MenuIcon } from '../../Root/Root';

export const ContextMenuAwareEntityLayout = (props: {
  children?: ReactNode;
}) => {
  const contextMenuElements =
    getMountPointData<React.ComponentType<React.PropsWithChildren<any>>>(
      `entity.context.menu`,
    );

  const [openStates, openStatesSet] = useState(
    new Array<boolean>(contextMenuElements.length).fill(false),
  );

  const extraMenuItems = useMemo(
    () =>
      contextMenuElements.map((e, index) => ({
        title: e.config.props?.title ?? 'title',
        Icon: () => <MenuIcon icon={e.config.props?.icon ?? 'icon'} />,
        onClick: () => {
          openStatesSet(openStates.map((s, i) => (i === index ? true : s)));
        },
      })),
    [contextMenuElements, openStates],
  );

  return (
    <>
      <EntityLayout
        UNSTABLE_extraContextMenuItems={extraMenuItems}
        UNSTABLE_contextMenuOptions={{
          disableUnregister: 'visible',
        }}
      >
        {props.children}
      </EntityLayout>
      {contextMenuElements.map(({ Component }, index) => (
        <>
          <Component
            open={openStates[index]}
            onClose={() =>
              openStatesSet(openStates.map((s, i) => (i === index ? false : s)))
            }
          />
        </>
      ))}
    </>
  );
};
