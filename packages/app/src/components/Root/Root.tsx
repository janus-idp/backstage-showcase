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
import { IconComponent } from '@backstage/core-plugin-api';
import { MyGroupsSidebarItem } from '@backstage/plugin-org';
import { SidebarSearchModal } from '@backstage/plugin-search';
import { Settings as SidebarSettings } from '@backstage/plugin-user-settings';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import MuiMenuIcon from '@mui/icons-material/Menu';
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
import { AdminIcon } from '@internal/plugin-dynamic-plugins-info';
import { usePermission } from '@backstage/plugin-permission-react';
import { policyEntityReadPermission } from '@janus-idp/backstage-plugin-rbac-common';
import { MenuIcon } from './MenuIcon';
import Box from '@mui/material/Box';

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

const getMenuItem = (menuItem: ResolvedMenuItem, isNestedMenuItem = false) => {
  const menuItemStyle = {
    paddingLeft: isNestedMenuItem ? '2rem' : '',
  };
  return menuItem.name === 'default.my-group' ? (
    <Box key={menuItem.name} sx={{ '& a': menuItemStyle }}>
      <MyGroupsSidebarItem
        key={menuItem.name}
        icon={renderIcon(menuItem.icon ?? '')}
        singularTitle={menuItem.title}
        pluralTitle={`${menuItem.title}s`}
      />
    </Box>
  ) : (
    <SideBarItemWrapper
      key={menuItem.name}
      icon={renderIcon(menuItem.icon ?? '')}
      to={menuItem.to ?? ''}
      text={menuItem.title}
      style={menuItemStyle}
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
                  fontSize: 12,
                  '& span.MuiTypography-subtitle2': { fontSize: 12 },
                  '& div': { width: '36px', boxShadow: '-1px 0 0 0 #3c3f42' },
                }}
              >
                <SideBarItemWrapper
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
                  {child.children && child.children.length === 0 && (
                    <ListItem disableGutters disablePadding>
                      {getMenuItem(child, true)}
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
                      <SideBarItemWrapper
                        key={child.name}
                        icon={renderIcon(child.icon ?? '')}
                        text={child.title}
                        onClick={() => handleClick(child.name)}
                      >
                        {child.children.length > 0 &&
                          renderExpandIcon(isNestedMenuOpen, true)}
                      </SideBarItemWrapper>
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

  const renderMenuItems = (
    isDefaultMenuSection: boolean,
    isBottomMenuSection: boolean,
  ) => {
    let menuItemArray = isDefaultMenuSection
      ? menuItems.filter(mi => mi.name.startsWith('default.'))
      : menuItems.filter(mi => !mi.name.startsWith('default.'));

    menuItemArray = isBottomMenuSection
      ? menuItemArray.filter(mi => mi.name === 'admin')
      : menuItemArray.filter(mi => mi.name !== 'admin');

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
            <React.Fragment key={menuItem.name}>
              {menuItem.children!.length === 0 && getMenuItem(menuItem)}
              {menuItem.children!.length > 0 && (
                <SideBarItemWrapper
                  key={menuItem.name}
                  icon={renderIcon(menuItem.icon ?? '')}
                  text={menuItem.title}
                  onClick={() => handleClick(menuItem.name)}
                >
                  {menuItem.children!.length > 0 && renderExpandIcon(isOpen)}
                </SideBarItemWrapper>
              )}
              {menuItem.children!.length > 0 &&
                renderExpandableMenuItems(menuItem, isOpen)}
            </React.Fragment>
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
          {renderMenuItems(true, false)}
          {/* End global nav */}
          <SidebarDivider />
          <SidebarScrollWrapper>
            {renderMenuItems(false, false)}
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
          {renderMenuItems(false, true)}
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
