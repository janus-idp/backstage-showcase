package tar

import (
	"archive/tar"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
)

type ExtractTarOptions struct {
	// When set, only files under this directory will be extracted
	ExtractDir string

	// Number of leading path components to strip from extracted file paths
	StripComponents int
}

func ExtractTar(tarIO io.Reader, outputDir string, opts ExtractTarOptions) error {
	tr := tar.NewReader(tarIO)
	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
		// extract only files under the specified pluginPath
		if opts.ExtractDir != "" {
			if !strings.HasPrefix(header.Name, opts.ExtractDir) {
				continue
			}
		}

		// strip leading path components
		if opts.StripComponents > 0 {
			parts := strings.SplitN(header.Name, "/", opts.StripComponents+1)
			if len(parts) > opts.StripComponents {
				header.Name = parts[opts.StripComponents]
			}
		}

		target := filepath.Join(outputDir, header.Name)

		switch header.Typeflag {
		case tar.TypeDir:
			if _, err := os.Stat(target); err != nil {
				if err := os.MkdirAll(target, 0755); err != nil {
					return (err)
				}
			}
		case tar.TypeReg:

			// Make sure that parent directory exists, if it does not exist create one
			baseDir := filepath.Dir(target)
			err := os.MkdirAll(baseDir, 0755)
			if err != nil {
				return err
			}

			f, err := os.OpenFile(target, os.O_CREATE|os.O_RDWR, os.FileMode(header.Mode))
			if err != nil {
				return (err)
			}
			if _, err := io.Copy(f, tr); err != nil {
				return (err)
			}
			f.Close()
		case tar.TypeSymlink:
			// Check that the link is not outside of the target directory
			if !filepath.IsAbs(header.Linkname) {
				if filepath.Dir(header.Linkname) == ".." {
					log.Printf("WARNING: skipping symlink %s => %s, it is outside of the target directory\n", header.Linkname, target)
					break
				}
			} else {
				if !strings.HasPrefix(header.Linkname, outputDir) {
					log.Printf("WARNING: skipping symlink %s => %s, it is outside of the target directory\n", header.Linkname, target)
					break
				}
			}

			if err := os.Symlink(header.Linkname, target); err != nil {
				return (err)
			}
		default:
			return fmt.Errorf("unsupported type: %v in %s", header.Typeflag, header.Name)

		}
	}
	return nil
}
