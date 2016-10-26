#!/usr/bin/env bash
aws s3 sync ./dist/ s3://1click-dev.camsys-apps.com/ --acl public-read

