import {
  SettingsLayout,
  UserSettingsAuthProviders,
} from '@backstage/plugin-user-settings';

import { GeneralPage } from './GeneralPage';

export const settingsPage = (
  <SettingsLayout>
    <SettingsLayout.Route path="general" title="General">
      <GeneralPage />
    </SettingsLayout.Route>
    <SettingsLayout.Route
      path="auth-providers"
      title="Authentication Providers"
    >
      <UserSettingsAuthProviders />
    </SettingsLayout.Route>
  </SettingsLayout>
);
