import { Content, Header, Page } from '@backstage/core-components';
import { DynamicPluginsTable } from './DynamicPluginsTable/DynamicPluginsTable';
import React from 'react';

export const DynamicPluginsInfoPage = () => {
  return (
    <Page themeId="plugins">
      <Header title="Plugins" />
      <Content>
        <DynamicPluginsTable />
      </Content>
    </Page>
  );
};
