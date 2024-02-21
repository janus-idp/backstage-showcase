import { usePermission } from '@backstage/plugin-permission-react';
import { policyEntityReadPermission } from '@janus-idp/backstage-plugin-rbac-common';
import { Link } from 'react-router-dom';
import { AdminTabs } from './AdminTabs';
import React from 'react';
import { Tab } from '@backstage/core-components';
import Loader from '../DynamicRoot/Loader';

export const AdminPage = () => {
  const { loading: loadingPermission, allowed: canDisplayRBACTab } =
    usePermission({
      permission: policyEntityReadPermission,
      resourceRef: policyEntityReadPermission.resourceType,
    });

  const tabs: Tab[] = [
    {
      id: 'plugins',
      label: 'Plugins',
      tabProps: { to: `/admin/plugins`, component: Link },
    },
  ];

  if (canDisplayRBACTab && !loadingPermission) {
    tabs.unshift({
      id: 'rbac',
      label: 'RBAC',
      tabProps: { to: '/admin/rbac', component: Link },
    });
  }

  if (loadingPermission) {
    return <Loader />;
  }

  return <AdminTabs tabs={tabs} />;
};
