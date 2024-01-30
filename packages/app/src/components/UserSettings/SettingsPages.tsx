import {
  SettingsLayout,
  UserSettingsAuthProviders,
} from '@backstage/plugin-user-settings';
import React from 'react';
import { generalPage } from './GeneralPage';

export const settingsPage = (
  <SettingsLayout>
    <SettingsLayout.Route path="general" title="General">
      {generalPage}
    </SettingsLayout.Route>
    <SettingsLayout.Route
      path="auth-providers"
      title="Authentication Providers"
    >
      <UserSettingsAuthProviders />
    </SettingsLayout.Route>
  </SettingsLayout>
);
