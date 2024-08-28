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

import { Config } from '@backstage/config';
import {
  ProfileTransform,
  OAuthAuthenticatorResult,
  PassportProfile,
} from '@backstage/plugin-auth-node';
import https from 'https';
import { fetchUserInfo } from './utils';

export function openshiftProfileTransform(
  config: Config,
  agent: https.Agent,
): ProfileTransform<OAuthAuthenticatorResult<PassportProfile>> {
  // TODO: Figure out how to get these under `auth.providers.openshift.[authEnv]` or `auth.providers.openshift` instead of under `openshift`
  const openshiftApiUrl = config.getString('openshift.openshiftApiUrl');
  return async input => {
    const { session } = input;
    const user = await fetchUserInfo(
      agent,
      session.accessToken,
      openshiftApiUrl,
    );
    return {
      // Since the `fullProfile` from the `authenticate` function will be empty,
      // we will need to add the `username` field despite the `ProfileInfo` type not having it
      // Therefore, when creating sign-in resolvers, we will need to use the `profile.username` field instead of `fullProfile.userinfo.preferred_username`
      // Openshift User Objects also don't include emails, so we can't map that field
      profile: {
        username: user.metadata.name,
        displayName: user.fullName,
      },
    };
  };
}
