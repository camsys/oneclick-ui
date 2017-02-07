'use strict';

var app = angular.module('oneClickApp');

angular.module('oneClickApp')
.controller('NavbarController', ['$scope', '$location', 'flash', 'planService', 'deviceDetector', 'ipCookie', '$window', '$translate', 'tmhDynamicLocale', '$http',
function ($scope, $location, flash, planService, deviceDetector, ipCookie, $window, $translate, tmhDynamicLocale, $http) {

  var input = document.createElement('input');
  input.setAttribute('type','date');
  var notADateValue = 'not-a-date';
  input.setAttribute('value', notADateValue);
  $scope.debugoff = !!APIHOST.match(/demo/);
  $scope.html5 = !(input.value === notADateValue);
  planService.html5 = $scope.html5;
  $scope.mobile = deviceDetector.isMobile();
  planService.mobile = $scope.mobile;
  $scope.languageOptions = {en:'English', es:'Español'};
  $scope.languageSelected = localStorage.getItem('lang') || 'en';
  $translate.use($scope.languageSelected);
  tmhDynamicLocale.set($scope.languageSelected+'-us');
  var templates = {
    'mode_ride_hailing' : 'rides-itinerary-rideshare.html',
    'mode_paratransit' : 'rides-itinerary-paratransit.html',
    'mode_taxi' : 'rides-itinerary-taxi.html',
    'mode_transit' : 'rides-itinerary-transit.html',
    'mode_rail' : 'rides-itinerary-transit.html',
    'mode_walk' : 'rides-itinerary-walk.html',
    'mode_car' : 'rides-itinerary-walk.html',
    'mode_bicycle' : 'rides-itinerary-walk.html'
  };
  $scope.flash = flash;

  var that = this;
  that.$scope = $scope;

  $scope.reset = function() {
    planService.reset();
    $location.path("/");
  };
  $scope.$on('LoginController:login', function(event, data){
    initialize();
  })
  var changeLanguage = function(key){
    if($scope.languageOptions[key] == undefined){ return false; }
    $translate.use(key);
    tmhDynamicLocale.set(key+'-us');
    $scope.languageSelected = key;
    ipCookie('lang', key);
    localStorage.setItem('lang',key);
    return true;
  }
  $scope.changeLanguage = function(key){
    var postProfileUpdate = function(profile){
      profile.lang = key;
      profile = planService.buildProfileUpdateRequest(profile);
      planService.postProfileUpdate($http, profile); //.then(function(response){console.log('posted',response);});
    }
    //if changing Language was successful and  user is logged in, save the language
    if(true === changeLanguage(key) && planService.email ){
      //use the profile if we have one, or get it then use that
      if(planService.profile){
        postProfileUpdate( planService.profile );
      }else{
        planService.getProfile($http).then( function(){
          if(!response.data){
            console.error('no data');
            return;
          }
          postProfileUpdate(response.data);
        });
      }
    }
  }
  function loadProfile(response){
    if(!response.data){
      console.error('no profile')
      return;
    }
    var profile = response.data;
    //console.log('response', profile);
    $scope.username = profile.first_name +' '+ profile.last_name;
    that.$scope.first_name = profile.first_name;
    that.$scope.last_name = profile.last_name;
    if(profile.lang && profile.lang != $scope.languageSelected ){
      changeLanguage(profile.lang);
    }
  }
  var initialize = function() {
    that.$scope.email = ipCookie('email');
    that.$scope.authentication_token = ipCookie('authentication_token');
    that.$scope.isGuest = (ipCookie('authd') != true);
    that.$scope.first_name = ipCookie('first_name');
    that.$scope.last_name = ipCookie('last_name');
    if(that.$scope.email){
      planService.email = $scope.email;
      planService.authentication_token = $scope.authentication_token;
      planService.getProfile($http)
      .then( loadProfile )
      .catch( console.error );
    }else{
      planService.getGuestToken($http)
      .then(function(response){
        that.$scope.email = response.data.email;
        that.$scope.authentication_token = response.data.authentication_token;
        that.$scope.isGuest = true;
        ipCookie('email', that.$scope.email);
        ipCookie('authentication_token', that.$scope.authentication_token);
        planService.getProfile($http)
        .then( loadProfile )
        .catch( console.error );
      })
      .catch(function(e){
        console.error(e);
      });
    }
  };
  initialize();

  $scope.logout = function() {
    $http.post('//'+APIHOST+'/api/v1/sign_out', {user_token:$scope.authentication_token }, planService.getHeaders() )
    .then(function(response){
      delete ipCookie.remove('email');
      delete ipCookie.remove('authentication_token');
      ipCookie.remove('authd');
      $scope.isGuest = true;
      sessionStorage.clear();
      localStorage.clear();
      delete $scope.email;
      delete planService.email;
      $window.location.href = "#/";
      $window.location.reload();
      planService.to = '';
      planService.from = '';
    })
    .catch(console.error);
  };
  $scope.itineraryTemplate = function( mode ){
    //return a different template depending on mode 
    //return the mode's template, or a "missing template error" template 
    var templatePath = '/views/' + (templates[ mode ] || 'rides-itinerary-templatemissing.html');
    return templatePath;
  }
  $scope.carouselTemplate = function(){
    //switch template depending on languageSelected
    var templatePath = '/views/landing-carousel-' + $scope.languageSelected + '.html';
    return templatePath;
  }
  

}]);

angular.module('oneClickApp').factory('flash', function($rootScope) {
  var currentMessage = '';

  $rootScope.$on('$routeChangeSuccess', function() {
    currentMessage = null;
  });

  return {
    setMessage: function(message) {
      //queue.push(message);
      currentMessage = message;
    },
    getMessage: function() {
      return currentMessage;
    }
  };
});

app.directive('back', ['$window', function($window) {
  return {
    restrict: 'A',
    link: function (scope, elem) {
      elem.bind('click', function () {
        $window.history.back();
      });
    }
  };
}

]);
