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

import {
  LegacyBackendPluginInstaller,
  LegacyPluginEnvironment,
} from '@backstage/backend-plugin-manager';
import {
  EventsBackend,
  HttpPostIngressEventPublisher,
} from '@backstage/plugin-events-backend';
import { HttpPostIngressOptions } from '@backstage/plugin-events-node';
import { Router } from 'express';

export default async function createPlugin(
  env: LegacyPluginEnvironment,
): Promise<Router> {
  const eventsRouter = Router();

  const eventsbackend = new EventsBackend(env.logger).setEventBroker(
    env.eventBroker,
  );

  const ingresses = env.pluginProvider
    .backendPlugins()
    .map(plugin => plugin.installer)
    .filter(
      (installer): installer is LegacyBackendPluginInstaller =>
        installer.kind === 'legacy',
    )
    .flatMap(installer => {
      if (!installer.events) {
        return [];
      }
      return installer.events(eventsbackend, env);
    });

  const http = HttpPostIngressEventPublisher.fromConfig({
    config: env.config,
    ingresses: Object.fromEntries(
      ingresses.map(ingress => [
        ingress.topic,
        ingress as Omit<HttpPostIngressOptions, 'topic'>,
      ]),
    ),
    logger: env.logger,
  });
  http.bind(eventsRouter);
  eventsbackend.addPublishers(http);

  await eventsbackend.start();

  return eventsRouter;
}
