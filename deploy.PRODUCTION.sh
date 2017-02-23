#!/usr/bin/env bash
aws s3 sync ./dist/ s3://1click-uta-prod.camsys-apps.com/ --acl public-read

aws configure set preview.cloudfront true
aws cloudfront create-invalidation \
    --distribution-id E1O2FWVP0S6LVW \
    --paths '/*'

