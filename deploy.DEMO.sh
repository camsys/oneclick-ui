#!/usr/bin/env bash
aws s3 sync ./dist/ s3://1click-demo.camsys-apps.com/ --acl public-read --region us-west-2

if [ "$1" == "invalidate" ]
then
aws configure set preview.cloudfront true
aws cloudfront create-invalidation \
    --distribution-id E2Q6A8WGOUD62Y \
    --paths '/*'
fi

