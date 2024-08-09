package npm

import (
	"bytes"
	"fmt"
	"log"
	"os/exec"
	"path/filepath"
	"strings"
)

// npmPack runs npm pack command to create a tarball of the npm package and saves it to the outputDir
// baseDir is the directory where the npm pack will be executed, this is important when packageName is local directory relative
// returns full path to the tarball
func NpmPack(packageName string, baseDir string, outputDir string) string {
	stdout := &bytes.Buffer{}
	stderr := &bytes.Buffer{}
	cmd := exec.Command("npm", "pack", "--pack-destination", outputDir, packageName)
	cmd.Dir = baseDir
	log.Printf("Running command: %s in %s\n", cmd.String(), cmd.Dir)
	cmd.Stdout = stdout
	cmd.Stderr = stderr
	err := cmd.Run()
	if err != nil {
		fmt.Printf("npm pack error: %s\n", stderr.String())
		fmt.Printf("npm pack stdout: %s\n", stdout.String())
		panic(err)
	}
	filename := strings.TrimSpace(stdout.String())
	return filepath.Join(outputDir, filename)

}
