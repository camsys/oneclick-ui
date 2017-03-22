1Click
================

Although the app doesn't use ruby, build process requires haml rubygem installed.

You may need to install node.js first.

+ sudo gem install haml

+ sudo gem install compass

+ npm install

+ sudo npm install -g grunt

+ sudo npm install -g bower

+ bower install

+ grunt serve (to test if it's working)


Environments
================

The 1click core is in /app. Customization per install is done by creating a new directory in /environment with a set of configurations.


grunt serve
================

Use `grunt serve` to host the UI locally, with livereload for development.

Gruntfile.js accepts these options:
 + __environment__ default _QA_ -- one of the directories in /environment/
 + __port__ default _9000_ -- which port to run the server on (for running multiple instances)
 + __livereload__ default _35729_ -- which port to run the livereload service on (for running multiple instances)
 + __host__ default _PRODUCTION_ -- which api_host in config.json to download translations from (PRODUCTION, QA, DEV, DEMO)
 + __localhost__ default empty -- api host to use with local servers. defaults to whatever host the browser using but could be any host/port combo like 127.0.0.1:3000

Default for local development of features
```
$ grunt serve
```

Example: start UTA configuration locally with translations from QA, at http://0.0.0.0:9914, connected to a locally hosted api at http://127.0.0.1:3000 (livereload port specified to allow more than one instance)
```
$ grunt serve --environment=UTA --host=QA --port=9914 --livereload=3573 --localhost=127.0.0.1:3000
```

If you want to use a different localhost (for the api calls), just specify it in grunt
```
$ grunt serve --environment=UTA --host=QA --localhost=oneclick-uta-qa.camsys-apps.com
```


Deploy
================

+ install aws cli tools (http://docs.aws.amazon.com/cli/latest/userguide/installing.html)

+ retreive your AWS user account security keys (you may need to generate them if they don't already exist)

+ run  `aws configure`  to setup your AWS user security credentials (http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-set-up.html).

+ build the application with the command: `grunt --force`

+ execute one of the environment specific deployment scripts (eg. `./deploy.dev.sh` OR `./deploy.dev.sh invalidate` to force cloudfront refresh)



