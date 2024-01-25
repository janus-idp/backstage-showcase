import { PluginIdProvider } from '@janus-idp/backstage-plugin-rbac-backend';
import { createExtensionPoint } from '@backstage/backend-plugin-api';

// To be put in a new `rbac-node` package

export type PluginIDProviderExtensionPoint = {
  addPluginIDProvider(pluginIDProvider: PluginIdProvider): void;
};

export const pluginIDProviderExtensionPoint =
  createExtensionPoint<PluginIDProviderExtensionPoint>({
    id: 'permission.rbac.pluginIDProvider',
  });
