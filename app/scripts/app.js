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
    'ui.map',
    'ui.utils',
    'autocomplete',
    'ui.bootstrap',
    'LocalStorageModule',
    'ng.deviceDetector',
    'ngBootbox',
    'ui.bootstrap.datetimepicker',
    'pascalprecht.translate',
    'tmh.dynamicLocale'
  ]).config(function ($routeProvider, $translateProvider, tmhDynamicLocaleProvider, $provide) {
    //override the translate function to provide translation debug
    $provide.decorator('$translate', [
      '$delegate',
      function myServiceDecorator($delegate)
      {
        var instant = $delegate.instant;
        function debugCheck(translationId) {
          if(DEBUG_TRANSLATE===true){
            return '{{'+translationId+'}}';
          }else{
            return instant.apply($delegate, arguments);
          }
        }
        //override instant method with a method that outputs the translationId if we're debugging
        $delegate.instant = debugCheck;
        return $delegate;
      }
    ]);

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
    moment.locale(defaultLanguage);

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
      .when('/reset_password/:reset_token', {
        templateUrl: 'views/main.html',
        controller: 'MainController'
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
    var exceptions = ['/', '/my_trips'];
    $rootScope.$on('$routeChangeStart', function (event) {
      // redirect user to main page if they try to go to a route not in exceptions, if they havn't visited the main page
      if(!$window.visited && null === $location.$$path.match(/reset_password/)){
        if(exceptions.indexOf($location.$$path) < 0){
          $location.path('/');
        }
      }
    });
    var searchParams = {};
    window.location.search.replace(
      new RegExp( "([^?=&]+)(=([^&]*))?", "g" ),
      function( $0, $1, $2, $3 ){
        searchParams[ $1 ] = $3;
      }
    );
    if(searchParams.reset_password_token){
      //redirect to url with no search param, just angular vars
      location.replace('/#!/reset_password/' + searchParams.reset_password_token);
    }
  });
