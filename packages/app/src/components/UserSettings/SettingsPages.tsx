import { ErrorBoundary } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import {
  DefaultProviderSettings,
  ProviderSettingsItem,
  SettingsLayout,
  UserSettingsAuthProviders,
} from '@backstage/plugin-user-settings';

import Star from '@mui/icons-material/Star';

import { ProviderSetting } from '../DynamicRoot/DynamicRootContext';
import { generalPage } from './GeneralPage';

export const DynamicProviderSettings = ({
  providerSettings,
}: {
  providerSettings: ProviderSetting[];
}) => {
  const configApi = useApi(configApiRef);
  const providersConfig = configApi.getOptionalConfig('auth.providers');
  const configuredProviders = providersConfig?.keys() || [];
  return (
    <>
      <DefaultProviderSettings configuredProviders={configuredProviders} />
      {providerSettings.map(({ title, description, apiRef }) => (
        <ErrorBoundary>
          <ProviderSettingsItem
            title={title}
            description={description}
            apiRef={apiRef}
            icon={Star}
          />
        </ErrorBoundary>
      ))}
    </>
  );
};

export const settingsPage = (providerSettings: ProviderSetting[]) => (
  <SettingsLayout>
    <SettingsLayout.Route path="general" title="General">
      {generalPage}
    </SettingsLayout.Route>
    <SettingsLayout.Route
      path="auth-providers"
      title="Authentication Providers"
    >
      <UserSettingsAuthProviders
        providerSettings={
          <DynamicProviderSettings providerSettings={providerSettings} />
        }
      />
    </SettingsLayout.Route>
  </SettingsLayout>
);
