#!/usr/bin/env bash

## Deploy script for 1click environment

## sync the ./dist directory with the s3 bucket
aws s3 sync ./dist/ s3://1click-core-qa.camsys-apps.com/ --acl public-read

## Invalidate the cloudfront distribution
aws configure set preview.cloudfront true
aws cloudfront create-invalidation \
    --distribution-id E20PKEG7A0PCSP \
    --paths '/*'

