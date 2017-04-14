#!/bin/bash

set -e

docker build -t $IMAGE_NAME:latest .

# login to Docker Hub
docker login -e $DOCKER_EMAIL -u $DOCKER_USER -p $DOCKER_PASS

# push the versioned builds
docker push $IMAGE_NAME:latest
