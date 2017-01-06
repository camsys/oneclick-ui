'use strict';

var app = angular.module('oneClickApp');
var debugHelper;

app.controller('MyridesController', ['$scope', '$http','$routeParams', '$location', 'planService', 'util', 'flash', 'usSpinnerService', '$q', 'LocationSearch', 'localStorageService', 'ipCookie', '$timeout', '$window', '$filter',
function($scope, $http, $routeParams, $location, planService, util, flash, usSpinnerService, $q, LocationSearch, localStorageService, ipCookie, $timeout, $window, $filter) {

  var currentLocationLabel = "Current Location";
  var urlPrefix = '//' + APIHOST + '/';

  var pastRides = planService.getPastRides($http, $scope, ipCookie);
  var futureRides = planService.getFutureRides($http, $scope, ipCookie);

  $scope.itinerary = planService.selectedTrip;
  $scope.hideButtonBar = true;
  $window.visited = true;
  //default the past/future selected tab 
  $scope.showTab = planService.myRidesShowTab || 'future';


  futureRides.then(function() {
    var navbar = $routeParams.navbar;
    if(navbar){
      $scope.tabFuture = true;
      delete $scope.tabPast;
    }
  });
  /*
  $scope.selectTrip = function($event, tab, index) {
    $event.stopPropagation();
    var trip = $scope.trips[tab][index];
    planService.selectedTrip = trip;
    $scope.itinerary =  trip;
    $location.path('/my_rides/itinerary');
  };*/
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
