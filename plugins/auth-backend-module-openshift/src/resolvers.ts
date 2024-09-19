/*
 * Copyright 2024 The Janus-IDP Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  AuthResolverContext,
  OAuthAuthenticatorResult,
  PassportProfile,
  SignInInfo,
  createSignInResolverFactory,
} from '@backstage/plugin-auth-node';
import { ExtendedProfileInfo } from './types';

/**
 * Available sign-in resolvers for the Openshift auth provider.
 *
 * @public
 */
export namespace openshiftSignInResolvers {
  /**
   * An oidc resolver that looks up the user using their openshift username
   * as the entity name
   */
  export const usernameMatchingUserEntityName = createSignInResolverFactory({
    create() {
      return async (
        info: SignInInfo<OAuthAuthenticatorResult<PassportProfile>>,
        ctx: AuthResolverContext,
      ) => {
        const userId = (info.profile as ExtendedProfileInfo).username;

        if (!userId) {
          throw new Error(`Openshift user profile does not contain a username`);
        }
        return await ctx.signInWithCatalogUser({ entityRef: { name: userId } });
      };
    },
  });
}
