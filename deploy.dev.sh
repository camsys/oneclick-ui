#!/usr/bin/env bash
aws s3 sync ./dist/ s3://1click-dev.camsys-apps.com/ --acl public-read

aws configure set preview.cloudfront true
aws cloudfront create-invalidation \
    --distribution-id E1EWGNVO71RU9C \
    --paths '/*'

