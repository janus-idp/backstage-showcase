package config

import (
	"fmt"
	"io"
	"os"
	"path/filepath"

	"dario.cat/mergo"
	"gopkg.in/yaml.v2"
)

type Plugin struct {
	Package      string                 `yaml:"package"`
	Integrity    string                 `yaml:"integrity"`
	Disabled     bool                   `yaml:"disabled"`
	PluginConfig map[string]interface{} `yaml:"pluginConfig"`
}

type Config struct {
	Includes []string `yaml:"includes"`
	Plugins  []Plugin `yaml:"plugins"`
}

// LoadAndFlattenConfig flattens the config by including all the plugins from the included files
// and replacing the plugins with the same package name
// returns the flattened config
// supports only one level of includes
func LoadAndFlattenConfig(pluginsConfigfile string) (*Config, error) {
	// Read the dynamic-plugins.yaml file
	baseConfig := Config{}
	configFile, err := os.Open(pluginsConfigfile)
	if err != nil {
		panic(err)
	}
	defer configFile.Close()
	fileBytes, err := io.ReadAll(configFile)
	if err != nil {
		panic(err)
	}
	err = yaml.Unmarshal(fileBytes, &baseConfig)
	if err != nil {
		panic(err)
	}

	allPlugins := Config{}

	if baseConfig.Includes == nil || len(baseConfig.Includes) == 0 {
		allPlugins.Plugins = baseConfig.Plugins
		return &allPlugins, nil
	}

	for _, include := range baseConfig.Includes {
		includedConfig := Config{}
		includeFile, err := os.Open(filepath.Join(filepath.Dir(pluginsConfigfile), include))
		if err != nil {
			return nil, err
		}
		defer includeFile.Close()
		includeBytes, err := io.ReadAll(includeFile)
		if err != nil {
			return nil, err
		}
		err = yaml.Unmarshal(includeBytes, &includedConfig)
		if err != nil {
			return nil, err
		}

		if includedConfig.Includes != nil && len(includedConfig.Includes) > 0 {
			return nil, fmt.Errorf("includes in included config files are not supported")
		}

		allPlugins.Plugins = append(allPlugins.Plugins, includedConfig.Plugins...)

		for _, configPlugin := range baseConfig.Plugins {
			found := -1
			for i, plugin := range allPlugins.Plugins {
				if configPlugin.Package == plugin.Package {
					found = i
					break
				}
			}
			// if already exists, replace it
			if found != -1 {
				allPlugins.Plugins[found] = configPlugin
			} else {
				allPlugins.Plugins = append(allPlugins.Plugins, configPlugin)
			}
		}

	}
	return &allPlugins, nil
}

// GenerateDynamicPluginsConfig merges the dynamic plugins config for all enabled plugins into
// a signle config that can be loaded by Backstage
func GenerateDynamicPluginsConfig(config Config, rootDirectory string) (map[string]interface{}, error) {
	out := map[string]interface{}{}
	for _, plugin := range config.Plugins {
		if plugin.Disabled {
			continue
		}
		err := mergo.Merge(&out, plugin.PluginConfig, mergo.WithOverride)
		if err != nil {
			return nil, err
		}
	}

	// this is last to make sure that plugins can't override the rootDirectory
	rootDir := map[string]interface{}{
		"dynamicPlugins": map[string]interface{}{
			"rootDirectory": rootDirectory,
		},
	}
	err := mergo.Merge(&out, rootDir, mergo.WithOverride)
	if err != nil {
		return nil, err
	}
	return out, nil
}
