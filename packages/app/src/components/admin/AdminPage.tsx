import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  Content,
  ErrorPage,
  Header,
  HeaderTabs,
  Page,
} from '@backstage/core-components';
import DynamicRootContext from '../DynamicRoot/DynamicRootContext';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { policyEntityReadPermission } from '@janus-idp/backstage-plugin-rbac-common';
import { usePermission } from '@backstage/plugin-permission-react';

const initialTabs = [
  {
    id: 'plugins',
    label: 'Plugins',
    tabProps: { to: `/admin/plugins`, component: Link },
  },
];

export const AdminPage = () => {
  const [tabs, setTabs] = useState([...initialTabs]);
  const { loading: loadingPermission, allowed: canDisplayRBACTab } =
    usePermission({
      permission: policyEntityReadPermission,
      resourceRef: policyEntityReadPermission.resourceType,
    });
  useEffect(() => {
    if (canDisplayRBACTab && !loadingPermission) {
      setTabs(prevTabs => [
        ...prevTabs,
        {
          id: 'rbac',
          label: 'RBAC',
          tabProps: { to: '/admin/rbac', component: Link },
        },
      ]);
    }
  }, [canDisplayRBACTab, loadingPermission]);
  const { mountPoints } = useContext(DynamicRootContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [parent, selectedTab, ...rest] = pathname
    .slice(1, pathname.length)
    .split('/');
  const availableTabs = tabs.filter(({ id }) => {
    return typeof mountPoints[`admin.page.${id}/cards`] !== 'undefined';
  });
  const invalidTab = useCallback(
    (name: string) =>
      name === undefined ||
      availableTabs.find(tab => tab.id === name) === undefined,
    [availableTabs],
  );
  // cater for the edge case where the component renders but the app has not
  // been configured to have tabs.
  const { id: defaultTabId } = availableTabs[0] || { id: undefined };
  useEffect(() => {
    // deal with use cases where the configuration may change and leave the user
    // on a tab that is no longer configured.
    if (defaultTabId && invalidTab(selectedTab)) {
      navigate(`/${parent}/${defaultTabId}`, { replace: true });
    }
  }, [defaultTabId, invalidTab, navigate, parent, selectedTab]);
  if (availableTabs.length === 0) {
    // this page shouldn't be routed to if there's no mount points for
    // it, but there's one edge case where it can happen
    return (
      <ErrorPage
        status="no content available"
        statusMessage="No admin mount points are configured"
      />
    );
  }
  if (invalidTab(selectedTab)) {
    // in this case the page will navigate to a tab, so avoid
    // doing anything else
    return <></>;
  }
  const hasPageLayout = selectedTab === 'rbac' && rest.length > 0;
  const selectedIndex = availableTabs.findIndex(tab => tab.id === selectedTab);
  const tabContent = (
    mountPoints[`admin.page.${selectedTab}/context`] || []
  ).reduce(
    (acc, { Component }) => <Component>{acc}</Component>,
    <>
      {hasPageLayout ? (
        <>
          {(mountPoints[`admin.page.${selectedTab}/cards`] || []).map(
            ({ Component, config = {}, staticJSXContent }) => {
              return (
                <Component key={`${Component.name}`} {...config.props}>
                  {staticJSXContent}
                </Component>
              );
            },
          )}
        </>
      ) : (
        <Grid container>
          {(mountPoints[`admin.page.${selectedTab}/cards`] || []).map(
            ({ Component, config = {}, staticJSXContent }) => {
              return (
                <Box key={`${Component.name}`} sx={config.layout}>
                  <Component {...config.props}>{staticJSXContent}</Component>
                </Box>
              );
            },
          )}
        </Grid>
      )}
    </>,
  );
  if (hasPageLayout) {
    return <>{tabContent}</>;
  }
  return (
    <Page themeId="theme">
      <Header title="Administration" />
      <HeaderTabs selectedIndex={selectedIndex} tabs={availableTabs} />
      <Content>{tabContent}</Content>
    </Page>
  );
};
