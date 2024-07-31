package config

import (
	"io"
	"os"
	"path"
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v2"
)

func TestFlattenAndLoadConfig(t *testing.T) {

	testdataDir := "testdata/LoadAndFlattenConfig"

	testCases, err := os.ReadDir(testdataDir)
	if err != nil {
		panic(err)
	}
	for _, testCase := range testCases {
		t.Run(testCase.Name(), func(t *testing.T) {

			testFileName := path.Join(testdataDir, testCase.Name(), "test.yaml")
			resultFileName := path.Join(testdataDir, testCase.Name(), "result.yaml")

			testResult, err := LoadAndFlattenConfig(testFileName)
			assert.Nil(t, err, "error should be nil")

			expectedCfg := Config{}
			expectedFile, err := os.Open(resultFileName)
			if err != nil {
				panic(err)
			}
			defer expectedFile.Close()
			exptectedBytes, err := io.ReadAll(expectedFile)
			if err != nil {
				panic(err)
			}
			err = yaml.Unmarshal(exptectedBytes, &expectedCfg)
			if err != nil {
				panic(err)
			}

			assert.Equal(t, expectedCfg, *testResult, "they should be equal")
		})
	}
}

func TestGenerateDynamicPlugins(t *testing.T) {
	type args struct {
		config        Config
		rootDirectory string
	}
	tests := []struct {
		name string
		args args
		want map[string]interface{}
	}{
		{
			name: "simple",
			args: args{
				config: Config{
					Plugins: []Plugin{
						{
							Package: "test1",
							PluginConfig: map[string]interface{}{
								"key1": "value1",
							},
						},
					},
				},
				rootDirectory: "dir",
			},
			want: map[string]interface{}{
				"key1": "value1",
				"dynamicPlugins": map[string]interface{}{
					"rootDirectory": "dir",
				},
			},
		},
		{
			name: "nested",
			args: args{
				config: Config{
					Plugins: []Plugin{
						{
							Package: "test1",
							PluginConfig: map[string]interface{}{
								"key1": map[string]interface{}{
									"key2": "value2",
								},
							},
						},
					},
				},
				rootDirectory: "dir",
			},
			want: map[string]interface{}{
				"key1": map[string]interface{}{
					"key2": "value2",
				},
				"dynamicPlugins": map[string]interface{}{
					"rootDirectory": "dir",
				},
			},
		},
		{
			name: "two plugins with shared config key",
			args: args{
				config: Config{
					Plugins: []Plugin{
						{
							Package: "test1",
							PluginConfig: map[string]interface{}{
								"key": map[string]interface{}{
									"test1": "value1",
								},
							},
						},
						{
							Package: "test2",
							PluginConfig: map[string]interface{}{
								"key": map[string]interface{}{
									"test2": "value2",
								},
							},
						},
					},
				},
				rootDirectory: "dir",
			},
			want: map[string]interface{}{
				"key": map[string]interface{}{
					"test1": "value1",
					"test2": "value2",
				},
				"dynamicPlugins": map[string]interface{}{
					"rootDirectory": "dir",
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := GenerateDynamicPluginsConfig(tt.args.config, tt.args.rootDirectory)
			if assert.Nil(t, err, "error should be nil") {
				assert.Equal(t, tt.want, got, "they should be equal")
			}
		})
	}
}
