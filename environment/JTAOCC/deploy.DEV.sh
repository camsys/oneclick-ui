#!/usr/bin/env bash

## Deploy script for 1click environment

## sync the ./dist directory with the s3 bucket
aws s3 sync ./dist/ s3://ui-jta-dev --acl public-read  --region us-east-1 --profile jta

## Invalidate the cloudfront distribution
#aws configure set preview.cloudfront true
#aws cloudfront create-invalidation \
#    --distribution-id E1O2FWVP0S6LVW \
#    --paths '/*'

