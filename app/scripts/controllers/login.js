'use strict';

angular.module('oneClickApp')
  .controller('LoginController', ['$scope', '$rootScope', '$location', 'flash', 'planService', '$http', 'ipCookie', '$window', 'localStorageService',
    function ($scope, $rootScope, $location, flash, planService, $http, ipCookie, $window, localStorageService) {
      //skip initializing this controller if we're not on the page
      if( ['/','/loginError','/plan/login-guest'].indexOf( $location.path() ) == -1){ return; }
      /*
      //this should probably be in a service if there's anything more
      $http({
        method: 'GET',
        url: '//'+ APIHOST + '/api/v1/services/ids_humanized'
      }).then(function successCallback(response) {
        //update the counties
        $scope.counties = response.data.service_ids;
      }, function errorCallback(response) {
            console.error(response);
      });
      */
      //$scope.location = $location.path();
      $scope.rememberme = true;
      //$scope.disableNext = true;
      //$scope.counties = [];
      //$scope.sharedRideId = ipCookie('sharedRideId');
      //$scope.county = ipCookie('county');
      //$scope.dateofbirth = sessionStorage.getItem('dateofbirth') || false;
      $scope.loginError = false;
      /*
      $scope.dob = {month:'', day:'', year:''};
      if($scope.dateofbirth){
        var dob = moment($scope.dateofbirth);
        $scope.dob = {month:dob.month()+1, day:dob.date(), year:dob.year()};
      }
      */
      $scope.errors = {dob:false};

      var authentication_token = ipCookie('authentication_token');
      var email = ipCookie('email');
      $window.visited = true;
      $scope.firstName = {};
      $scope.lastName = {};
      $scope.email = {};
      $scope.password = {};
      $scope.passwordConfirm = {};

/*
      function checkNextValid(){
        /*
        var bd;
        try{
          bd = moment()
          bd.month( parseInt($scope.dob.month)-1 )
          bd.date($scope.dob.day)
          bd.year($scope.dob.year);
        }catch(e){
          $scope.dateofbirth = false;
        }
        $scope.errors.dob = (( $scope.loginform.month.$dirty && $scope.loginform.month.$invalid )
                            || ($scope.loginform.day.$dirty && $scope.loginform.day.$invalid )
                            || (($scope.loginform.year.$viewValue||'').length > 3 && $scope.loginform.year.$invalid ));
        if( !$scope.errors.dob && $scope.dob.month && $scope.dob.day && $scope.dob.year ){
          $scope.dateofbirth = bd.toDate();
        }else{
          $scope.dateofbirth = false;
        }
        * /
        $scope.disableNext = !($scope.loginform.month.$valid 
                          && $scope.loginform.day.$valid 
                          && $scope.loginform.year.$valid 
                          && $scope.dateofbirth 
                          && $scope.sharedRideId 
                          && $scope.county
                          && true);
      }

      $scope.checkId = function() {
        $scope.disableNext = true;
        var path = $location.path();
        if(path == '/' || path == '/loginError' ){
          if($scope.sharedRideId && $scope.county && $scope.dateofbirth){
            var sharedRideId = $scope.sharedRideId;
            if(sharedRideId.toString().length > 0){
              $scope.disableNext = false;
            }
          }
        }
      };

      $scope.next = function(){
        if($scope.disableNext)
          return;
        var path = $location.path();
        planService.sharedRideId = $scope.sharedRideId;
        planService.county = $scope.county;
        planService.dateofbirth = $scope.dateofbirth;
        $scope.authenticate();
        $scope.disableNext=true;
      }

      $scope.back = function(){
        $location.path('/');
      }
      $scope.$watch('dob.month', function(n){
          var monthInt = parseInt(n);
          if(monthInt > 1 && monthInt < 13){
              $('#LoginTemplate input.dob.day').focus();
          }
          checkNextValid();
          return;
      });
      $scope.$watch('dob.day', function(n){
          var dayInt = parseInt(n);
          if(dayInt > 3){
              $('#LoginTemplate input.dob.year').focus();
          }
          checkNextValid();
          return;
      });
      $scope.$watch('dob.year', function(n){
          checkNextValid();
          return;
      });
*/
      var processUserLogin = function(result) {
        $scope.loginError = false;
        planService.authentication_token = result.authentication_token;
        planService.email = result.email;
        if($scope.rememberme == true){
          ipCookie('email', planService.email, {expires: 7, expirationUnit: 'days'});
          ipCookie('authentication_token', planService.authentication_token, {expires: 7, expirationUnit: 'days'});
        }else{
          ipCookie.remove('email');
          ipCookie.remove('authentication_token');
        }
        $rootScope.$broadcast('LoginController:login', result.data);
      }
      $scope.signUp = function(){
        var newUser = {};
        $scope.signupform.firstname.$setTouched();
        $scope.signupform.lastname.$setTouched();
        $scope.signupform.email.$setTouched();
        $scope.signupform.password.$setTouched();
        $scope.signupform.passwordconfirm.$setTouched();
        if(true !== $scope.signupform.$valid){
          $scope.showErrors = true;
          return;
        }
        newUser.first_name = $scope.firstName.text;
        newUser.last_name = $scope.lastName.text;
        newUser.email = $scope.email.text;
        newUser.password = $scope.password.text;
        newUser.password_confirmation = $scope.passwordConfirm.text;

        var promise = $http.post('//'+APIHOST+'/api/v1/sign_up', newUser);
        promise.then(function(response){
          if(!response.data){
            $scope.newUserError = true;
            console.error(result);
            return;
          }
          processUserLogin(response.data);
        });
      }

      $scope.authenticate = function(){
        var login = {};
        login.session = {};
        login.session.email = $scope.emailAddress;
        login.session.password = $scope.password;

        var promise = $http.post('//'+APIHOST+'/api/v1/sign_in', login);
        promise.then(function(response){
          if(!response.data){
            $scope.newUserError = true;
            console.error(result);
            return;
          }
          processUserLogin(response.data);
        });
      }
      
    }
  ]);
