import {
  createRouter,
  providers,
  defaultAuthProviderFactories,
  getDefaultOwnershipEntityRefs,
} from '@backstage/plugin-auth-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import {
  stringifyEntityRef,
  DEFAULT_NAMESPACE,
} from '@backstage/catalog-model';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    logger: env.logger,
    config: env.config,
    database: env.database,
    discovery: env.discovery,
    tokenManager: env.tokenManager,
    providerFactories: {
      ...defaultAuthProviderFactories,

      // This replaces the default GitHub auth provider with a customized one.
      // The `signIn` option enables sign-in for this provider, using the
      // identity resolution logic that's provided in the `resolver` callback.
      //
      // This particular resolver makes all users share a single "guest" identity.
      // It should only be used for testing and trying out Backstage.
      //
      // If you want to use a production ready resolver you can switch to
      // the one that is commented out below, it looks up a user entity in the
      // catalog using the GitHub username of the authenticated user.
      // That resolver requires you to have user entities populated in the catalog,
      // for example using https://backstage.io/docs/integrations/github/org
      //
      // There are other resolvers to choose from, and you can also create
      // your own, see the auth documentation for more details:
      //
      //   https://backstage.io/docs/auth/identity-resolver
      github: providers.github.create({
        signIn: {
          async resolver({ result: { fullProfile } }, ctx) {
            const userId = fullProfile.username;
            if (!userId) {
              throw new Error(
                `GitHub user profile does not contain a username`,
              );
            }

            // Creates an entity
            const userEntity = stringifyEntityRef({
              kind: 'User',
              name: userId,
              namespace: DEFAULT_NAMESPACE,
            });

            const { entity } = await ctx.findCatalogUser({
              entityRef: userEntity,
            });

            const ownership = getDefaultOwnershipEntityRefs(entity);

            return ctx.issueToken({
              claims: {
                sub: userEntity,
                ent: ownership,
              },
            });
          },
        },
      }),
      oauth2Proxy: providers.oauth2Proxy.create({
        signIn: {
          async resolver({ result }, ctx) {
            const name = result.getHeader('x-forwarded-preferred-username');
            if (!name) {
              throw new Error('Request did not contain a user');
            }

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
          },
        },
      }),
    },
  });
}
