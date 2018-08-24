#!/usr/bin/env bash

## Deploy script for 1click environment

## sync the ./dist directory with the s3 bucket
#aws s3 sync ./dist/ s3://1click-qa.camsys-apps.com/ --acl public-read
aws s3 sync ./dist/ s3://ui-jta-qa --acl public-read  --region us-east-1 --profile jta

## Invalidate the cloudfront distribution
#aws configure set preview.cloudfront true
#aws cloudfront create-invalidation \
#    --distribution-id E107CYV4E4P5UE \
#    --paths '/*'

