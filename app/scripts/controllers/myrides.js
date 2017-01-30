'use strict';

var app = angular.module('oneClickApp');
var debugHelper;

app.controller('MyridesController', ['$scope', '$http','$routeParams', '$location', 'planService', 'util', 'flash', '$q', 'LocationSearch', 'localStorageService', 'ipCookie', '$timeout', '$window', '$filter',
function($scope, $http, $routeParams, $location, planService, util, flash, $q, LocationSearch, localStorageService, ipCookie, $timeout, $window, $filter) {

  var currentLocationLabel = "Current Location";
  var urlPrefix = '//' + APIHOST + '/';
  $scope.itineraryhideButtonBar = null;
  $scope.showTab = null;
  $scope.trips = null;
  $scope.tripDivs = null;
  $scope.emailAddresses = {};

  var updateRides = function(){
    //getPastRides and getFutureRides modify $scope.trips adding .future and .past
    var futureRides = planService.getFutureRides($http, $scope, ipCookie);
    var pastRides = planService.getPastRides($http, $scope, ipCookie);
  }
  updateRides();
  $scope.$on('LoginController:login', function(event, data){
    updateRides();
  })
  $scope.itinerary = planService.selectedTrip;
  $scope.hideButtonBar = true;
  $window.visited = true;
  //default the past/future selected tab 
  $scope.showTab = planService.myRidesShowTab || 'future';


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
    var cancelTrips = [];
    var message = "Are you sure you want to drop this trip?";
    var successMessage = 'Your trip has been dropped.'
    trip.itineraries.forEach(function( itinerary ){
      cancelTrips.push( {itinerary_id: itinerary.id, booking_confirmation: itinerary.booking_confirmation} );
    });
    var errorHandler = function(e){
      bootbox.alert("An error occurred, your trip was not cancelled.  Please call 1-844-PA4-RIDE for more information.");
      console.error(e)
    }

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
        var cancelRequest = {bookingcancellation_request:[]};
        if(result == true){
          //build the cancel request
          cancelTrips.forEach(function(cancel){
            //cancel one itinerary
            var req;
            if(cancel.booking_confirmation > 0){
              req = {booking_confirmation: cancel.booking_confirmation};
            }else{
              req = {itinerary_id: cancel.itinerary_id};
            }
            cancelRequest.bookingcancellation_request.push( req );
          });

          //send the request, process response
          planService
          .cancelTrip($http, cancelRequest)
          .then(function(response) {
            //look for errors:
            var errors = false;
            response.data.cancellation_results.forEach(function(e){
              errors = !e.success || errors
            });
            if(errors){
              errorHandler(response);
              return;
            }
            bootbox.alert(successMessage);
            trip.cancelled = true;

            $scope.tripSelected = false;
            ipCookie('rideCount', ipCookie('rideCount') - 1);
          })
          .catch(errorHandler);
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
        .then(function(response){
          if(!response.data){
            bootbox.alert("An error occurred on the server, your email was not sent.");
            return;
          }
          bootbox.alert('Your email was sent');
        });
    });
  }


}]);
