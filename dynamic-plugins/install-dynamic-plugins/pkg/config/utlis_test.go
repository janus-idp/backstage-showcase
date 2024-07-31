package config

import "testing"

func TestValidatePackageIntegrity(t *testing.T) {
	tests := []struct {
		name      string
		input     []byte
		integrity string
		wantErr   bool
	}{
		{
			name:      "valid sha256 checksum",
			input:     []byte("test data"),
			integrity: "sha256-kW8AJ6V1B0znKjMXd8NHjWUT94alkb2JLaGld78jNfk=",
			wantErr:   false,
		},
		{
			name:      "valid sha512 checksum",
			input:     []byte("test data"),
			integrity: "sha512-Dh4h7PEF7IU9JNcohnrXBhPCFmOkaTB0sqNhnBvTnWa1iMM3I7tGbHJCToDjymPCSQeKs0e6uUKFAOfuQwWdDQ==",
			wantErr:   false,
		},
		{
			name:      "invalid checksum",
			input:     []byte("test data"),
			integrity: "sha256-abc123",
			wantErr:   true,
		},
		{
			name:      "invalid integrity format",
			input:     []byte("test data"),
			integrity: "invalid",
			wantErr:   true,
		},
		{
			name:      "unknown hash algo format",
			input:     []byte("test data"),
			integrity: "invalid-abc123",
			wantErr:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePackageIntegrity(tt.input, tt.integrity)
			if (err != nil) != tt.wantErr {
				t.Errorf("validatePackageIntegrity() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
