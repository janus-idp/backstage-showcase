/*
 * Copyright 2022 The Backstage Authors
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

/*
 * This is a fixed version of the upstream `catalogModuleBitbucketCloudEntityProvider.ts` that had a bug at line 43:
 * https://github.com/backstage/backstage/blob/c1742c625484a73f24d86d761cba3544e29bffcd/plugins/catalog-backend-module-bitbucket-cloud/src/module/catalogModuleBitbucketCloudEntityProvider.ts#L43
 *
 * This file should be removed and the upstream module be used as soon as issue
 * https://github.com/backstage/backstage/issues/22932 is fixed.
 *
 */

import { loggerToWinstonLogger } from '@backstage/backend-common';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import {
  catalogProcessingExtensionPoint,
  catalogServiceRef,
} from '@backstage/plugin-catalog-node/alpha';
import { BitbucketCloudEntityProvider } from '@backstage/plugin-catalog-backend-module-bitbucket-cloud';

export const catalogModuleBitbucketCloudEntityProvider = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'bitbucket-cloud-entity-provider',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        catalogApi: catalogServiceRef,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
        tokenManager: coreServices.tokenManager,
      },
      async init({
        catalog,
        catalogApi,
        config,
        logger,
        scheduler,
        tokenManager,
      }) {
        const winstonLogger = loggerToWinstonLogger(logger);
        const providers = BitbucketCloudEntityProvider.fromConfig(config, {
          catalogApi,
          logger: winstonLogger,
          scheduler,
          tokenManager,
        });

        catalog.addEntityProvider(providers);
      },
    });
  },
});
