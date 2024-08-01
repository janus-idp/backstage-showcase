package main

import (
	"bytes"
	"compress/gzip"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/janus-idp/backstage-showcase/dynamic-plugins/install-dynamic-plugins/pkg/config"
	"github.com/janus-idp/backstage-showcase/dynamic-plugins/install-dynamic-plugins/pkg/npm"
	"github.com/janus-idp/backstage-showcase/dynamic-plugins/install-dynamic-plugins/pkg/oci"
	"github.com/janus-idp/backstage-showcase/dynamic-plugins/install-dynamic-plugins/pkg/tar"

	"gopkg.in/yaml.v2"
)

const APP_CONFIG_NAME = "app-config.dynamic-plugins.yaml"
const SKIP_INTEGRITY_CHECK_ENV_NAME = "SKIP_INTEGRITY_CHECK"

func getPackageType(packageName string) string {
	if len(packageName) > 6 && packageName[:6] == "oci://" {
		return "oci"
	} else {
		return "npm"
	}
}

func handleOciPackage(pkg config.Plugin, outputDir string) {
	err := oci.ExtractPluginFromImage(pkg.Package, outputDir)
	if err != nil {
		panic(err)
	}
	// TODO: how to check integrity?
}

func handleNpmPackage(pkg config.Plugin, baseConfigDir string, outputDir string) {
	tgzFileName := npm.NpmPack(pkg.Package, baseConfigDir, outputDir)

	isLocalPackage := false
	if strings.HasPrefix(pkg.Package, "./") {
		isLocalPackage = true
	}

	tgzData, err := os.ReadFile(tgzFileName)
	if err != nil {
		panic(err)
	}

	if os.Getenv(SKIP_INTEGRITY_CHECK_ENV_NAME) == "true" {
		log.Printf("Skipping integrity check: disabled by %s=%s", SKIP_INTEGRITY_CHECK_ENV_NAME, os.Getenv(SKIP_INTEGRITY_CHECK_ENV_NAME))
	} else if isLocalPackage {
		log.Println("Skipping integrity check: package is local")
	} else {
		log.Printf("Validating package integrity for %s\n", pkg.Package)
		err = config.ValidatePackageIntegrity(tgzData, pkg.Integrity)
		if err != nil {
			panic(err)
		}
		log.Printf("Package integrity check passed for %s\n", pkg.Package)
	}

	uncompressed, err := gzip.NewReader(bytes.NewReader(tgzData))
	if err != nil {
		panic(err)
	}
	defer uncompressed.Close()

	// directory where package will be extracted to
	packageDir := strings.TrimSuffix(tgzFileName, ".tgz")

	// tgz files from npm pack have "package" root directory, StripComponents: 1 to remove it
	err = tar.ExtractTar(uncompressed, packageDir, tar.ExtractTarOptions{StripComponents: 1})
	if err != nil {
		panic(err)
	}

	// Remove the tgz file
	err = os.Remove(tgzFileName)
	if err != nil {
		panic(err)
	}

}

func main() {
	if len(os.Args) < 3 {
		fmt.Printf("Usage: %[1]s <dynamic-plugins-root-directory> <dynamic-plugins.yaml>\n", os.Args[0])
		fmt.Printf("Example: %[1]s dynamic-plugins-root dynamic-plugins.yaml\n", os.Args[0])
		os.Exit(1)
	}

	// convert to absolute path early to avoid issues with relative paths
	outputDir, err := filepath.Abs(os.Args[1])
	if err != nil {
		log.Fatalf("Error getting absolute path for %s: %v", os.Args[1], err)
	}
	pluginsConfigfile := os.Args[2]

	if _, err := os.Stat(outputDir); os.IsNotExist(err) {
		log.Printf("Output directory %s does not exist, creating new directory", outputDir)
		err := os.MkdirAll(outputDir, 0755)
		if err != nil {
			log.Fatalf("Error creating output directory %s: %v", outputDir, err)
		}
	}

	cfg, err := config.LoadAndFlattenConfig(pluginsConfigfile)
	if err != nil {
		log.Fatalf("Error reading config file: %v", err)
	}

	for _, plugin := range cfg.Plugins {
		if plugin.Disabled {
			log.Printf("Skipping disabled plugin %s\n", plugin.Package)
			continue
		}

		log.Printf("Processing plugin %s\n", plugin.Package)

		packageType := getPackageType(plugin.Package)
		switch packageType {
		case "oci":
			handleOciPackage(plugin, outputDir)
		case "npm":
			handleNpmPackage(plugin, filepath.Dir(pluginsConfigfile), outputDir)
		default:
			log.Fatalf("Unsupported package type %s\n", packageType)
		}
	}

	// Generate dynamic plugins config file and save it to file
	appConfig, err := config.GenerateDynamicPluginsConfig(*cfg, outputDir)
	if err != nil {
		log.Fatalf("Error generating dynamic plugins: %v", err)
	}

	// TODO: this is hack to make it compatible with old python scripts that hardcodes the root directory
	// removing this will require updating Helm Chart default values to make sure that
	// dynamic-plugins-root is mounted in the same place in the initContainer and in the main container
	// currently the initContainer mounts it to /dynamic-plugins-root and the main container mounts it to /opt/app-root/src/dynamic-plugins-root
	// this creates inconsistency and makes it hard to use the same path in both places
	appConfig["dynamicPlugins"] = map[string]interface{}{
		"rootDirectory": "dynamic-plugins-root",
	}

	appConfigBytes, err := yaml.Marshal(appConfig)
	if err != nil {
		log.Fatalf("Error marshalling app config: %v", err)
	}
	appConfigFile, err := os.Create(filepath.Join(outputDir, APP_CONFIG_NAME))
	if err != nil {
		log.Fatalf("Error creating app config file: %v", err)
	}
	defer appConfigFile.Close()
	_, err = appConfigFile.Write(appConfigBytes)
	if err != nil {
		log.Fatalf("Error writing app config file: %v", err)
	}

}
