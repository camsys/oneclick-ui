#!/usr/bin/env bash
aws s3 sync ./dist/ s3://1click-qa.camsys-apps.com/ --acl public-read

if [ "$1" == "invalidate" ]
then
aws configure set preview.cloudfront true
aws cloudfront create-invalidation \
    --distribution-id E107CYV4E4P5UE \
    --paths ./
fi

