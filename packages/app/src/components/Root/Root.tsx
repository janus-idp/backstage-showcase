import {
  Sidebar,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarPage,
  SidebarScrollWrapper,
  SidebarSpace,
} from '@backstage/core-components';
import { SidebarSearchModal } from '@backstage/plugin-search';
import { Settings as SidebarSettings } from '@backstage/plugin-user-settings';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import CreateComponentIcon from '@mui/icons-material/AddCircleOutline';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import MuiMenuIcon from '@mui/icons-material/Menu';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { makeStyles } from 'tss-react/mui';
import React, { PropsWithChildren, useContext } from 'react';
import { SidebarLogo } from './SidebarLogo';
import DynamicRootContext from '../DynamicRoot/DynamicRootContext';
import { IconComponent, useApp } from '@backstage/core-plugin-api';

const useStyles = makeStyles()({
  sidebarItem: {
    textDecorationLine: 'none',
  },
});

// Backstage does not expose the props object, pulling it from the component argument
type SidebarItemProps = Parameters<typeof SidebarItem>[0];

const SideBarItemWrapper = (props: SidebarItemProps) => {
  const {
    classes: { sidebarItem },
  } = useStyles();
  return (
    <SidebarItem
      {...props}
      className={`${sidebarItem}${props.className ?? ''}`}
    />
  );
};

export const MenuIcon = ({ icon }: { icon: string }) => {
  const app = useApp();

  const Icon = app.getSystemIcon(icon) || (() => null);
  return <Icon />;
};

export const Root = ({ children }: PropsWithChildren<{}>) => {
  const { dynamicRoutes, mountPoints } = useContext(DynamicRootContext);
  return (
    <SidebarPage>
      <Sidebar>
        <SidebarLogo />
        <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
          <SidebarSearchModal />
        </SidebarGroup>
        <SidebarDivider />
        <SidebarGroup label="Menu" icon={<MuiMenuIcon />}>
          {/* Global nav, not org-specific */}
          <SideBarItemWrapper
            icon={HomeOutlinedIcon as any}
            to="/"
            text="Home"
          />
          <SideBarItemWrapper
            icon={CategoryOutlinedIcon as IconComponent}
            to="catalog"
            text="Catalog"
          />
          <SideBarItemWrapper
            icon={ExtensionOutlinedIcon as IconComponent}
            to="api-docs"
            text="APIs"
          />
          <SideBarItemWrapper
            icon={SchoolOutlinedIcon as IconComponent}
            to="learning-paths"
            text="Learning Paths"
          />
          <SideBarItemWrapper
            icon={CreateComponentIcon as IconComponent}
            to="create"
            text="Create..."
          />
          {/* End global nav */}
          <SidebarDivider />
          <SidebarScrollWrapper>
            {dynamicRoutes.map(({ menuItem, path }) => {
              if (menuItem) {
                return (
                  <SideBarItemWrapper
                    icon={() => <MenuIcon icon={menuItem.icon} />}
                    to={path}
                    text={menuItem.text}
                  />
                );
              }
              return null;
            })}
          </SidebarScrollWrapper>
        </SidebarGroup>
        <SidebarSpace />
        <SidebarDivider />
        {Object.keys(mountPoints).some(scope =>
          scope.startsWith('admin.page'),
        ) ? (
          <SideBarItemWrapper
            icon={AdminPanelSettingsOutlinedIcon as IconComponent}
            to="/admin"
            text="Administration"
          />
        ) : (
          <></>
        )}
        <SidebarGroup label="Settings" to="/settings">
          <SidebarSettings icon={AccountCircleOutlinedIcon as IconComponent} />
        </SidebarGroup>
      </Sidebar>
      {children}
    </SidebarPage>
  );
};
