#!/bin/bash
set -e

yarn mustache ./configs/$1.json subgraph.template.yaml > ./subgraph.yaml

yarn codegen

yarn build

yarn create-local

yarn deploy-local
