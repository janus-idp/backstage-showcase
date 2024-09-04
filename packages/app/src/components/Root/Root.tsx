import React, { PropsWithChildren, useContext, useState } from 'react';
import {
  Sidebar,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarPage,
  SidebarScrollWrapper,
  SidebarSpace,
} from '@backstage/core-components';
import { IconComponent, useApp } from '@backstage/core-plugin-api';
import { MyGroupsSidebarItem } from '@backstage/plugin-org';
import { SidebarSearchModal } from '@backstage/plugin-search';
import { Settings as SidebarSettings } from '@backstage/plugin-user-settings';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import CreateComponentIcon from '@mui/icons-material/AddCircleOutline';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import MuiMenuIcon from '@mui/icons-material/Menu';
import GroupIcon from '@mui/icons-material/People';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { makeStyles } from 'tss-react/mui';
import { SidebarLogo } from './SidebarLogo';
import DynamicRootContext, {
  ResolvedMenuItem,
} from '../DynamicRoot/DynamicRootContext';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import MuiIcon from '@mui/material/Icon';
import { AdminIcon } from '@internal/plugin-dynamic-plugins-info';
import { usePermission } from '@backstage/plugin-permission-react';
import { policyEntityReadPermission } from '@janus-idp/backstage-plugin-rbac-common';

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
  if (!icon) {
    return null;
  }

  const SystemIcon = app.getSystemIcon(icon);

  if (SystemIcon) {
    return <SystemIcon fontSize="small" />;
  }

  if (icon.startsWith('<svg')) {
    const svgDataUri = `data:image/svg+xml;base64,${btoa(icon)}`;
    return (
      <MuiIcon style={{ fontSize: 20 }}>
        <img src={svgDataUri} alt="" />
      </MuiIcon>
    );
  }

  if (
    icon.startsWith('https://') ||
    icon.startsWith('http://') ||
    icon.startsWith('/')
  ) {
    return (
      <MuiIcon style={{ fontSize: 20 }} baseClassName="material-icons-outlined">
        <img src={icon} alt="" />
      </MuiIcon>
    );
  }

  return (
    <MuiIcon style={{ fontSize: 20 }} baseClassName="material-icons-outlined">
      {icon}
    </MuiIcon>
  );
};

const renderIcon = (iconName: string) => () => <MenuIcon icon={iconName} />;

const renderExpandIcon = (expand: boolean, isSecondLevelMenuItem = false) => {
  return expand ? (
    <ExpandMore
      fontSize="small"
      style={{
        display: 'flex',
        marginLeft: isSecondLevelMenuItem ? '' : '0.5rem',
      }}
    />
  ) : (
    <ChevronRightIcon
      fontSize="small"
      style={{
        display: 'flex',
        marginLeft: isSecondLevelMenuItem ? '' : '0.5rem',
      }}
    />
  );
};

export const Root = ({ children }: PropsWithChildren<{}>) => {
  const { dynamicRoutes, menuItems } = useContext(DynamicRootContext);
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});

  const { loading: loadingPermission, allowed: canDisplayRBACMenuItem } =
    usePermission({
      permission: policyEntityReadPermission,
      resourceRef: policyEntityReadPermission.resourceType,
    });

  const handleClick = (itemName: string) => {
    setOpenItems(prevOpenItems => ({
      ...prevOpenItems,
      [itemName]: !prevOpenItems[itemName],
    }));
  };

  const renderExpandableNestedMenuItems = (
    menuItem: ResolvedMenuItem,
    isSubMenuOpen: boolean,
  ) => {
    return (
      <>
        {menuItem.children &&
          menuItem.children.length > 0 &&
          menuItem.children?.map(child => (
            <Collapse
              key={child.name}
              in={isSubMenuOpen}
              timeout="auto"
              unmountOnExit
            >
              <List
                disablePadding
                sx={{
                  paddingLeft: '4rem',
                  '& div': { width: '36px', boxShadow: '-1px 0 0 0 #3c3f42' },
                }}
              >
                <SidebarItem
                  icon={() => null}
                  text={child.title}
                  to={child.to ?? ''}
                />
              </List>
            </Collapse>
          ))}
      </>
    );
  };
  const renderExpandableMenuItems = (
    menuItem: ResolvedMenuItem,
    isOpen: boolean,
  ) => {
    return (
      <>
        {menuItem.children &&
          menuItem.children.length > 0 &&
          menuItem.children?.map(child => {
            const isNestedMenuOpen = openItems[child.name] || false;
            return (
              <Collapse
                key={child.name}
                in={isOpen}
                timeout="auto"
                unmountOnExit
              >
                <List disablePadding>
                  {child.icon &&
                    child.children &&
                    child.children.length === 0 && (
                      <ListItem disableGutters disablePadding>
                        <SidebarItem
                          icon={renderIcon(child.icon)}
                          text={child.title}
                          to={child.to ?? ''}
                          style={{ paddingLeft: '2rem' }}
                        />
                      </ListItem>
                    )}
                  {child.children && child.children.length > 0 && (
                    <ListItem
                      disableGutters
                      disablePadding
                      sx={{
                        display: 'block',
                        '& .MuiButton-label': { paddingLeft: '2rem' },
                      }}
                    >
                      <SidebarItem
                        key={child.name}
                        icon={renderIcon(child.icon ?? '')}
                        text={child.title}
                        onClick={() => handleClick(child.name)}
                      >
                        {child.children.length > 0 &&
                          renderExpandIcon(isNestedMenuOpen, true)}
                      </SidebarItem>
                      {renderExpandableNestedMenuItems(child, isNestedMenuOpen)}
                    </ListItem>
                  )}
                </List>
              </Collapse>
            );
          })}
      </>
    );
  };

  const renderMenuItems = (isBottomMenuSection: boolean) => {
    const menuItemArray = isBottomMenuSection
      ? menuItems.filter(mi => mi.name === 'admin')
      : menuItems.filter(mi => mi.name !== 'admin');

    if (isBottomMenuSection && !canDisplayRBACMenuItem && !loadingPermission) {
      menuItemArray[0].children = menuItemArray[0].children?.filter(
        mi => mi.name !== 'rbac',
      );
    }
    return (
      <>
        {menuItemArray.map(menuItem => {
          const isOpen = openItems[menuItem.name] || false;
          return (
            <>
              {menuItem.to && (
                <SidebarItem
                  icon={renderIcon(menuItem.icon ?? '')}
                  text={menuItem.title}
                  to={menuItem.to}
                />
              )}
              {menuItem.children!.length > 0 && (
                <SidebarItem
                  key={menuItem.name}
                  icon={renderIcon(menuItem.icon ?? '')}
                  text={menuItem.title}
                  onClick={() => handleClick(menuItem.name)}
                >
                  {menuItem.children!.length > 0 && renderExpandIcon(isOpen)}
                </SidebarItem>
              )}
              {menuItem.children!.length > 0 &&
                renderExpandableMenuItems(menuItem, isOpen)}
            </>
          );
        })}
      </>
    );
  };
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
          <MyGroupsSidebarItem
            icon={GroupIcon as any}
            singularTitle="My Group"
            pluralTitle="My Groups"
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
            {renderMenuItems(false)}
            {dynamicRoutes.map(({ scope, menuItem, path }) => {
              if (menuItem && 'Component' in menuItem) {
                return (
                  <menuItem.Component
                    {...(menuItem.config?.props || {})}
                    key={`${scope}/${path}`}
                    to={path}
                  />
                );
              }
              return null;
            })}
          </SidebarScrollWrapper>
        </SidebarGroup>
        <SidebarSpace />
        <SidebarDivider />
        <SidebarGroup label="Administration" icon={<AdminIcon />}>
          {renderMenuItems(true)}
        </SidebarGroup>
        <SidebarDivider />
        <SidebarGroup
          label="Settings"
          to="/settings"
          icon={<AccountCircleOutlinedIcon />}
        >
          <SidebarSettings icon={AccountCircleOutlinedIcon as IconComponent} />
        </SidebarGroup>
      </Sidebar>
      {children}
    </SidebarPage>
  );
};
