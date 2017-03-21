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

Use `grunt serve` to run locally, modified with options depending on your local setup.

Gruntfile.js accepts these options:
 + __environment__ default _QA_ -- one of the directories in /environment/
 + __port__ default _9000_ -- which port to run the server on
 + __livereload__ default _35729_ -- which port to run the livereload service on
 + __translationhost__ default _PRODUCTION_ -- which api_host in config.json to download translations from
 + __apihost__ default empty -- Specify an api host to use with local servers. defaults to whatever host the browser using but could be any host/port combo like 127.0.0.1:3000

Example: start UTA locally with translations from QA, at http://0.0.0.0:9914, connected to a locally hosted api at http://127.0.0.1:3000 (livereload port specified to allow more than one instance)
```
$ grunt serve --environment=UTA --translationhost=QA --port=9914 --livereload=3573 --apihost=127.0.0.1:3000
```
If you add an entry to `/etc/hosts` and end it with .local, the UI will point to your .local domain for the api_host too (same as localhost, 127.0.0.1 or 0.0.0.0). This way you do not have to specify an apihost, but you need setup a proxy so /api is served by an apihost


If you want to use a different apihost, just specify it in grunt
```
$ grunt serve --environment=UTA --translationhost=QA --port=9914 --livereload=3573 --apihost=oneclick-uta-qa.camsys-apps.com
```


Deploy
================

+ install aws cli tools (http://docs.aws.amazon.com/cli/latest/userguide/installing.html)

+ retreive your AWS user account security keys (you may need to generate them if they don't already exist)

+ run  `aws configure`  to setup your AWS user security credentials (http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-set-up.html).

+ build the application with the command: `grunt --force`

+ execute one of the environment specific deployment scripts (eg. `./deploy.dev.sh` OR `./deploy.dev.sh invalidate` to force cloudfront refresh)


Developer Environment
================
(Optional, based on Josh's mac setup)

Use nginx to proxy local hosts to local grunt servers, and your api host (local or remote)

1. Add hostnames to your /etc/hosts file

  ```
  127.0.0.1	1click-uta.local
  127.0.0.1	1click-gtc.local
  ```
2. Install nginx (skip to 4 if you already run nginx)

  ```
  $ brew install nginx
  ```
3. Edit **~/.bash_profile**

  Add this or choose your own way to start/stop nginx:
  ```
  # Nginx needs to bind to port 80 so must run as /Library/LaunchDaemon with sudo
  alias start-nginx='sudo launchctl load /Library/LaunchDaemons/homebrew.mxcl.nginx.plist'
  alias stop-nginx='sudo launchctl unload /Library/LaunchDaemons/homebrew.mxcl.nginx.plist'
  ```
  Now you can run `start-nginx` or `stop-nginx` to start/stop nginx
4. Edit **/usr/local/etc/nginx/nginx.conf** to listen on your hostname (configured in step 1)

  Requests to http://1click-uta.local/api proxied to http://oneclick-uta.camsys-apps.com/api
  
  Requests to http://1click-uta.local/ proxied to http://localhost:9914/
  ```
  server {
      server_name  1click-uta.local;
      location / {
          proxy_pass http://localhost:9914/;
      }
      location /api{
          proxy_pass http://oneclick-uta.camsys-apps.com/api;
      }
  }
  ```
5. Restart nginx, try 1click-uta.local in your browser. 'bad gateway' means your grunt server or api host isn't connecting.

