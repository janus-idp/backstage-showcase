package main

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"path/filepath"
	"strings"

	"fmt"
	"io"
	"log"
	"os"

	ocispec "github.com/opencontainers/image-spec/specs-go/v1"
	"oras.land/oras-go/v2/content"
	"oras.land/oras-go/v2/registry/remote"
)

// parsePluginId parses the pluginId and returns the image, tag and pluginPath
// The pluginId is in the format oci://<image>:<tag>!<pluginPath>
func parsePluginId(pluginId string) (string, string, string, error) {
	schema, imageTagPlugin, schemaSepFound := strings.Cut(pluginId, "://")
	if !schemaSepFound {
		return "", "", "", fmt.Errorf("invalid pluginId '%s', schema separator '://' not found", pluginId)
	}

	if schema != "oci" {
		return "", "", "", fmt.Errorf("invalid schema '%s', only 'oci' is supported", schema)
	}

	image, tagPlugin, imageSepFound := strings.Cut(imageTagPlugin, ":")
	if !imageSepFound {
		return "", "", "", fmt.Errorf("invalid pluginId '%s', tag separator ':' not found", pluginId)
	}
	tag, pluginPath, tagSepFound := strings.Cut(tagPlugin, "!")
	if !tagSepFound {
		return "", "", "", fmt.Errorf("invalid pluginId '%s', plugin separator '!' not found", pluginId)
	}

	fmt.Printf("parsed pluginID: image: %s, tag: %s, pluginPath: %s\n", image, tag, pluginPath)
	return image, tag, pluginPath, nil
}

func main() {

	if len(os.Args) < 3 {
		fmt.Printf("Usage: %[1]s <pluginId> <dynamic-plugins-root-directory>\nExample: %[1]s 'oci://quay.io/gashcrumb/simple-chat-plugin-registry:0.1.0!internal-backstage-plugin-simple-chat-backend-dynamic' dynamic-plugins-root", os.Args[0])
		os.Exit(1)
	}

	pluginId := os.Args[1]
	outputDir := os.Args[2]

	image, tag, pluginPath, err := parsePluginId(pluginId)
	fmt.Println("pluginPath: ", pluginPath)

	if err != nil {
		panic(err)
	}

	repo, err := remote.NewRepository(image)
	if err != nil {
		panic(err)
	}
	ctx := context.Background()

	descriptor, err := repo.Resolve(ctx, tag)
	if err != nil {
		panic(err)
	}
	fmt.Printf("descriptor: %v\n\n", descriptor)
	rc, err := repo.Fetch(ctx, descriptor)
	if err != nil {
		panic(err)
	}

	defer rc.Close()
	layerBlob, err := content.ReadAll(rc, descriptor)
	if err != nil {
		panic(err)
	}

	var manifest ocispec.Manifest

	err = json.Unmarshal(layerBlob, &manifest)
	if err != nil {
		panic(err)
	}
	fmt.Println(string(layerBlob))
	fmt.Printf("manifest: %v\n\n", manifest)

	if len(manifest.Layers) > 1 {
		panic("too many layers, currently only supports one layer")
	}
	if len(manifest.Layers) == 0 {
		panic("no layers found")
	}

	layer := manifest.Layers[0]
	fmt.Printf("layer: %v\n\n", layer)
	rc, err = repo.Fetch(ctx, layer)
	if err != nil {
		panic(err)
	}
	defer rc.Close()
	layerBlob, err = content.ReadAll(rc, layer)
	if err != nil {
		panic(err)
	}

	var buf bytes.Buffer
	buf.Write(layerBlob)
	uncompressedLayer, err := gzip.NewReader(&buf)
	if err != nil {
		panic(err)
	}

	tr := tar.NewReader(uncompressedLayer)
	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Fatal(err)
		}

		fmt.Println(header.Name, pluginPath)

		// extract only files under the specified pluginPath
		if !strings.HasPrefix(header.Name, pluginPath) {
			continue
		}
		target := filepath.Join(outputDir, header.Name)
		switch header.Typeflag {
		case tar.TypeDir:
			fmt.Println("Creating directory: ", target)
			if _, err := os.Stat(target); err != nil {
				if err := os.MkdirAll(target, 0755); err != nil {
					panic(err)
				}
			}
		case tar.TypeReg:
			fmt.Println("Creating file: ", target)
			f, err := os.OpenFile(target, os.O_CREATE|os.O_RDWR, os.FileMode(header.Mode))
			if err != nil {
				panic(err)
			}

			if _, err := io.Copy(f, tr); err != nil {
				panic(err)
			}

			f.Close()
		}

	}
}
