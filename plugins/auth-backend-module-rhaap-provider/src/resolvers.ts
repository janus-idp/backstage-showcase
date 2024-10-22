import {
  AuthResolverContext,
  createSignInResolverFactory,
  OAuthAuthenticatorResult,
  PassportProfile,
  SignInInfo,
} from '@backstage/plugin-auth-node';

export namespace AAPAuthSignInResolvers {
  export const usernameMatchingUser = createSignInResolverFactory({
    create() {
      return async (
        info: SignInInfo<OAuthAuthenticatorResult<PassportProfile>>,
        ctx: AuthResolverContext,
      ) => {
        const { result } = info;
        const id = result.fullProfile.username;
        if (!id) {
          throw new Error(`Oauth2 user profile does not contain a username`);
        }
        return ctx.signInWithCatalogUser({ entityRef: { name: id } });
      };
    },
  });
}
