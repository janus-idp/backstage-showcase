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
import AppsIcon from '@mui/icons-material/Apps';
import ExtensionIcon from '@mui/icons-material/Extension';
import HomeIcon from '@mui/icons-material/Home';
import LibraryBooks from '@mui/icons-material/LibraryBooks';
import MenuIcon from '@mui/icons-material/Menu';
import MapIcon from '@mui/icons-material/MyLocation';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import StorageIcon from '@mui/icons-material/Storage';
import AssessmentIcon from '@mui/icons-material/Assessment';
import React, { PropsWithChildren } from 'react';
import { SidebarLogo } from './SidebarLogo';

export const Root = ({ children }: PropsWithChildren<{}>) => (
  <SidebarPage>
    <Sidebar>
      <SidebarLogo />
      <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
        <SidebarSearchModal />
      </SidebarGroup>
      <SidebarDivider />
      <SidebarGroup label="Menu" icon={<MenuIcon />}>
        {/* Global nav, not org-specific */}
        <SidebarItem icon={HomeIcon as any} to="/" text="Home" />
        <SidebarItem icon={AppsIcon as any} to="catalog" text="Catalog" />
        <SidebarItem icon={ExtensionIcon as any} to="api-docs" text="APIs" />
        <SidebarItem icon={LibraryBooks as any} to="docs" text="Docs" />
        <SidebarItem
          icon={SchoolIcon as any}
          to="learning-paths"
          text="Learning Paths"
        />
        <SidebarItem icon={StorageIcon as any} to="ocm" text="Clusters" />
        <SidebarItem
          icon={CreateComponentIcon as any}
          to="create"
          text="Create..."
        />
        {/* End global nav */}
        <SidebarDivider />
        <SidebarScrollWrapper>
          <SidebarItem
            icon={MapIcon as any}
            to="tech-radar"
            text="Tech Radar"
          />
          <SidebarItem
            icon={AssessmentIcon as any}
            to="lighthouse"
            text="Lighthouse"
          />
        </SidebarScrollWrapper>
      </SidebarGroup>
      <SidebarSpace />
      <SidebarDivider />
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
