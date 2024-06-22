/* eslint-disable @typescript-eslint/no-shadow */

import React from 'react';
import { ConfigReader, defaultConfigLoader } from '@backstage/core-app-api';
import { AnyApiFactory } from '@backstage/core-plugin-api';

import { AppsConfig } from '@scalprum/core';
import { ScalprumProvider } from '@scalprum/react-core';

import overrideBaseUrlConfigs from '../../utils/dynamicUI/overrideBaseUrlConfigs';
import useAsync from 'react-use/lib/useAsync';
import Loader from './Loader';
import { AppConfig } from '@backstage/config';
import { DynamicRoot, StaticPlugins } from './DynamicRoot';
import { DynamicPluginConfig } from '../../utils/dynamicUI/extractDynamicConfig';
import { DynamicRootConfig } from './DynamicRootContext';

export type ScalprumApiHolder = {
  dynamicRootConfig: DynamicRootConfig;
};

const ScalprumRoot = ({
  apis,
  afterInit,
  baseFrontendConfig,
  plugins,
}: {
  // Static APIs
  apis: AnyApiFactory[];
  afterInit: () => Promise<{ default: React.ComponentType }>;
  baseFrontendConfig?: AppConfig;
  plugins?: StaticPlugins;
}) => {
  const { loading, value } = useAsync(
    async (): Promise<{
      dynamicPlugins: DynamicPluginConfig;
      baseUrl: string;
      scalprumConfig?: AppsConfig;
    }> => {
      const appConfig = overrideBaseUrlConfigs(await defaultConfigLoader());
      const reader = ConfigReader.fromConfigs([
        baseFrontendConfig ?? { context: '', data: {} },
        ...appConfig,
      ]);
      const baseUrl = reader.getString('backend.baseUrl');
      const dynamicPlugins = reader.get<DynamicPluginConfig>('dynamicPlugins');
      try {
        const scalprumConfig: AppsConfig = await fetch(
          `${baseUrl}/api/scalprum/plugins`,
        ).then(r => r.json());
        return {
          dynamicPlugins,
          baseUrl,
          scalprumConfig,
        };
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(
          `Failed to fetch scalprum configuration: ${JSON.stringify(err)}`,
        );
        return {
          dynamicPlugins,
          baseUrl,
          scalprumConfig: {},
        };
      }
    },
  );
  if (loading && !value) {
    return <Loader />;
  }
  const { dynamicPlugins, baseUrl, scalprumConfig } = value || {};
  const scalprumApiHolder = {
    dynamicRootConfig: {
      dynamicRoutes: [],
      entityTabOverrides: {},
      mountPoints: {},
      scaffolderFieldExtensions: [],
    } as DynamicRootConfig,
  };
  return (
    <ScalprumProvider<ScalprumApiHolder>
      api={scalprumApiHolder}
      config={scalprumConfig ?? {}}
      pluginSDKOptions={{
        pluginLoaderOptions: {
          transformPluginManifest: manifest => {
            return {
              ...manifest,
              loadScripts: manifest.loadScripts.map(
                (script: string) =>
                  `${baseUrl ?? ''}/api/scalprum/${manifest.name}/${script}`,
              ),
            };
          },
        },
      }}
    >
      <DynamicRoot
        afterInit={afterInit}
        apis={apis}
        dynamicPlugins={dynamicPlugins ?? {}}
        staticPluginStore={plugins}
        scalprumConfig={scalprumConfig ?? {}}
      />
    </ScalprumProvider>
  );
};

export default ScalprumRoot;
