'use strict';

angular.module('oneClickApp')
  .controller('LoginController', ['$scope', '$rootScope', '$location', 'flash', 'planService', '$http', 'ipCookie', '$window', 'localStorageService', '$routeParams', '$timeout',
    function ($scope, $rootScope, $location, flash, planService, $http, ipCookie, $window, localStorageService, $routeParams, $timeout) {
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
      $scope.resetPassword = {};
      $scope.resetPasswordConfirm = {};
      $scope.loginErrors = {};
      $scope.passwordUpdateSuccess = false;

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
          ga('send', 'event', 'SignedUp');
        }).catch(function(response){
          signingUp = false;
          $scope.loginErrors = response.data || {};
          console.error(response);
        });
      }
      var changingPassword = false;
      var changePasswordReset = function(){
        $scope.password = {};
        $scope.passwordConfirm = {};
        $scope.changepassform.$setPristine();
      }
      $scope.changePassword = function(){
        if(changingPassword){return;}
        if($scope.password.text != $scope.passwordConfirm.text){return;}
        changingPassword = true;
        var request = {
          password: $scope.password.text,
          password_confirmation: $scope.passwordConfirm.text
        };
        var promise = $http.post('//'+APIHOST+'/api/v1/users/password', request, planService.getHeaders() );
        promise.then(function(){
          changingPassword = false;
          $scope.passwordUpdateSuccess = true;
          changePasswordReset();
        }).catch(function(response){
          changingPassword = false;
          $scope.loginErrors = response.data || {};
          console.error(response);
        })
      }
      $scope.resetPassword = function(){
        //
        console.log($scope.reset_password_token, $scope);
        if(true !== $scope.resetform.$valid){
          $scope.showErrors = true;
          return;
        }
        var reset = {
          password: $scope.resetPassword.text,
          password_confirmation: $scope.resetPasswordConfirm.text,
          reset_password_token: $routeParams.reset_token
        };
        $http.post('//'+APIHOST+'/api/v1/users/reset', reset).
        then(function(response){
          bootbox.hideAll()
          $location.path('/').replace();
        }).
        catch(function(e){
          console.error(e);
        });
      }
      $scope.forgot = function(){
        //reset the user's password
        var reset = {};
        reset.email = $scope.forgotEmailAddress;
        var postResetRequest = function(){
          //regardless of response, show success and hide forgot form
          $scope.forgotSuccess = true;
          $scope.showForgotForm = false;
          //hide the success message after 17 seconds
          $timeout(function(){
            $scope.forgotSuccess = false;
          }, 17000);
        }
        $http.post('//'+APIHOST+'/api/v1/users/request_reset', reset).
          then( postResetRequest ).
          catch( postResetRequest );
      };
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
