#!/usr/bin/env bash

## Deploy script for 1click environment

## sync the ./dist directory with the s3 bucket
#aws s3 sync ./dist/ s3://ui-jta-prod.camsys-apps.com/ --acl public-read
aws s3 sync ./dist/ s3://ui-jta-prod --acl public-read  --region us-east-2 --profile jta

## Invalidate the cloudfront distribution
aws configure set preview.cloudfront true
#aws cloudfront create-invalidation \
#    --distribution-id E1O2FWVP0S6LVW \
#    --paths '/*'

