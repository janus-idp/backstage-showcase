package config

import (
	"crypto"
	"encoding/base64"
	"fmt"
	"strings"
)

func ValidatePackageIntegrity(input []byte, integrity string) error {
	hashers := map[string]crypto.Hash{
		"sha256": crypto.SHA256,
		"sha512": crypto.SHA512,
		"sha384": crypto.SHA384,
	}

	integritySplit := strings.Split(integrity, "-")
	if len(integritySplit) != 2 {
		return fmt.Errorf("invalid integrity format: %s, should be <algo>-<checksum>", integrity)
	}

	algo := strings.ToLower(integritySplit[0])

	if _, ok := hashers[algo]; !ok {
		return fmt.Errorf("unknown hash algorithm format: %s", algo)
	}

	hasher := hashers[algo].New()
	_, err := hasher.Write(input)
	if err != nil {
		return err
	}

	computedChecksum := base64.StdEncoding.EncodeToString(hasher.Sum(nil))

	if computedChecksum != integritySplit[1] {
		return fmt.Errorf("checksum mismatch, expected: %s, got: %s", integritySplit[1], computedChecksum)
	}
	return nil

}
