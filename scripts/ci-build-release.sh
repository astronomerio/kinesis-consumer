#!/bin/bash

set -e

# strip leading v for docker tags
DOCKER_TAG=$(echo $CIRCLE_TAG | cut -c 2-)

docker build -t $IMAGE_NAME:$DOCKER_TAG .

# login to Docker Hub
docker login -e $DOCKER_EMAIL -u $DOCKER_USER -p $DOCKER_PASS

# push the versioned builds
docker push $IMAGE_NAME:$DOCKER_TAG
