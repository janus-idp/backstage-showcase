import {
  createRouter,
  providers,
  defaultAuthProviderFactories,
  ProviderFactories,
} from '@backstage/plugin-auth-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import {
  stringifyEntityRef,
  DEFAULT_NAMESPACE,
} from '@backstage/catalog-model';
import {
  AuthProviderFactory,
  AuthResolverContext,
} from '@backstage/plugin-auth-node';

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
              throw new Error(`GitLab user profile does not contain a user id`);
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
            const id = iapToken.email.split('@')[0];
            return await signInWithCatalogUserOptional(id, ctx);
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
    case 'okta':
      return providers.okta.create({
        signIn: {
          resolver:
            providers.okta.resolvers.emailMatchingUserEntityAnnotation(),
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
    default:
      throw new Error(`No auth provider found for ${providerId}`);
  }
}

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const providersConfig = env.config.getConfig('auth.providers');
  const authFactories: ProviderFactories = {};
  providersConfig.keys().forEach(providerId => {
    const factory = getAuthProviderFactory(providerId);
    authFactories[providerId] = factory;
  });

  const providerFactiories: ProviderFactories = {
    ...defaultAuthProviderFactories,
    ...authFactories,
  };
  env.logger.info(
    `Enabled Provider Factories : ${JSON.stringify(providerFactiories)}`,
  );

  return await createRouter({
    logger: env.logger,
    config: env.config,
    database: env.database,
    discovery: env.discovery,
    tokenManager: env.tokenManager,
    providerFactories: providerFactiories,
  });
}
