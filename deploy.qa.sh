#!/usr/bin/env bash
aws s3 sync ./dist/ s3://1click-qa.camsys-apps.com/ --acl public-read

