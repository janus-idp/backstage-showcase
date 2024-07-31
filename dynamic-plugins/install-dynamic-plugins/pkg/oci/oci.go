package oci

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/janus-idp/backstage-showcase/dynamic-plugins/install-dynamic-plugins/pkg/tar"

	ocispec "github.com/opencontainers/image-spec/specs-go/v1"
	"oras.land/oras-go/v2/content"
	"oras.land/oras-go/v2/registry/remote"
)

var logger = log.New(os.Stdout, "logger: ", log.Lshortfile)

// parseOciPluginId parses the pluginId and returns the image, tag and pluginPath
// The pluginId is in the format oci://<image>:<tag>!<pluginPath>
func parseOciPluginId(pluginId string) (string, string, string, error) {
	//TODO: add support for digest
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

	log.Printf("parsed from plugin oci image: %s, tag: %s, pluginPath: %s\n", image, tag, pluginPath)
	return image, tag, pluginPath, nil
}

func extractDirectoryFromImage(ctx context.Context, repo *remote.Repository, manifest ocispec.Manifest, pluginDirectory string, outputDir string) error {

	for _, layer := range manifest.Layers {

		log.Printf("extracting files from directory %s from %s layer\n", pluginDirectory, layer.Digest)
		rc, err := repo.Fetch(ctx, layer)
		if err != nil {
			return err
		}
		defer rc.Close()
		layerBlob, err := content.ReadAll(rc, layer)
		if err != nil {
			return err
		}

		var buf bytes.Buffer
		buf.Write(layerBlob)
		uncompressedLayer, err := gzip.NewReader(&buf)
		if err != nil {
			return err
		}

		err = tar.ExtractTar(uncompressedLayer, outputDir, tar.ExtractTarOptions{ExtractDir: pluginDirectory})
		if err != nil {
			return err
		}

	}
	return nil
}
func getManifest(ctx context.Context, repo *remote.Repository, descriptor ocispec.Descriptor) (*ocispec.Manifest, error) {
	rc, err := repo.Fetch(ctx, descriptor)
	if err != nil {
		return nil, err
	}
	defer rc.Close()

	layerBlob, err := content.ReadAll(rc, descriptor)
	if err != nil {
		return nil, err
	}

	var manifest ocispec.Manifest

	err = json.Unmarshal(layerBlob, &manifest)
	if err != nil {
		return nil, err
	}

	return &manifest, nil

}

// ExtractPluginFromImage extracts plugin files from the image and writes
// it to the outputDir under the pluginId subdirectory
func ExtractPluginFromImage(pluginId string, outputDir string) error {
	image, tag, pluginPath, err := parseOciPluginId(pluginId)
	if err != nil {
		log.Panic(err)
	}

	repo, err := remote.NewRepository(image)
	if err != nil {
		log.Panic(err)
	}

	ctx := context.Background()

	descriptor, err := repo.Resolve(ctx, tag)
	if err != nil {
		log.Panic(err)
	}
	log.Printf("using tag: %s, digest: %s\n", tag, descriptor.Digest)

	manifest, err := getManifest(ctx, repo, descriptor)
	if err != nil {
		log.Panic(err)
	}
	if len(manifest.Layers) == 0 {
		panic("no layers found")
	}

	err = extractDirectoryFromImage(ctx, repo, *manifest, pluginPath, outputDir)
	if err != nil {
		panic(err)
	}

	return nil
}
