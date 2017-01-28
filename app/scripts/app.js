'use strict';

/**
 * @ngdoc overview
 * @name oneClickApp
 * @description
 * # oneClickApp
 *
 * Main module of the application.
 */
angular.module('oneClickApp', [
    'ngAnimate',
    'ngAria',
    'ipCookie',
    'ngMessages',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'angularSpinner',
    'ui.map',
    'ui.utils',
    'autocomplete',
    'ui.bootstrap',
    'dcbClearInput',
    'LocalStorageModule',
    'ng.deviceDetector',
    'ngBootbox',
    'ui.bootstrap.datetimepicker',
    'pascalprecht.translate',
    'tmh.dynamicLocale'
  ]).config(function ($routeProvider, $translateProvider, tmhDynamicLocaleProvider) {
    var defaultLanguage = localStorage.getItem('lang') || 'en';
    // Configure the translation service
    $translateProvider.useSanitizeValueStrategy('escape');
    //$translateProvider.useUrlLoader('//'+APIHOST+'/api/v1/translations/all');
    $translateProvider.useStaticFilesLoader({
      prefix: '/translations/',
      suffix: '.json'
    });
    $translateProvider.preferredLanguage(defaultLanguage);
    tmhDynamicLocaleProvider.localeLocationPattern('/bower_components/angular-i18n/angular-locale_{{locale}}.js');
    tmhDynamicLocaleProvider.defaultLocale(defaultLanguage+'-us');

    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainController'
      })
      .when('/rides', {
        templateUrl: 'views/rides.html',
        controller: 'MainController'
      })
      .when('/my_trips', {
        templateUrl: 'views/myrides.html',
        controller: 'MyridesController'
      })
      .otherwise({
        redirectTo: '/'
      });

  })  //global event handler
  .run(function($rootScope, $window, $location) {
    //Hamburger menu toggle
    $(".navbar-nav li a").click(function (event) {
      // check if window is small enough so dropdown is created
      var toggle = $(".navbar-toggle").is(":visible");
      if (toggle) {
        $(".navbar-collapse").collapse('hide');
      }
    });
    
    $window.$rootScope = $rootScope;
    var exceptions = ["/my_trips"];
    $rootScope.$on('$routeChangeStart', function (event) {
      if(!$window.visited){
        if(exceptions.indexOf($location.$$path) < 0){
          $location.path('/');
        }
      }
    });
  });
