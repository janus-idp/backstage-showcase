import {
  createBackendModule,
  coreServices,
} from '@backstage/backend-plugin-api';
import {
  authProvidersExtensionPoint,
  createOAuthProviderFactory,
} from '@backstage/plugin-auth-node';
import { aapAuthAuthenticator } from './authenticator';
import { AAPAuthSignInResolvers } from './resolvers';

export const authModuleRhaapProvider = createBackendModule({
  pluginId: 'auth',
  moduleId: 'rhaap-provider',
  register(reg) {
    reg.registerInit({
      deps: {
        providers: authProvidersExtensionPoint,
        logger: coreServices.logger,
      },
      async init({ providers }) {
        providers.registerProvider({
          providerId: 'rhaap',
          factory: createOAuthProviderFactory({
            authenticator: aapAuthAuthenticator,
            signInResolverFactories: {
              ...AAPAuthSignInResolvers,
            },
          }),
        });
      },
    });
  },
});
