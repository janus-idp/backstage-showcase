import {
  providers,
  defaultAuthProviderFactories,
  ProviderFactories,
} from '@backstage/plugin-auth-backend';
import {
  stringifyEntityRef,
  DEFAULT_NAMESPACE,
} from '@backstage/catalog-model';
import {
  AuthProviderFactory,
  AuthResolverContext,
  authProvidersExtensionPoint,
} from '@backstage/plugin-auth-node';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';

/**
 * Function is responsible for signing in a user with the catalog user and
 * creating an entity reference based on the provided name parameter.
 * If the user exist in the catalog , it returns the signed-in user.
 * If an error occurs, it issues a token with the user entity reference.
 *
 * @param name
 * @param ctx
 * @returns
 */
async function signInWithCatalogUserOptional(
  name: string,
  ctx: AuthResolverContext,
) {
  try {
    const signedInUser = await ctx.signInWithCatalogUser({
      entityRef: { name },
    });

    return Promise.resolve(signedInUser);
  } catch (e) {
    const userEntityRef = stringifyEntityRef({
      kind: 'User',
      name: name,
      namespace: DEFAULT_NAMESPACE,
    });

    return ctx.issueToken({
      claims: {
        sub: userEntityRef,
        ent: [userEntityRef],
      },
    });
  }
}

function getAuthProviderFactory(providerId: string): AuthProviderFactory {
  switch (providerId) {
    case 'atlassian':
      return providers.atlassian.create({
        signIn: {
          async resolver({ result: { fullProfile } }, ctx) {
            const userId = fullProfile.username;
            if (!userId) {
              throw new Error(
                'Atlassian user profile does not contain a username',
              );
            }
            return await signInWithCatalogUserOptional(userId, ctx);
          },
        },
      });
    case `auth0`:
      return providers.auth0.create({
        signIn: {
          async resolver({ result: { fullProfile } }, ctx) {
            const userId = fullProfile.id;
            if (!userId) {
              throw new Error(`Auth0 user profile does not contain an id`);
            }
            return await signInWithCatalogUserOptional(userId, ctx);
          },
        },
      });
    case 'azure-easyauth':
      return providers.easyAuth.create({
        signIn: {
          async resolver({ result: { fullProfile } }, ctx) {
            const userId = fullProfile.id;
            if (!userId) {
              throw new Error(
                'Azure Easy Auth user profile does not contain an id',
              );
            }
            return await ctx.signInWithCatalogUser({
              annotations: {
                'graph.microsoft.com/user-id': userId,
              },
            });
          },
        },
      });
    case 'bitbucket':
      return providers.bitbucket.create({
        signIn: {
          resolver:
            providers.bitbucket.resolvers.usernameMatchingUserEntityAnnotation(),
        },
      });
    case 'bitbucketServer':
      return providers.bitbucketServer.create({
        signIn: {
          resolver:
            providers.bitbucketServer.resolvers.emailMatchingUserEntityProfileEmail(),
        },
      });
    case 'cfaccess':
      return providers.cfAccess.create({
        async authHandler({ claims }) {
          return { profile: { email: claims.email } };
        },
        signIn: {
          resolver:
            providers.cfAccess.resolvers.emailMatchingUserEntityProfileEmail(),
        },
      });
    case 'github':
      return providers.github.create({
        signIn: {
          async resolver({ result: { fullProfile } }, ctx) {
            const userId = fullProfile.username;
            if (!userId) {
              throw new Error(
                `GitHub user profile does not contain a username`,
              );
            }
            return await signInWithCatalogUserOptional(userId, ctx);
          },
        },
      });
    case 'gitlab':
      return providers.gitlab.create({
        signIn: {
          async resolver({ result: { fullProfile } }, ctx) {
            const userId = fullProfile.id;
            if (!userId) {
              throw new Error(`GitLab user profile does not contain an id`);
            }
            return await signInWithCatalogUserOptional(userId, ctx);
          },
        },
      });
    case 'google':
      return providers.google.create({
        signIn: {
          resolver:
            providers.google.resolvers.emailLocalPartMatchingUserEntityName(),
        },
      });
    case 'gcp-iap':
      return providers.gcpIap.create({
        async authHandler({ iapToken }) {
          return { profile: { email: iapToken.email } };
        },
        signIn: {
          async resolver({ result: { iapToken } }, ctx) {
            const userId = iapToken.email.split('@')[0];
            if (!userId) {
              throw new Error(
                'Google IAP user profile does not contain an email',
              );
            }
            return await signInWithCatalogUserOptional(userId, ctx);
          },
        },
      });
    case `oauth2Proxy`:
      return providers.oauth2Proxy.create({
        signIn: {
          async resolver({ result }, ctx) {
            const name = result.getHeader('x-forwarded-preferred-username');
            if (!name) {
              throw new Error('Request did not contain a user');
            }
            return await signInWithCatalogUserOptional(name, ctx);
          },
        },
      });
    case 'oidc':
      return providers.oidc.create({
        signIn: {
          async resolver({ result: { userinfo } }, ctx) {
            const userId = userinfo.sub;
            if (!userId) {
              throw new Error('OIDC user does not contain a subject');
            }
            return await signInWithCatalogUserOptional(userId, ctx);
          },
        },
      });
    case 'okta':
      return providers.okta.create({
        signIn: {
          resolver:
            providers.okta.resolvers.emailMatchingUserEntityAnnotation(),
        },
      });
    case 'onelogin':
      return providers.onelogin.create({
        signIn: {
          async resolver({ result: { fullProfile } }, ctx) {
            const userId = fullProfile.id;
            if (!userId) {
              throw new Error(
                `OneLogin user profile does not contain a user id`,
              );
            }
            return await signInWithCatalogUserOptional(userId, ctx);
          },
        },
      });
    case `microsoft`:
      return providers.microsoft.create({
        signIn: {
          async resolver({ result: { fullProfile } }, ctx) {
            const userId = fullProfile.id;
            if (!userId) {
              throw new Error(`Microsoft user profile does not contain an id`);
            }
            return await signInWithCatalogUserOptional(userId, ctx);
          },
        },
      });
    case 'saml':
      return providers.saml.create({
        signIn: {
          resolver: providers.saml.resolvers.nameIdMatchingUserEntityName(),
        },
      });
    default:
      throw new Error(`No auth provider found for ${providerId}`);
  }
}

const authProvidersModule = createBackendModule({
  pluginId: 'auth',
  moduleId: 'auth.providers',
  register(reg) {
    reg.registerInit({
      deps: {
        config: coreServices.rootConfig,
        authProviders: authProvidersExtensionPoint,
        logger: coreServices.logger,
      },
      async init({ config, authProviders, logger }) {
        const providersConfig = config.getConfig('auth.providers');
        const authFactories: ProviderFactories = {};
        providersConfig.keys().forEach(providerId => {
          const factory = getAuthProviderFactory(providerId);
          authFactories[providerId] = factory;
        });

        const providerFactories: ProviderFactories = {
          ...defaultAuthProviderFactories,
          ...authFactories,
        };

        logger.info(
          `Enabled Provider Factories : ${JSON.stringify(providerFactories)}`,
        );

        Object.entries(providerFactories).forEach(([providerId, factory]) => {
          authProviders.registerProvider({ providerId, factory });
        });
      },
    });
  },
});

export default authProvidersModule;
