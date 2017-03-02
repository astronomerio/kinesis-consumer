#!/bin/bash

set -e

npm publish

docker build -t astronomerio/kinesis-consumer:$CIRCLE_TAG .

# login to Docker Hub
docker login -e $DOCKER_EMAIL -u $DOCKER_USER -p $DOCKER_PASS

# push the versioned builds
docker push astronomerio/kinesis-consumer:$CIRCLE_TAG
