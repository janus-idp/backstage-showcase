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

import { Strategy as Oauth2Strategy } from 'passport-oauth2';
import {
  createOAuthAuthenticator,
  PassportOAuthAuthenticatorHelper,
  PassportOAuthDoneCallback,
  PassportProfile,
} from '@backstage/plugin-auth-node';
import { Config } from '@backstage/config';
import { LoggerService } from '@backstage/backend-plugin-api';
import { isValidUrl, logoutUser } from './utils';
import https from 'https';

/** @public */
export const openshiftAuthenticator = (
  openshiftConfig: Config,
  logger: LoggerService,
  agent: https.Agent,
) => {
  // TODO: Figure out how to get these under `auth.providers.openshift.[authEnv]` or `auth.providers.openshift` instead of under `openshift`
  const openshiftApiUrl = openshiftConfig.getString(
    'openshift.openshiftApiUrl',
  );
  if (!isValidUrl(openshiftApiUrl)) {
    throw Error('Invalid openshiftApiUrl');
  }
  return createOAuthAuthenticator({
    defaultProfileTransform:
      PassportOAuthAuthenticatorHelper.defaultProfileTransform,
    initialize({ callbackUrl, config }) {
      const clientId = config.getString('clientId');
      const clientSecret = config.getString('clientSecret');
      const authorizationUrl = config.getString('authorizationUrl');
      const tokenUrl = config.getString('tokenUrl');
      const includeBasicAuth = config.getOptionalBoolean('includeBasicAuth');

      return PassportOAuthAuthenticatorHelper.from(
        new Oauth2Strategy(
          {
            clientID: clientId,
            clientSecret: clientSecret,
            callbackURL: callbackUrl,
            authorizationURL: authorizationUrl,
            tokenURL: tokenUrl,
            passReqToCallback: false,
            customHeaders: includeBasicAuth
              ? {
                  Authorization: `Basic ${encodeClientCredentials(
                    clientId,
                    clientSecret,
                  )}`,
                }
              : undefined,
          },
          (
            accessToken: any,
            refreshToken: any,
            params: any,
            fullProfile: PassportProfile,
            done: PassportOAuthDoneCallback,
          ) => {
            done(
              undefined,
              { fullProfile, params, accessToken },
              { refreshToken },
            );
          },
        ),
      );
    },

    async start(input, helper) {
      return helper.start(input, {
        accessType: 'offline',
        prompt: 'consent',
      });
    },

    async authenticate(input, helper) {
      return helper.authenticate(input);
    },

    async refresh(input, helper) {
      return helper.refresh(input);
    },

    // FIXME: This currently does not work since the `input` actually only returns { req, refreshToken }
    // However, `refreshToken` is undefined for this provider
    // This function is called by: https://github.com/backstage/backstage/blob/36c9f7ab8d1962e731f8b1c95a790548bf717af2/plugins/auth-node/src/oauth/createOAuthRouteHandlers.ts#L269-L272
    // async logout(input, _helper) {
    //   const { accessToken } = input;

    //   try {
    //     // This requires a `user:full` scoped token
    //     await logoutUser(agent, accessToken, openshiftApiUrl);
    //   } catch (err) {
    //     logger.error('Failed to delete oauthaccesstoken', err as Error);
    //     throw err;
    //   }
    // }
  });
};

/** @private */
function encodeClientCredentials(
  clientID: string,
  clientSecret: string,
): string {
  return Buffer.from(`${clientID}:${clientSecret}`).toString('base64');
}
