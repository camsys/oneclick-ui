#!/usr/bin/env bash

curl https://oneclick-uta-qa.herokuapp.com/api/v1/translations/all?lang=en > ./dist/translations/en.json
curl https://oneclick-uta-qa.herokuapp.com/api/v1/translations/all?lang=es > ./dist/translations/es.json

aws s3 sync ./dist/ s3://1click-dev.camsys-apps.com/ --acl public-read

aws configure set preview.cloudfront true
aws cloudfront create-invalidation \
    --distribution-id E1EWGNVO71RU9C \
    --paths '/*'

