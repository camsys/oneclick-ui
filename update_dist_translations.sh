#!/usr/bin/env bash
curl https://oneclick-uta-qa.herokuapp.com/api/v1/translations/all?lang=en > ./dist/translations/en.json
curl https://oneclick-uta-qa.herokuapp.com/api/v1/translations/all?lang=es > ./dist/translations/es.json
rm ./app/translations/*.json
cp ./dist/translations/*.json ./app/translations/

