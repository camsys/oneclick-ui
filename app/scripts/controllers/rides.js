'use strict';

var app = angular.module('oneClickApp');

app.controller('RidesController', ['$scope', '$http','$routeParams', '$location', 'planService', 'util', 'flash', 'usSpinnerService', '$q', 'LocationSearch', 'localStorageService', 'ipCookie', '$timeout', '$window', '$filter',

function($scope, $http, $routeParams, $location, planService, util, flash, usSpinnerService, $q, LocationSearch, localStorageService, ipCookie, $timeout, $window, $filter) {

  $scope.itineraries =[];
  $scope.loadItineraries = function(){
    //this method is used in PlanController, as a callback for when the plan/itinerary is updated
    if(planService.searchResults){
      $scope.itineraries = planService.searchResults.itineraries;
    }else{
      $scope.itineraries =[];
    }
  }
  //initialize automatically the first time
  $scope.loadItineraries();

  $scope.itineraryTemplate = function( mode ){
    //return a different template depending on mode 
    var templates={
      'mode_ride_hailing' : 'rides-itinerary-rideshare.html',
      'mode_paratransit' : 'rides-itinerary-paratransit.html',
      'mode_taxi' : 'rides-itinerary-taxi.html',
      'mode_transit' : 'rides-itinerary-transit.html',
      'mode_walk' : 'rides-itinerary-walk.html',
      'mode_rail' : 'rides-itinerary-rail.html',
      'mode_bicycle' : 'rides-itinerary-bicycle.html'
    };
    //return the mode's template, or a "missing template error" template 
    var templatePath = '/views/' + (templates[ mode ] || 'rides-itinerary-templatemissing.html');
    return templatePath;
  }

}]);
