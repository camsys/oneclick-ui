'use strict';

var app = angular.module('oneClickApp');
var debugHelper;

app.controller('MyridesController', ['$scope', '$http','$routeParams', '$location', 'planService', 'util', 'flash', 'usSpinnerService', '$q', 'LocationSearch', 'localStorageService', 'ipCookie', '$timeout', '$window', '$filter',
function($scope, $http, $routeParams, $location, planService, util, flash, usSpinnerService, $q, LocationSearch, localStorageService, ipCookie, $timeout, $window, $filter) {

  var currentLocationLabel = "Current Location";
  var urlPrefix = '//' + APIHOST + '/';
  $scope.itineraryhideButtonBar = null;
  $scope.showTab = null;
  $scope.trips = null;
  $scope.tripDivs = null;
  $scope.emailAddresses = {};

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
  $scope.cancelTrip = function(trip) {
    var tripIds = [];
    var message = "Are you sure you want to drop this trip?";
    var successMessage = 'Your trip has been dropped.'
    trip.itineraries.forEach(function( itinerary ){
      tripIds.push( itinerary.id );
    });

    bootbox.confirm({
      message: message,
      buttons: {
        'cancel': {
          label: 'Keep Trip'
        },
        'confirm': {
          label: 'Cancel Trip'
        }
      },
      callback: function(result) {
        if(result == true){
          tripIds.forEach(function(tripId){
            //cancel one itinerary
            var cancel = {bookingcancellation_request:[{itinerary_id: tripId}]};
            var cancelPromise = planService.cancelTrip($http, cancel)
            cancelPromise.error(function(data) {
              bootbox.alert("An error occurred, your trip was not cancelled.  Please call 1-844-PA4-RIDE for more information.");
            });
            cancelPromise.success(function(data) {
              bootbox.alert(successMessage);
              $scope.tripSelected = false;
              ipCookie('rideCount', ipCookie('rideCount') - 1);
            });
          })
        }
      }
    });
  };
  $scope.sendEmail = function(trip){
    var tripIds = [];
    var emailString = $scope.emailAddresses.text;
    trip.itineraries.forEach(function( itinerary ){
      tripIds.push( itinerary.trip_id );
    });
    //validate
    if(!emailString || !tripIds.length || !planService.validateEmail(emailString) ){
      $scope.invalidEmail = true;
      return true;
    }
    //valid
    tripIds.forEach(function(tripId){
      //send an email for each leg
      var emailRequest;
      $scope.showEmail = false;
      emailRequest = {
        email_address: emailString,
        trip_id: tripId
      };
      planService
        .emailItineraries($http, emailRequest)
        .error(function(data) {
          bootbox.alert("An error occurred on the server, your email was not sent.");
        })
        .success(function(data){
          bootbox.alert('Your email was sent');
        });
    });
  }


}]);
