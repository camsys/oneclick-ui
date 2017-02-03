'use strict';

angular.module('oneClickApp')
  .controller('LoginController', ['$scope', '$rootScope', '$location', 'flash', 'planService', '$http', 'ipCookie', '$window', 'localStorageService',
    function ($scope, $rootScope, $location, flash, planService, $http, ipCookie, $window, localStorageService) {
      $scope.rememberme = true;
      $scope.loginError = false;
      $scope.errors = {dob:false};

      var authentication_token = ipCookie('authentication_token');
      var email = ipCookie('email');
      $window.visited = true;
      $scope.firstName = {};
      $scope.lastName = {};
      $scope.email = {};
      $scope.password = {};
      $scope.passwordConfirm = {};
      $scope.loginErrors = {};

      var processUserLogin = function(result) {
        $scope.loginError = false;
        planService.authentication_token = result.authentication_token;
        planService.email = result.email;
        ipCookie('authd', true);
        if($scope.rememberme == true){
          ipCookie('email', planService.email, {expires: 7, expirationUnit: 'days'});
          ipCookie('authentication_token', planService.authentication_token, {expires: 7, expirationUnit: 'days'});
        }else{
          ipCookie.remove('email');
          ipCookie.remove('authentication_token');
        }
        $rootScope.$broadcast('LoginController:login', result.data);
      }
      var signingUp = false;
      $scope.signUp = function(){
        if(signingUp){return;}
        signingUp = true;
        var newUser = {};
        $scope.signupform.firstname.$setTouched();
        $scope.signupform.lastname.$setTouched();
        $scope.signupform.email.$setTouched();
        $scope.signupform.password.$setTouched();
        $scope.signupform.passwordconfirm.$setTouched();
        if(true !== $scope.signupform.$valid){
          $scope.showErrors = true;
          signingUp = false;
          return;
        }
        newUser.first_name = $scope.firstName.text;
        newUser.last_name = $scope.lastName.text;
        newUser.email = $scope.email.text;
        newUser.password = $scope.password.text;
        newUser.password_confirmation = $scope.passwordConfirm.text;

        var promise = $http.post('//'+APIHOST+'/api/v1/sign_up', newUser);
        promise.then(function(response){
          signingUp = false;
          processUserLogin(response.data);
          $scope.loginErrors = {};
        }).catch(function(response){
          signingUp = false;
          $scope.loginErrors = response.data || {};
          console.error(response);
        });
      }

      var authenticating = false;
      $scope.authenticate = function(){
        if(authenticating){return;}
        authenticating = true;
        var login = {};
        login.session = {};
        login.session.email = $scope.emailAddress;
        login.session.password = $scope.password;

        var promise = $http.post('//'+APIHOST+'/api/v1/sign_in', login);
        promise.then(function(response){
          authenticating = false;
          processUserLogin(response.data);
        }).catch(function(){
          authenticating = false;
          $scope.loginError = true;
        });
      }
      
    }
  ]);
