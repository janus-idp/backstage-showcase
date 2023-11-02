import { AppsConfig, processManifest } from '@scalprum/core';
import { ScalprumState } from '@scalprum/react-core';
import { RemotePlugins } from '../../components/DynamicRoot/DynamicRootContext';

const initializeRemotePlugins = async (
  pluginStore: ScalprumState['pluginStore'],
  scalprumConfig: AppsConfig,
  requiredModules: { scope: string; module: string }[],
): Promise<RemotePlugins> => {
  await Promise.all(
    requiredModules.map(({ scope, module }) =>
      processManifest(scalprumConfig[scope].manifestLocation!, scope, module),
    ),
  );
  const remotePlugins = await Promise.all(
    requiredModules.map(({ scope, module }) =>
      pluginStore
        .getExposedModule<{
          [importName: string]: React.ComponentType<{}>;
        }>(scope, module)
        .then(remoteModule => ({
          module,
          scope,
          remoteModule,
        })),
    ),
  );
  const scopedRegistry = remotePlugins.reduce<RemotePlugins>((acc, curr) => {
    if (!acc[curr.scope]) {
      acc[curr.scope] = {};
    }
    if (!acc[curr.scope][curr.module]) {
      acc[curr.scope][curr.module] = {};
    }

    acc[curr.scope][curr.module] = curr.remoteModule;
    return acc;
  }, {});
  return scopedRegistry;
};

export default initializeRemotePlugins;
