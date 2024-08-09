import {
  Sidebar,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarPage,
  SidebarScrollWrapper,
  SidebarSpace,
} from '@backstage/core-components';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import CreateComponentIcon from '@mui/icons-material/AddCircleOutline';
// import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import MuiMenuIcon from '@mui/icons-material/Menu';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import SearchIcon from '@mui/icons-material/Search';
import React, { PropsWithChildren, useContext } from 'react';
import { SidebarLogo } from './SidebarLogo';
import DynamicRootContext, {
  MountPoints,
} from '../DynamicRoot/DynamicRootContext';
import { IconComponent, useApp } from '@backstage/core-plugin-api';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import PowerOutlinedIcon from '@mui/icons-material/PowerOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import GppMaybeOutlinedIcon from '@mui/icons-material/GppMaybeOutlined';

const listItemComponent = (
  Icon: any,
  to: string,
  text: string,
  isSecondLevel = false,
) => {
  const iconComponent = () => <Icon fontSize="small" />;
  return (
    <SidebarItem
      icon={iconComponent as IconComponent}
      to={to}
      text={text}
      style={{ paddingLeft: isSecondLevel ? '2rem' : '' }}
    />
  );
};

type MenuItem = {
  label: string;
  icon: React.ElementType;
};

export const MenuIcon = ({ icon }: { icon: string }) => {
  const app = useApp();

  const Icon = app.getSystemIcon(icon) || (() => null);
  return <Icon fontSize="small" />;
};

const menuIcons: Record<string, MenuItem> = {
  rbac: { label: 'RBAC', icon: VpnKeyOutlinedIcon },
  plugins: { label: 'Plugins', icon: PowerOutlinedIcon },
  metrics: { label: 'Metrics', icon: QueryStatsOutlinedIcon },
};

const nestedMenuItems = (scopes: string[], open: boolean) => {
  const paths = scopes.map(scope => scope.split('/')[0].replace('.page.', '/'));
  paths.push('admin/metrics');
  return (
    <Collapse in={open} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        {paths
          .filter(p => p.includes('admin/'))
          .map(path => {
            const menuItemName = path.split('/').pop() ?? '';
            return (
              <ListItem
                component={() =>
                  listItemComponent(
                    menuIcons[menuItemName]?.icon,
                    path,
                    menuIcons[menuItemName]?.label,
                    true,
                  )
                }
              />
            );
          })}
      </List>
    </Collapse>
  );
};

const dropdownMenuItem = (
  mountPoints: MountPoints,
  open: boolean,
  handleClick: () => void,
) => {
  const scopes = Object.keys(mountPoints);
  const showAdmin = scopes.some(scope => scope.startsWith('admin.page'));
  return showAdmin ? (
    <>
      <ListItemButton
        onClick={handleClick}
        sx={{ width: '100%', maxHeight: '3rem', color: '#fff' }}
      >
        <ListItemIcon
          sx={{ minWidth: '0', padding: '0 0.5rem', color: '#fff' }}
        >
          <GppMaybeOutlinedIcon sx={{ fontSize: '1.25rem' }} />
        </ListItemIcon>
        <ListItemText
          primary="Administration"
          primaryTypographyProps={{ fontSize: '14px', fontWeight: '500' }}
        />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      {nestedMenuItems(scopes, open)}
    </>
  ) : (
    <></>
  );
};

export const Root = ({ children }: PropsWithChildren<{}>) => {
  const [open, setOpen] = React.useState(false);

  const handleClick = () => {
    setOpen(!open);
  };
  const { dynamicRoutes, mountPoints } = useContext(DynamicRootContext);
  return (
    <SidebarPage>
      <Sidebar>
        <SidebarLogo />
        <ListItem
          component={() => listItemComponent(SearchIcon, '/search', 'Search')}
        />
        <SidebarDivider />
        <SidebarGroup label="Menu" icon={<MuiMenuIcon />}>
          {/* Global nav, not org-specific */}
          <ListItem
            component={() => listItemComponent(HomeOutlinedIcon, '/', 'Home')}
          />
          <ListItem
            component={() =>
              listItemComponent(CategoryOutlinedIcon, 'catalog', 'Catalog')
            }
          />
          <ListItem
            component={() =>
              listItemComponent(ExtensionOutlinedIcon, 'api-docs', 'APIs')
            }
          />
          <ListItem
            component={() =>
              listItemComponent(
                SchoolOutlinedIcon,
                'learning-paths',
                'Learning Paths',
              )
            }
          />
          <ListItem
            component={() =>
              listItemComponent(CreateComponentIcon, 'create', 'Create...')
            }
          />
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
                return (
                  <ListItem
                    key={`${scope}/${path}`}
                    component={() =>
                      listItemComponent(
                        () => <MenuIcon icon={menuItem.icon} />,
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
        {dropdownMenuItem(mountPoints, open, handleClick)}
        <SidebarDivider />
        <ListItem
          component={() =>
            listItemComponent(
              AccountCircleOutlinedIcon,
              '/settings',
              'Settings',
            )
          }
        />
      </Sidebar>
      {children}
    </SidebarPage>
  );
};
