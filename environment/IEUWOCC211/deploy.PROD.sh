#!/usr/bin/env bash

## Deploy script for 1click environment

## sync the ./dist directory with the s3 bucket
##aws s3 sync ./dist/ s3://occ-ieuw-211-prod --acl public-read  --region us-west-1 --profile ieuw
aws s3 sync ./dist/ s3://www.211ride.org --acl public-read  --region us-west-1 --profile ieuw
##aws s3 sync ./dist/ s3://211ride.org --acl public-read  --region us-west-1 --profile ieuw

## Invalidate the cloudfront distribution
#aws configure set preview.cloudfront true
#aws cloudfront create-invalidation \
#    --distribution-id E1O2FWVP0S6LVW \
#    --paths '/*'

