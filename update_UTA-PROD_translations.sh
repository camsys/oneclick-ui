#!/usr/bin/env bash

# setup paths
mkdir -p ./dist/translations
touch ./dist/translations/en.json ./dist/translations/es.json

# get the files
curl https://oneclick-uta.herokuapp.com/api/v1/translations/all?lang=en > ./dist/translations/en.json
curl https://oneclick-uta.herokuapp.com/api/v1/translations/all?lang=es > ./dist/translations/es.json

# sync the translations
aws s3 sync ./dist/translations/ s3://1click-uta-demo.camsys-apps.com/translations/ --acl public-read

# invalidate the translations
aws configure set preview.cloudfront true
aws cloudfront create-invalidation \
    --distribution-id E1O2FWVP0S6LVW \
    --paths '/translations/*'


