import React from 'react';

import { ContentHeader, SupportButton } from '@backstage/core-components';

import { DynamicPluginsTable } from '../DynamicPluginsTable/DynamicPluginsTable';

export const DynamicPluginsInfoContent = () => (
  <>
    <ContentHeader title="">
      <SupportButton>All of the installed plugins</SupportButton>
    </ContentHeader>
    <DynamicPluginsTable />
  </>
);
