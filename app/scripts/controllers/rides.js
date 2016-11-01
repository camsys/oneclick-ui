'use strict';

var app = angular.module('oneClickApp');

app.controller('RidesController', ['$scope', '$http','$routeParams', '$location', 'planService', 'util', 'flash', 'usSpinnerService', '$q', 'LocationSearch', 'localStorageService', 'ipCookie', '$timeout', '$window', '$filter',

function($scope, $http, $routeParams, $location, planService, util, flash, usSpinnerService, $q, LocationSearch, localStorageService, ipCookie, $timeout, $window, $filter) {

  $scope.itineraries =[];
  $scope.loadItineraries = function(){
    if(planService.searchResults){
      $scope.itineraries = planService.searchResults.itineraries;
    }else{
      $scope.itineraries =[];
    }
  }
  $scope.loadItineraries();

}]);
