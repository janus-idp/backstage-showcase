#!/bin/bash

# Change directory to the root of the project
cd "$(dirname "$0")/.."

# Run the yarn backstage-cli versions:bump command
yarn backstage-cli versions:bump --pattern '@{backstage,roadiehq,immobiliarelabs,janus-idp}/*'

# Find and replace all `"^` instances with `"` in package.json files
echo "Pinning all dependencies..."
find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/dist-dynamic/*" -exec sed -i 's/"\^/"/g' {} \;

# Update the yarn.lock file
echo "Updating lockfile..."
yarn install

# Change directory to the dynamic-plugins/wrappers folder
cd ./dynamic-plugins/wrappers

# Loop through all subdirectories and run yarn install
for dir in */; do
  cd "$dir"

  # Extract the value of the "name" key from package.json
  name=$(jq -r '.name' package.json)

  # Extract the list of keys from the "dependencies" object
  deps=$(jq -r '.dependencies | keys[]' package.json)

  # Loop over each key in the "dependencies" object
  for dep in $deps; do
    # Replace "@" with "" and "/" with "-"
    dep_name=$(echo "$dep" | sed 's/@//g; s/\//-/g')

    # Check if the modified dependency name matches the "name" value
    if [[ "$dep_name" == "$name" ]]; then
      # Extract the version of the matched dependency
      version=$(jq -r ".dependencies[\"$dep\"]" package.json)

      echo "Updating $name to $version..."

      # Update the value of the "version" key in package.json
      jq ".version = \"$version\"" package.json > tmp.json && mv tmp.json package.json

      break
    fi

  done

  echo "Updating $dir/dist-dynamic lockfile..."
  cd ./dist-dynamic
  yarn install

  cd ../..
done