// Generated on 2015-02-01 using generator-angular 0.10.0
'use strict';
// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'
module.exports = function (grunt) {
  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);
  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);
  //include bower json which customizes per deploy
  var bowerConfig = require('./bower.json');
  var environment = grunt.option('environment') || 'QA';
  var host = (grunt.option('host') || 'PRODUCTION');
  var host_key = 'API_HOST_' + host;
  var envPath = './environment/' + environment;
  var distConfig = require(envPath + '/config.json');
  var localhost = grunt.option('localhost') || 'localhost:3000';
  var hostPrefix = grunt.option('prefix') || (host == "LOCAL" ? 'http' : 'https'); // Default to https, unless local.
  // Configurable paths for the application
  var preprocessDefaultContext = Object.assign({
    APP_VERSION: '<%= yeoman.version %>',
    DEBUG: true,
    API_HOST_LOCAL: localhost
  }, distConfig);
  //copy the default context for DIST, with changes like DEBUG:false
  var preprocessDistContext = Object.assign({}, preprocessDefaultContext, { DEBUG: false });
  var appConfig = {
    app: bowerConfig.appPath || 'app',
    appPath: envPath + '/app',
    tmpPath: envPath + '/.tmp',
    dist: envPath + '/dist',
    api_host: preprocessDefaultContext[host_key],
    version: bowerConfig.version || '',
    hostPrefix: hostPrefix
  };
  // Define the configuration for all the tasks
  grunt.initConfig({
    concat: {
      options: { separator: grunt.util.linefeed + ';' + grunt.util.linefeed },
      dist: {
        src: [
          '<%= yeoman.app %>/scripts/{,*/}*.js',
          '<%= yeoman.appPath %>/scripts/config.js'
        ],
        dest: '<%= yeoman.tmpPath %>/scripts/scripts.js'
      }
    },
    // Project settings
    yeoman: appConfig,
    // Watches files for changes and runs tasks based on the changed files
    watch: {
      haml: {
        files: [
          '<%= yeoman.app %>/views/{,*/}*.haml',
          '<%= yeoman.appPath %>/views/{,*/}*.haml'
        ],
        tasks: ['haml:watched']
      },
      coffee: {
        files: [
          '<%= yeoman.app %>/scripts/{,*/}*.coffee',
          '<%= yeoman.appPath %>/scripts/{,*/}*.coffee'
        ],
        tasks: ['coffee:watched']
      },
      bower: {
        files: ['bower.json'],
        tasks: ['wiredep']
      },
      js: {
        files: [
          '<%= yeoman.app %>/scripts/{,*/}*.js',
          '<%= yeoman.appPath %>/scripts/{,*/}*.js'
        ],
        tasks: ['newer:jshint:all'],
        options: { livereload: '<%= connect.options.livereload %>' }
      },
      jsTest: {
        files: ['test/spec/{,*/}*.js'],
        tasks: [
          'newer:jshint:test',
          'karma'
        ]
      },
      compass: {
        files: [
          '<%= yeoman.app %>/styles/{,*/}*.{scss,sass}',
          '<%= yeoman.appPath %>/styles/{,*/}*.{scss,sass}'
        ],
        tasks: [
          'compass:server',
          'autoprefixer'
        ]
      },
      gruntfile: { files: ['Gruntfile.js'] },
      livereload: {
        options: { livereload: '<%= connect.options.livereload %>' },
        files: [
          '<%= yeoman.app %>/{,*/}*.html',
          '{<%= yeoman.tmpPath %>,<%= yeoman.app %>}/views/{,*/}*.html',
          '{<%= yeoman.tmpPath %>,<%= yeoman.app %>}/templates/{,*/}*.html',
          '{<%= yeoman.tmpPath %>,<%= yeoman.app %>}/styles/{,*/}*.css',
          '{<%= yeoman.tmpPath %>,<%= yeoman.app %>}/scripts/{,*/}*.js',
          '<%= yeoman.app %>/data/{,*/}*.*',
          '<%= yeoman.appPath %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
          '<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ]
      }
    },
    // http: {
    //   es_translations: {
    //     options: { url: '<%= yeoman.hostPrefix %>://<%= yeoman.api_host %>/api/v1/translations/all?lang=es' },
    //     dest: '<%= yeoman.appPath %>/translations/es.json'
    //   },
    //   en_translations: {
    //     options: { url: '<%= yeoman.hostPrefix %>://<%= yeoman.api_host %>/api/v1/translations/all?lang=en' },
    //     dest: '<%= yeoman.appPath %>/translations/en.json'
    //   }
    // },
    preprocess: {
      options: { context: preprocessDefaultContext },
      default: {
        options: { context: preprocessDefaultContext },
        src: '<%= yeoman.app %>/index.html',
        dest: '<%= yeoman.tmpPath %>/index.html'
      },
      dist: {
        options: { context: preprocessDistContext },
        src: '<%= yeoman.dist %>/index.html',
        dest: '<%= yeoman.dist %>/index.html'
      }
    },
    // The actual grunt server settings
    connect: {
      options: {
        port: grunt.option('port') || 9000,
        // Change this to '0.0.0.0' to access the server from outside.
        hostname: '0.0.0.0',
        livereload: grunt.option('livereload') || 35729
      },
      livereload: {
        options: {
          open: true,
          middleware: function (connect) {
            return [
              connect.static(appConfig.tmpPath),
              connect().use('/bower_components', connect.static('./bower_components')),
              connect.static(appConfig.appPath),
              connect.static(appConfig.app)
            ];
          }
        }
      },
      test: {
        options: {
          port: 9001,
          middleware: function (connect) {
            return [
              connect.static(appConfig.tmpPath),
              connect.static('test'),
              connect().use('/bower_components', connect.static('./bower_components')),
              connect.static(appConfig.appPath),
              connect.static(appConfig.app)
            ];
          }
        }
      },
      dist: {
        options: {
          open: true,
          base: '<%= yeoman.dist %>'
        }
      }
    },
    // Make sure code styles are up to par and there are no obvious mistakes
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporterOutput: '',
        reporter: require('jshint-stylish')
      },
      all: {
        src: [
          'Gruntfile.js',
          '<%= yeoman.app %>/scripts/{,*/}*.js'
        ]
      },
      test: {
        options: { jshintrc: 'test/.jshintrc' },
        src: ['test/spec/{,*/}*.js']
      }
    },
    // Empties folders to start fresh
    clean: {
      dist: {
        files: [{
            dot: true,
            src: [
              '<%= yeoman.tmpPath %>',
              '<%= yeoman.dist %>/{,*/}*',
              '!<%= yeoman.dist %>/.git{,*/}*'
            ]
          }]
      },
      server: '<%= yeoman.tmpPath %>'
    },
    // Add vendor prefixed styles
    autoprefixer: {
      options: { browsers: ['last 1 version'] },
      dist: {
        files: [{
            expand: true,
            cwd: '<%= yeoman.tmpPath %>/styles/',
            src: '{,*/}*.css',
            dest: '<%= yeoman.tmpPath %>/styles/'
          }]
      }
    },
    // Automatically inject Bower components into the app
    wiredep: {
      app: {
        src: ['<%= yeoman.app %>/index.html'],
        ignorePath: /\.\.\//
      },
      sass: {
        src: [
          '<%= yeoman.app %>/styles/{,*/}*.{scss,sass}',
          '<%= yeoman.appPath %>/styles/{,*/}*.{scss,sass}'
        ],
        ignorePath: /(\.\.\/){1,3}bower_components\//
      }
    },
    coffee: {
      watched: {
        files: [{
            expand: true,
            cwd: '<%= yeoman.app %>/scripts',
            src: '{,*/}*.coffee',
            dest: '<%= yeoman.tmpPath %>/scripts',
            ext: '.js'
          }]
      },
      dist: {
        files: [{
            expand: true,
            cwd: '<%= yeoman.app %>/scripts',
            src: '{,*/}*.coffee',
            dest: '<%= yeoman.dist %>/scripts',
            ext: '.js'
          }]
      },
      test: {
        files: [{
            expand: true,
            cwd: 'test/spec',
            src: '{,*/}*.coffee',
            dest: '<%= yeoman.tmpPath %>/spec',
            ext: '.js'
          }]
      }
    },
    haml: {
      options: { language: 'ruby' },
      watched: {
        files: [
          {
            expand: true,
            cwd: '<%= yeoman.app %>/views',
            src: '{,*/}*.haml',
            dest: '<%= yeoman.tmpPath %>/views',
            ext: '.html'
          },
          {
            expand: true,
            cwd: '<%= yeoman.appPath %>/views',
            src: '{,*/}*.haml',
            dest: '<%= yeoman.tmpPath %>/views',
            ext: '.html'
          }
        ]
      },
      dist: {
        files: [
          {
            expand: true,
            cwd: '<%= yeoman.app %>/views',
            src: '{,*/}*.haml',
            dest: '<%= yeoman.dist %>/views',
            ext: '.html'
          },
          {
            expand: true,
            cwd: '<%= yeoman.appPath %>/views',
            src: '{,*/}*.haml',
            dest: '<%= yeoman.dist %>/views',
            ext: '.html'
          }
        ]
      }
    },
    // Compiles Sass to CSS and generates necessary files if requested
    compass: {
      options: {
        sassDir: '<%= yeoman.app %>/styles',
        cssDir: '<%= yeoman.tmpPath %>/styles',
        generatedImagesDir: '<%= yeoman.tmpPath %>/images/generated',
        imagesDir: '<%= yeoman.app %>/images',
        javascriptsDir: '<%= yeoman.app %>/findmyride/scripts',
        fontsDir: '<%= yeoman.app %>/styles/fonts',
        importPath: [
          './bower_components',
          '<%= yeoman.appPath %>/styles'
        ],
        httpImagesPath: '/images',
        httpGeneratedImagesPath: '/images/generated',
        httpFontsPath: '/styles/fonts',
        relativeAssets: false,
        assetCacheBuster: false,
        raw: 'Sass::Script::Number.precision = 10\n'
      },
      dist: { options: { generatedImagesDir: '<%= yeoman.dist %>/images/generated' } },
      server: { options: { debugInfo: true } }
    },
    // Renames files for browser caching purposes
    filerev: {
      dist: {
        src: [
          '<%= yeoman.dist %>/scripts/{,*/}*.js',
          '<%= yeoman.dist %>/styles/{,*/}*.css',
          '<%= yeoman.app %>/data/{,*/}*.*',
          '<%= yeoman.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
          '<%= yeoman.dist %>/styles/fonts/*'
        ]
      }
    },
    // Reads HTML for usemin blocks to enable smart builds that automatically
    // concat, minify and revision files. Creates configurations in memory so
    // additional tasks can operate on them
    useminPrepare: {
      html: '<%= yeoman.app %>/index.html',
      options: {
        dest: '<%= yeoman.dist %>',
        flow: {
          html: {
            steps: {
              //js: ['concat', 'uglifyjs'],
              js: ['concat'],
              css: ['cssmin']
            },
            post: {}
          }
        }
      }
    },
    // Performs rewrites based on filerev and the useminPrepare configuration
    usemin: {
      html: ['<%= yeoman.dist %>/{,*/}*.html'],
      css: ['<%= yeoman.dist %>/styles/{,*/}*.css'],
      options: {
        assetsDirs: [
          '<%= yeoman.dist %>',
          '<%= yeoman.dist %>/images'
        ]
      }
    },
    // The following *-min tasks will produce minified files in the dist folder
    // By default, your `index.html`'s <!-- Usemin block --> will take care of
    // minification. These next options are pre-configured if you do not wish
    // to use the Usemin blocks.
    // cssmin: {
    //   dist: {
    //     files: {
    //       '<%= yeoman.dist %>/styles/main.css': [
    //         '.tmp/styles/{,*/}*.css'
    //       ]
    //     }
    //   }
    // },
    // uglify: {
    //   dist: {
    //     files: {
    //       '<%= yeoman.dist %>/scripts/scripts.js': [
    //         '<%= yeoman.dist %>/scripts/scripts.js'
    //       ]
    //     }
    //   }
    // },
    // concat: {
    //   dist: {}
    // },
    cssmin: {
      dist: {
        files: [{
            expand: true,
            cwd: '<%= yeoman.tmpPath %>/styles',
            src: ['*.css'],
            dest: '<%= yeoman.dist %>/styles'
          }]
      }
    },
    uglify: {
      dist: {
        files: {
          '<%= yeoman.dist %>/scripts/scripts.js': ['<%= yeoman.dist %>/scripts/scripts.js'],
          '<%= yeoman.dist %>/scripts/vendor.js': ['<%= yeoman.dist %>/scripts/vendor.js']
        }
      }
    },
    imagemin: {
      dist: {
        files: [
          {
            expand: true,
            cwd: '<%= yeoman.app %>/images',
            src: '{,*/}*.{png,jpg,jpeg,gif}',
            dest: '<%= yeoman.dist %>/images'
          },
          {
            expand: true,
            cwd: '<%= yeoman.appPath %>/images',
            src: '{,*/}*.{png,jpg,jpeg,gif}',
            dest: '<%= yeoman.dist %>/images'
          }
        ]
      }
    },
    svgmin: {
      dist: {
        files: [
          {
            expand: true,
            cwd: '<%= yeoman.app %>/images',
            src: '{,*/}*.svg',
            dest: '<%= yeoman.dist %>/images'
          },
          {
            expand: true,
            cwd: '<%= yeoman.appPath %>/images',
            src: '{,*/}*.svg',
            dest: '<%= yeoman.dist %>/images'
          }
        ]
      }
    },
    htmlmin: {
      dist: {
        options: {
          collapseWhitespace: true,
          conservativeCollapse: true,
          collapseBooleanAttributes: true,
          removeCommentsFromCDATA: true,
          removeOptionalTags: true
        },
        files: [{
            expand: true,
            cwd: '<%= yeoman.dist %>',
            src: [
              '*.html',
              'views/{,*/}*.html'
            ],
            dest: '<%= yeoman.dist %>'
          }]
      }
    },
    // ng-annotate tries to make the code safe for minification automatically
    // by using the Angular long form for dependency injection.
    ngAnnotate: {
      dist: {
        files: [{
            expand: true,
            cwd: '<%= yeoman.dist %>/scripts',
            src: [
              'scripts.js',
              'vendor.js',
              '!oldieshim.js'
            ],
            dest: '<%= yeoman.dist %>/scripts'
          }]
      }
    },
    // Replace Google CDN references
    cdnify: { dist: { html: ['<%= yeoman.dist %>/*.html'] } },
    // Copies remaining files to places other tasks can use
    copy: {
      dist: {
        files: [
          {
            expand: true,
            dot: true,
            cwd: '<%= yeoman.app %>',
            dest: '<%= yeoman.dist %>',
            src: [
              '*.{ico,png,txt}',
              '.htaccess',
              '*.html',
              'views/{,*/}*.html',
              'styles/{,*/}*.css',
              'images/{,*/}*.*',
              'assets/{,*/}*.*',
              'translations/{,*/}*.json',
              'fonts/{,*/}*.*',
              'data/{,*/}*.*'
            ]
          },
          {
            expand: true,
            cwd: '<%= yeoman.appPath %>',
            dest: '<%= yeoman.dist %>',
            src: [
              '*.{ico,png,txt}',
              '.htaccess',
              '*.html',
              'views/{,*/}*.html',
              'styles/{,*/}*.css',
              'images/{,*/}*.*',
              'assets/{,*/}*.*',
              'translations/{,*/}*.json',
              'fonts/{,*/}*.*',
              'data/{,*/}*.*'
            ]
          },
          {
            expand: true,
            cwd: '<%= yeoman.tmpPath %>/images',
            dest: '<%= yeoman.dist %>/images',
            src: ['generated/*']
          },
          {
            expand: true,
            cwd: '<%= yeoman.tmpPath %>/scripts',
            dest: '<%= yeoman.dist %>/scripts',
            src: ['scripts.js']
          },
          {
            expand: true,
            cwd: '<%= yeoman.tmpPath %>/styles',
            dest: '<%= yeoman.dist %>/styles',
            src: ['**']
          },
          {
            expand: true,
            cwd: '.',
            src: [
              'bower_components/bootstrap-only-sass/fonts/bootstrap/*',
              'bower_components/moment/locale/es.js',
              'bower_components/angular-i18n/*-us.js'
            ],
            dest: '<%= yeoman.dist %>'
          }
        ]
      },
      styles: {
        files: [
          {
            expand: true,
            cwd: '<%= yeoman.app %>/styles',
            dest: '<%= yeoman.tmpPath %>/styles/',
            src: '{,*/}*.css'
          },
          {
            expand: true,
            cwd: '<%= yeoman.appPath %>/styles',
            dest: '<%= yeoman.tmpPath %>/styles/',
            src: '{,*/}*.css'
          }
        ]
      }
    },
    // Run some tasks in parallel to speed up the build process
    concurrent: {
      server: [
        'http',
        'compass:server'
      ],
      test: ['compass'],
      dist: [
        'http',
        'compass:dist',
        'imagemin',
        'svgmin'
      ]
    },
    // Test settings
    karma: {
      unit: {
        configFile: 'test/karma.conf.js',
        singleRun: true
      }
    },
    //cache bust
    cacheBust: {
      dist: {
        options: {
          deleteOriginals: true,
          baseDir: '<%= yeoman.dist %>',
          assets: [
            'scripts/*.js',
            'images/**',
            'styles/*.css'
          ]
        },
        files: [{
            expand: true,
            cwd: '<%= yeoman.dist %>',
            src: [
              'index.html',
              'scripts/**.js',
              'views/*.html',
              'styles/*.css'
            ]
          }]
      }
    }
  });
  grunt.loadNpmTasks('grunt-preprocess');
  grunt.loadNpmTasks('grunt-http');
  grunt.registerTask('serve', 'Compile then start a connect web server', function (target) {
    if (target === 'dist') {
      return grunt.task.run([
        'build',
        'connect:dist:keepalive'
      ]);
    }
    grunt.task.run([
      'clean:server',
      'wiredep',
      'concurrent:server',
      'coffee:watched',
      'haml:watched',
      'autoprefixer',
      'connect:livereload',
      'preprocess',
      'watch'
    ]);
  });
  grunt.registerTask('server', 'DEPRECATED TASK. Use the "serve" task instead', function (target) {
    grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
    grunt.task.run(['serve:' + target]);
  });
  grunt.registerTask('test', [
    'clean:server',
    'concurrent:test',
    'autoprefixer',
    'connect:test'  // ,
                    // 'karma'
  ]);
  grunt.registerTask('build', [
    'clean:dist',
    'wiredep',
    'coffee:dist',
    'haml:dist',
    'useminPrepare',
    'concurrent:dist',
    'autoprefixer',
    'concat',
    'copy:dist',
    'ngAnnotate',
    'preprocess',
    'cdnify',
    'cssmin:generated',
    'cssmin:dist',
    'usemin',
    'htmlmin',
    'uglify' //,
    // 'cacheBust'
  ]);
  grunt.registerTask('default', [
    'newer:jshint',
    'test',
    'build'
  ]);
};
