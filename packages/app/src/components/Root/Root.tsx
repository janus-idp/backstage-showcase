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
import {
  Settings as SidebarSettings,
  UserSettingsSignInAvatar,
} from '@backstage/plugin-user-settings';
import CreateComponentIcon from '@mui/icons-material/AddCircleOutline';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import AppsIcon from '@mui/icons-material/Apps';
import ExtensionIcon from '@mui/icons-material/Extension';
import HomeIcon from '@mui/icons-material/Home';
import MuiMenuIcon from '@mui/icons-material/Menu';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import { makeStyles } from 'tss-react/mui';
import React, { PropsWithChildren, useContext } from 'react';
import { SidebarLogo } from './SidebarLogo';
import DynamicRootContext from '../DynamicRoot/DynamicRootContext';
import { IconComponent, useApp } from '@backstage/core-plugin-api';
import {
  NotificationsActiveIcon,
  NotificationsSidebarItem,
} from '@janus-idp/plugin-notifications';

const useStyles = makeStyles()({
  sidebarItem: {
    textDecorationLine: 'none',
    '&:hover': {
      textDecorationLine: 'underline',
    },
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
          <SideBarItemWrapper icon={HomeIcon as any} to="/" text="Home" />
          <SideBarItemWrapper
            icon={AppsIcon as IconComponent}
            to="catalog"
            text="Catalog"
          />
          <SideBarItemWrapper
            icon={ExtensionIcon as IconComponent}
            to="api-docs"
            text="APIs"
          />
          <SideBarItemWrapper
            icon={SchoolIcon as IconComponent}
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

        <SidebarItem
          icon={NotificationsActiveIcon}
          to="notifications"
          text="Static Notifications"
        />

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
        <SidebarGroup
          label="Settings"
          icon={<UserSettingsSignInAvatar />}
          to="/settings"
        >
          <SidebarSettings />
        </SidebarGroup>
      </Sidebar>
      {children}
    </SidebarPage>
  );
};
