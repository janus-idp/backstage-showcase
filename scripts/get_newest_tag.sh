#!/bin/bash

# Function to compare two version numbers with letter patch version
compare_versions() {
    local version1=$1
    local version2=$2

    local IFS=.
    local i version1Array=($version1) version2Array=($version2)

    for i in "${!version1Array[@]}"; do
        if [[ -z ${version2Array[i]} ]]; then
            version2Array[i]=0
        fi

        if [[ ${version1Array[i]} == [0-9]* && ${version2Array[i]} == [0-9]* ]]; then
            if ((10#${version1Array[i]} < 10#${version2Array[i]})); then
                echo -1
                return
            elif ((10#${version1Array[i]} > 10#${version2Array[i]})); then
                echo 1
                return
            fi
        elif [[ ${version1Array[i]} != [0-9]* && ${version2Array[i]} == [0-9]* ]]; then
            echo 1
            return
        elif [[ ${version1Array[i]} == [0-9]* && ${version2Array[i]} != [0-9]* ]]; then
            echo -1
            return
        else
            if [[ ${version1Array[i]} < ${version2Array[i]} ]]; then
                echo -1
                return
            elif [[ ${version1Array[i]} > ${version2Array[i]} ]]; then
                echo 1
                return
            fi
        fi
    done

    echo 0
}

# Get the list of tags starting with 'v'
tags=$(git tag -l 'v*')

newest_version="0.0.a"

for tag in $tags; do
    version=${tag#v} # Remove the 'v' prefix
    if [[ $(compare_versions $version $newest_version) -eq 1 ]]; then
        newest_version=$version
    fi
done

echo $newest_version

