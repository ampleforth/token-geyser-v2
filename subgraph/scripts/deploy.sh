#!/bin/bash
set -e

mustache configs/$1.json subgraph.template.yaml > ./subgraph.yaml

yarn auth $GRAPH_AUTH

yarn codegen

yarn build

yarn graph deploy \
	--product hosted-service \
	--access-token $GRAPH_AUTH $2