#!/usr/bin/env bash

## Deploy script for 1click environment

## sync the ./dist directory with the s3 bucket
aws s3 sync ./dist/ s3://1click-uta-prod.camsys-apps.com --acl public-read  --region us-east-2 

## Invalidate the cloudfront distribution
##aws configure set preview.cloudfront true
##aws cloudfront create-invalidation \
##    --distribution-id E1O2FWVP0S6LVW \
##    --paths '/*'

