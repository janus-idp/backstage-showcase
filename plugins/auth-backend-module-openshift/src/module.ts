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
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import {
  authProvidersExtensionPoint,
  createOAuthProviderFactory,
} from '@backstage/plugin-auth-node';
import { openshiftAuthenticator } from './authenticator';
import { openshiftSignInResolvers } from './resolvers';
import { openshiftProfileTransform } from './profileTransformer';

import { bufferFromFileOrString } from './utils';
import https from 'https';

/** @public */
export const authModuleOpenshift = createBackendModule({
  pluginId: 'auth',
  moduleId: 'openshift-provider',
  register(reg) {
    reg.registerInit({
      deps: {
        providers: authProvidersExtensionPoint,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
      },
      async init({ providers, logger, config }) {
        // TODO: Figure out how to get these under `auth.providers.openshift.[authEnv]` or `auth.providers.openshift` instead of under `openshift`
        const skipTlsVerify = config.getOptionalBoolean(
          'openshift.skipTlsVerify',
        );
        const caFile = config.getOptionalString('openshift.caFile');
        const caData = config.getOptionalString('openshift.caData');
        const httpsAgent = new https.Agent({
          rejectUnauthorized:
            skipTlsVerify !== undefined ? !skipTlsVerify : true,
          ca: bufferFromFileOrString(caFile, caData)?.toString(),
        });
        providers.registerProvider({
          providerId: 'openshift',
          factory: createOAuthProviderFactory({
            authenticator: openshiftAuthenticator(config, logger, httpsAgent),
            profileTransform: openshiftProfileTransform(config, httpsAgent),
            signInResolverFactories: {
              ...openshiftSignInResolvers,
            },
          }),
        });
      },
    });
  },
});
