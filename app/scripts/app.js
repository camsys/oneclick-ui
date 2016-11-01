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
  ]).config(function ($routeProvider, $translateProvider) {
    
    // Configure the translation service
    $translateProvider.useSanitizeValueStrategy('escape');
    $translateProvider.useUrlLoader('http://oneclick-pa-dev.camsys-apps.com/api/v1/translations/all');
    $translateProvider.preferredLanguage('en');

    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainController'
      })
      .when('/rides', {
        templateUrl: 'views/rides.html',
        controller: 'MainController'
      })
      .when('/loginError', {
        templateUrl: 'views/login.html',
        controller: 'MainController'
      })
      .when('/authenticateSharedRideId', {
        templateUrl: 'views/login.html',
        controller: 'LoginController'
      })
      .when('/plan', {
        templateUrl: 'views/plan.html',
        controller: 'PlanController'
      })
      .when('/plan/:step/:departid/:returnid', {
        templateUrl: 'views/transit-detail.html',
        controller: 'PlanController'
      })
      .when('/plan/:step', {
        templateUrl: 'views/plan.html',
        controller: 'PlanController'
      })
      .when('/transit/:departid', {
        templateUrl: 'views/transit.html',
        controller: 'TransitController'
      })
      .when('/transit-old/:segmentid/:tripid', {
        templateUrl: 'views/transit.html',
        controller: 'TransitController'
      })
      .when('/transitoptions/:segmentid', {
        templateUrl: 'views/transitoptions.html',
        controller: 'TransitController'
      })
      .when('/transitconfirm', {
        templateUrl: 'views/transitconfirm.html',
        controller: 'TransitController'
      })
      .when('/transit/details/:tripid', {
        templateUrl: 'views/transitconfirm.html',
        controller: 'TransitController'
      })
      .when('/paratransit/:tripid', {
        templateUrl: 'views/paratransit.html',
        controller: 'ParatransitController'
      })
      .when('/walk/confirm', {
        templateUrl: 'views/walk.html',
        controller: 'WalkController'
      })
      .when('/walk/details/:tripid', {
        templateUrl: 'views/walk.html',
        controller: 'WalkController'
      })
      .when('/taxi', {
        templateUrl: 'views/taxi-detail.html',
        controller: 'TaxiController'
      })
      .when('/uber', {
        templateUrl: 'views/uber-detail.html',
        controller: 'UberController'
      })
      .when('/itinerary', {
        templateUrl: 'views/itinerary.html',
        controller: 'ItineraryController'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'PlanController'
      })
      .when('/about/sharedride', {
        templateUrl: 'views/about.html',
        controller: 'PlanController'
      })
      .when('/about/projecthistory', {
        templateUrl: 'views/about.html',
        controller: 'PlanController'
      })
      .when('/profile', {
        templateUrl: 'views/profile.html',
        controller: 'ProfileController'
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
    var exceptions = ["/plan/my_rides", "/about", "/about/sharedride", "/about/projecthistory"];
    $rootScope.$on('$routeChangeStart', function (event) {
      if(!$window.visited){
        if(exceptions.indexOf($location.$$path) < 0){
          $location.path('/');
        }
      }
    });
  });
