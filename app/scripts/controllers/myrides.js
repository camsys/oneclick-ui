'use strict';

var app = angular.module('oneClickApp');
var debugHelper;

app.controller('MyridesController', ['$scope', '$http','$routeParams', '$location', 'planService', 'util', 'flash', 'usSpinnerService', '$q', 'LocationSearch', 'localStorageService', 'ipCookie', '$timeout', '$window', '$filter',
function($scope, $http, $routeParams, $location, planService, util, flash, usSpinnerService, $q, LocationSearch, localStorageService, ipCookie, $timeout, $window, $filter) {

  var currentLocationLabel = "Current Location";
  var urlPrefix = '//' + APIHOST + '/';

  var pastRides = planService.getPastRides($http, $scope, ipCookie);
  var futureRides = planService.getFutureRides($http, $scope, ipCookie);

  $scope.hideButtonBar = true;


  futureRides.then(function() {
    var navbar = $routeParams.navbar;
    if(navbar){
      $scope.tabFuture = true;
      delete $scope.tabPast;
    }
  });

}]);
