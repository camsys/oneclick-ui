'use strict';

var app = angular.module('oneClickApp');

angular.module('oneClickApp')
  .controller('NavbarController', ['$scope', '$location', 'flash', 'planService', 'deviceDetector', 'ipCookie', '$window', '$translate', '$http',
    function ($scope, $location, flash, planService, deviceDetector, ipCookie, $window, $translate, $http) {

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
      $scope.languageSelected = ipCookie('lang') || 'en';
      $translate.use($scope.languageSelected);

      $scope.flash = flash;

      var that = this;
      that.$scope = $scope;

      $scope.reset = function() {
        planService.reset();
        $location.path("/plan/where");
      };
      $scope.$on('LoginController:login', function(event, data){
        console.log('Navbar: event, data', event, data);
        initialize();
      })
      var changeLanguage = function(key){
        if($scope.languageOptions[key] == undefined){ return false; }
        $translate.use(key);
        $scope.languageSelected = key;
        ipCookie('lang', key);
        return true;
      }
      $scope.changeLanguage = function(key){
        var postProfileUpdate = function(profile){
          profile.lang = key;
          planService.postProfileUpdate($http, profile); //.success(function(data){console.log('posted',data);});
        }
        //if changing Language was successful and  user is logged in, save the language
        if(true === changeLanguage(key) && planService.email ){
          //use the profile if we have one, or get it then use that
          if(planService.profile){
            postProfileUpdate( planService.profile );
          }else{
            planService.getProfile($http).success( postProfileUpdate );
          }
        }
      }

      var initialize = function() {
        that.$scope.email = ipCookie('email');
        that.$scope.authentication_token = ipCookie('authentication_token');
        that.$scope.first_name = ipCookie('first_name');
        that.$scope.last_name = ipCookie('last_name');
        //that.$scope.sharedRideId = ipCookie('sharedRideId');
        if(that.$scope.email){
          planService.email = $scope.email;
          planService.authentication_token = $scope.authentication_token;
          planService.getProfile($http).success(function(profile){
            //console.log('response', profile);
            $scope.username = profile.first_name +' '+ profile.last_name;
            that.$scope.first_name = profile.first_name;
            that.$scope.last_name = profile.last_name;
            if(profile.lang && profile.lang != $scope.languageSelected ){
              changeLanguage(profile.lang);
            }
          });
        }else{
          planService.getProfile($http);
          /*
          that.$scope.email = planService.email;
          that.$scope.authentication_token = planService.authentication_token;
          that.$scope.first_name = planService.first_name;
          that.$scope.last_name = planService.last_name;
          that.$scope.last_name = planService.last_name;
          that.$scope.sharedRideId = planService.sharedRideId;
          that.$scope.walkingDistance = planService.walkingDistance;
          that.$scope.walkingSpeed = planService.walkingSpeed;
          */
        }
        //$scope.rideCount = ipCookie('rideCount');
        //return true;
      };
      initialize();

      $scope.logout = function() {
        delete ipCookie.remove('email');
        delete ipCookie.remove('authentication_token');
        sessionStorage.clear();
        localStorage.clear();
        delete $scope.email;
        delete planService.email;
        $window.location.href = "#/";
        $window.location.reload();
        planService.to = '';
        planService.from = '';
      };

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
