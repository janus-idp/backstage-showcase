import { glob } from "glob";
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

const PACKAGE_JSON_GLOB = "**/package.json";
const IGNORE_GLOB = ["**/node_modules/**", "**/dist-dynamic/**"];

const ROOT_DIR = path.join(__dirname, "../../..");
const DYNAMIC_PLUGINS_DIR = path.join(ROOT_DIR, "dynamic-plugins/wrappers");
const DYNAMIC_PLUGINS_CONFIG_FILE = path.join(ROOT_DIR, 'dynamic-plugins.default.yaml')
const APP_CONFIG_DYNAMIC_PLUGINS_CONFIG_FILE = path.join(ROOT_DIR, 'app-config.dynamic-plugins.yaml')
const IBM_VALUES_SHOWCASE_CONFIG_FILE = path.join(ROOT_DIR, '.ibm/pipelines/value_files/values_showcase.yaml')
const IBM_VALUES_SHOWCASE_RBAC_CONFIG_FILE = path.join(ROOT_DIR, '.ibm/pipelines/value_files/values_showcase-rbac.yaml')
const IBM_VALUES_SHOWCASE_AUTH_PROVIDERS_CONFIG_FILE = path.join(ROOT_DIR, '.ibm/pipelines/value_files/values_showcase-auth-providers.yaml')
const RHDH_OPENSHIFT_SETUP_CONFIG_FILE = path.join(ROOT_DIR, 'scripts/rhdh-openshift-setup/values.yaml')

const wrapperPackageJsonPaths = glob.sync(PACKAGE_JSON_GLOB, {
  cwd: DYNAMIC_PLUGINS_DIR, // Search only within DYNAMIC_PLUGINS_DIR
  ignore: IGNORE_GLOB,
});

type WrapperFrontendPackageJson = {
  name: string;
  backstage: {
    role: 'frontend-plugin';
  };
  scalprum: {
    name: string;
  };
  repository: {
    directory: string;
  }
}

type WrapperBackendPackageJson = {
  name: string;
  backstage: {
    role: 'backend-plugin' | 'backend-plugin-module';
  };
  repository: {
    directory: string;
  }
}

type WrapperPackageJson = WrapperFrontendPackageJson | WrapperBackendPackageJson

type DynamicPluginAppConfig = { dynamicPlugins?: { frontend?: Record<string, unknown> } }

type DynamicPluginsConfig = {
  plugins: { package: string, disabled?: boolean, pluginConfig?: DynamicPluginAppConfig }[]
}

type GlobalDynamicPluginsConfig = {
  global: { dynamic: { plugins: { package: string, disabled?: boolean, pluginConfig?: DynamicPluginAppConfig }[] } }
}

function isFrontendPlugin(packageJson: WrapperPackageJson): packageJson is WrapperFrontendPackageJson {
  return packageJson.backstage.role === 'frontend-plugin'
}

function isBackendPlugin(packageJson: WrapperPackageJson): packageJson is WrapperBackendPackageJson {
  return packageJson.backstage.role === 'backend-plugin' || packageJson.backstage.role === 'backend-plugin-module'
}

function getDifference<T>(arrA: T[], arrB: T[]): T[] {
  return arrA.filter(x => !arrB.includes(x));
}

describe('Dynamic Plugin Wrappers', () => {
  const wrapperPackageJsonFiles = wrapperPackageJsonPaths.map((packageJsonPath) => {
    const packageJson = fs.readFileSync(path.join(DYNAMIC_PLUGINS_DIR, packageJsonPath))
    return JSON.parse(packageJson.toString()) as WrapperPackageJson
  })
  const frontendPackageJsonFiles = wrapperPackageJsonFiles.filter((packageJson) => isFrontendPlugin(packageJson))
  const backendPackageJsonFiles = wrapperPackageJsonFiles.filter((packageJson) => isBackendPlugin(packageJson))

  describe("Backend Plugin", () => {
    it.each(backendPackageJsonFiles)('$name should have a `-dynamic` suffix in the directory name', ({ name, repository }) => {
      expect(wrapperPackageJsonPaths.some((value) => value.includes(`${name}-dynamic`))).toBeTruthy()
      expect(repository.directory).toBe(`dynamic-plugins/wrappers/${name}-dynamic`)
    })
  })

  describe("Frontend Plugin", () => {
    it.each(frontendPackageJsonFiles)('$name should have a matching directory name', ({ name, repository }) => {
      expect(wrapperPackageJsonPaths.some((value) => value.includes(name))).toBeTruthy()
      expect(repository.directory).toBe(`dynamic-plugins/wrappers/${name}`)
    })

    it.each(frontendPackageJsonFiles)('$name should have scalprum config in the `package.json`', ({ name, scalprum }) => {
      expect(scalprum).toBeTruthy()
    })
  })

  describe('(dynamic-plugins.default.yaml) should have a valid config', () => {
    const dynamicPluginsConfig = yaml.parse(fs.readFileSync(DYNAMIC_PLUGINS_CONFIG_FILE).toString()) as DynamicPluginsConfig

    it('should have a corresponding package', () => {
      const dynamicPluginsPackageNames = dynamicPluginsConfig.plugins.reduce((packageNames, plugin) => {
        // We want the third index ['.', 'dynamic-plugins', 'dist', 'backstage-plugin-scaffolder-backend-module-github-dynamic']
        packageNames.push(plugin.package.split('/')[3])

        return packageNames
      }, [] as string[])

      // remove `\\package.json` suffix
      const wrapperDirNames = wrapperPackageJsonPaths.map((value) => value.substring(0, value.length - 13))

      const difference = getDifference(dynamicPluginsPackageNames, wrapperDirNames)

      expect(difference).toStrictEqual([])
    })

    it.each(frontendPackageJsonFiles)('$scalprum.name should exist in the config', ({ scalprum }) => {
      expect(dynamicPluginsConfig.plugins.some((plugin) => Object.keys(plugin.pluginConfig?.dynamicPlugins?.frontend ?? {}).includes(scalprum.name))).toBeTruthy()
    })
  })

  describe('(app-config.dynamic-plugins.yaml) should have a valid config', () => {
    const dynamicPluginsConfig = yaml.parse(fs.readFileSync(APP_CONFIG_DYNAMIC_PLUGINS_CONFIG_FILE).toString()) as DynamicPluginAppConfig

    it.each(frontendPackageJsonFiles)('$scalprum.name should exist in the config', ({ scalprum }) => {
      expect(Object.keys(dynamicPluginsConfig?.dynamicPlugins?.frontend ?? {}).includes(scalprum.name)).toBeTruthy()
    })
  })

  describe('(ibm: values_showcase.yaml) should have a valid config', () => {
    const valuesShowcase = yaml.parse(fs.readFileSync(IBM_VALUES_SHOWCASE_CONFIG_FILE).toString()) as GlobalDynamicPluginsConfig

    it('should have a corresponding package', () => {
      const dynamicPluginsPackageNames = valuesShowcase.global.dynamic.plugins.reduce((packageNames, plugin) => {
        // We want the third index ['.', 'dynamic-plugins', 'dist', 'backstage-plugin-scaffolder-backend-module-github-dynamic']
        packageNames.push(plugin.package.split('/')[3])

        return packageNames
      }, [] as string[])

      // remove `\\package.json` suffix
      const wrapperDirNames = wrapperPackageJsonPaths.map((value) => value.substring(0, value.length - 13))

      const difference = getDifference(dynamicPluginsPackageNames, wrapperDirNames)

      expect(difference).toStrictEqual([])
    })
  })

  describe('(ibm: values_showcase-rbac.yaml) should have a valid config', () => {
    const valuesShowcase = yaml.parse(fs.readFileSync(IBM_VALUES_SHOWCASE_RBAC_CONFIG_FILE).toString()) as GlobalDynamicPluginsConfig

    it('should have a corresponding package', () => {
      const dynamicPluginsPackageNames = valuesShowcase.global.dynamic.plugins.reduce((packageNames, plugin) => {
        // We want the third index ['.', 'dynamic-plugins', 'dist', 'backstage-plugin-scaffolder-backend-module-github-dynamic']
        packageNames.push(plugin.package.split('/')[3])

        return packageNames
      }, [] as string[])

      // remove `\\package.json` suffix
      const wrapperDirNames = wrapperPackageJsonPaths.map((value) => value.substring(0, value.length - 13))

      const difference = getDifference(dynamicPluginsPackageNames, wrapperDirNames)

      expect(difference).toStrictEqual([])
    })
  })

  describe('(ibm: values_showcase_auth-providers.yaml) should have a valid config', () => {
    const valuesShowcase = yaml.parse(fs.readFileSync(IBM_VALUES_SHOWCASE_AUTH_PROVIDERS_CONFIG_FILE).toString()) as GlobalDynamicPluginsConfig

    it('should have a corresponding package', () => {
      const dynamicPluginsPackageNames = valuesShowcase.global.dynamic.plugins.reduce((packageNames, plugin) => {
        // We want the third index ['.', 'dynamic-plugins', 'dist', 'backstage-plugin-scaffolder-backend-module-github-dynamic']
        packageNames.push(plugin.package.split('/')[3])

        return packageNames
      }, [] as string[])

      // remove `\\package.json` suffix
      const wrapperDirNames = wrapperPackageJsonPaths.map((value) => value.substring(0, value.length - 13))

      const difference = getDifference(dynamicPluginsPackageNames, wrapperDirNames)

      expect(difference).toStrictEqual([])
    })
  })

  describe('(rhdh-openshift-setup: values.yaml) should have a valid config', () => {
    const valuesShowcase = yaml.parse(fs.readFileSync(RHDH_OPENSHIFT_SETUP_CONFIG_FILE).toString()) as GlobalDynamicPluginsConfig

    it('should have a corresponding package', () => {
      const dynamicPluginsPackageNames = valuesShowcase.global.dynamic.plugins.reduce((packageNames, plugin) => {
        // We want the third index ['.', 'dynamic-plugins', 'dist', 'backstage-plugin-scaffolder-backend-module-github-dynamic']
        packageNames.push(plugin.package.split('/')[3])

        return packageNames
      }, [] as string[])

      // remove `\\package.json` suffix
      const wrapperDirNames = wrapperPackageJsonPaths.map((value) => value.substring(0, value.length - 13))

      const difference = getDifference(dynamicPluginsPackageNames, wrapperDirNames)

      expect(difference).toStrictEqual([])
    })
  })
})