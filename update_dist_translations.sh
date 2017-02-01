#!/usr/bin/env bash
curl http://oneclick-uta-qa.herokuapp.com/api/v1/translations/all?lang=en > ./dist/translations/en.json
curl http://oneclick-uta-qa.herokuapp.com/api/v1/translations/all?lang=es > ./dist/translations/es.json
rm ./app/translations/*.json
cp ./dist/translations/*.json ./app/translations/

