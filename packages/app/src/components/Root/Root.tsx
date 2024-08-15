import {
  Sidebar,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarPage,
  SidebarScrollWrapper,
  SidebarSpace,
} from '@backstage/core-components';
import MuiMenuIcon from '@mui/icons-material/Menu';
import React, { PropsWithChildren, useCallback, useContext } from 'react';
import { SidebarLogo } from './SidebarLogo';
import DynamicRootContext from '../DynamicRoot/DynamicRootContext';
import {
  configApiRef,
  IconComponent,
  useApi,
  useApp,
} from '@backstage/core-plugin-api';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Config } from '@backstage/config';
import MuiIcon from '@mui/material/Icon';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const listItemComponent = (
  icon: any,
  to: string,
  text: string,
  isSecondLevel = false,
) => {
  const iconComponent =
    typeof icon === 'string'
      ? () => (
          <MuiIcon
            style={{ fontSize: 20 }}
            baseClassName="material-icons-outlined"
          >
            {icon}
          </MuiIcon>
        )
      : icon;
  return (
    <SidebarItem
      icon={iconComponent as IconComponent}
      to={to}
      text={text}
      style={{ paddingLeft: isSecondLevel ? '2rem' : '' }}
    />
  );
};

export const MenuIcon = ({ icon }: { icon: string }) => {
  const app = useApp();

  const Icon = app.getSystemIcon(icon) || (() => null);
  return <Icon fontSize="small" />;
};

const nestedMenuItems = (
  parentKey: string,
  subMenuItems: Config[],
  open: boolean,
) => {
  return subMenuItems?.map(subMenuItem => {
    const subMenuItemConfig = {
      title: subMenuItem.getString('title'),
      key: subMenuItem.getString('key'),
      icon: subMenuItem.getString('icon'),
    };
    return (
      <Collapse
        key={subMenuItemConfig.key}
        in={open}
        timeout="auto"
        unmountOnExit
      >
        <List component="div" disablePadding>
          <ListItem
            component={() =>
              listItemComponent(
                subMenuItemConfig.icon,
                `${parentKey}/${subMenuItemConfig.key}`,
                subMenuItemConfig.title,
                true,
              )
            }
          />
        </List>
      </Collapse>
    );
  });
};

export const Root = ({ children }: PropsWithChildren<{}>) => {
  const configApi = useApi(configApiRef);
  const defaultMenuItems = configApi
    .getOptionalConfigArray('app.mainMenu.defaultItems')
    ?.map((item: Config) => ({
      title: item.getString('title'),
      path: item.getString('path'),
      icon: item.getString('icon'),
    }));
  const extraMenuItems = configApi
    .getOptionalConfigArray('app.mainMenu.extraItems')
    ?.map((item: Config) => ({
      title: item.getString('title'),
      name: item.getString('name'),
      icon: item.getString('icon'),
      subMenuItems: item.getOptionalConfigArray('subMenuItems') || [],
    }));

  const [open, setOpen] = React.useState(false);

  const handleClick = () => {
    setOpen(!open);
  };
  const { dynamicRoutes, mountPoints } = useContext(DynamicRootContext);

  const renderNestedMenuItem = useCallback(
    (openNestedMenuItems: boolean, handleClickItem: () => void) => {
      const renderExpandIcon = (openDropdownMenu: boolean) => {
        return openDropdownMenu ? (
          <ExpandMore
            fontSize="small"
            style={{ display: 'flex', marginLeft: '0.5rem' }}
          />
        ) : (
          <ChevronRightIcon
            fontSize="small"
            style={{ display: 'flex', marginLeft: '0.5rem' }}
          />
        );
      };

      const mountedPlugins = Object.keys(mountPoints)
        .filter(
          scope =>
            !scope.startsWith('entity.page') &&
            !scope.startsWith('search.page'),
        )
        .map(scope => scope.split('.')[0])
        .filter((plugin, index, self) => self.indexOf(plugin) === index);

      return (
        <>
          {mountedPlugins.map(plugin => {
            const extraMenuItem = extraMenuItems?.find(
              item => item.name === plugin,
            );
            if (!extraMenuItem) {
              return null;
            }

            const icon = () =>
              extraMenuItem.icon ? (
                <MuiIcon
                  style={{ fontSize: 20 }}
                  baseClassName="material-icons-outlined"
                >
                  {extraMenuItem.icon}
                </MuiIcon>
              ) : null;

            return (
              <React.Fragment key={extraMenuItem.name}>
                <SidebarItem
                  icon={icon as IconComponent}
                  text={extraMenuItem.title}
                  onClick={handleClickItem}
                >
                  {extraMenuItem.subMenuItems?.length > 0 &&
                    renderExpandIcon(openNestedMenuItems)}
                </SidebarItem>
                {extraMenuItem.subMenuItems?.length > 0 &&
                  nestedMenuItems(
                    extraMenuItem.name,
                    extraMenuItem.subMenuItems,
                    openNestedMenuItems,
                  )}
              </React.Fragment>
            );
          })}
        </>
      );
    },
    [extraMenuItems, mountPoints],
  );

  return (
    <SidebarPage>
      <Sidebar>
        <SidebarLogo />
        {defaultMenuItems
          ?.filter(item => item.path === '/search')
          .map(item => (
            <ListItem
              key={item.path}
              component={() =>
                listItemComponent(item.icon, item.path, item.title)
              }
            />
          ))}
        <SidebarDivider />
        <SidebarGroup label="Menu" icon={<MuiMenuIcon />}>
          {/* Global nav, not org-specific */}
          {defaultMenuItems
            ?.filter(
              item => item.path !== '/search' && item.path !== '/settings',
            )
            .map(({ title, path, icon }) => (
              <ListItem
                key={path}
                component={() => listItemComponent(icon, path, title)}
              />
            ))}
          {/* End global nav */}
          <SidebarDivider />
          <SidebarScrollWrapper>
            {dynamicRoutes.map(({ scope, menuItem, path }) => {
              if (menuItem) {
                if ('Component' in menuItem) {
                  return (
                    <menuItem.Component
                      {...(menuItem.config?.props || [])}
                      key={`${scope}/${path}`}
                      to={path}
                    />
                  );
                }
                const icon = () => <MenuIcon icon={menuItem.icon} />;
                return (
                  <ListItem
                    key={`${scope}/${path}`}
                    component={() =>
                      listItemComponent(
                        icon as IconComponent,
                        path,
                        menuItem.text,
                      )
                    }
                  />
                );
              }
              return null;
            })}
          </SidebarScrollWrapper>
        </SidebarGroup>
        <SidebarSpace />
        <SidebarDivider />
        {renderNestedMenuItem(open, handleClick)}
        <SidebarDivider />
        {defaultMenuItems
          ?.filter(item => item.path === '/settings')
          .map(item => (
            <ListItem
              key={item.path}
              component={() =>
                listItemComponent(item.icon, item.path, item.title)
              }
            />
          ))}
      </Sidebar>
      {children}
    </SidebarPage>
  );
};
