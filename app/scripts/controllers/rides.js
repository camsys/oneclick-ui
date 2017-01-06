'use strict';

var app = angular.module('oneClickApp');

app.controller('RidesController', ['$scope', '$http','$routeParams', '$location', 'planService', 'util', 'flash', 'usSpinnerService', '$q', 'LocationSearch', 'localStorageService', 'ipCookie', '$timeout', '$window', '$filter',

function($scope, $http, $routeParams, $location, planService, util, flash, usSpinnerService, $q, LocationSearch, localStorageService, ipCookie, $timeout, $window, $filter) {

  $scope.tripSelected =  false;
  $scope.invalidEmail = false;
  $scope.itineraries = [];
  $scope.emailAddresses = {};
  
  $scope.orderItinerariesBy = 'cost';
  $scope.loadItineraries = function(){
    //this method is used in PlanController, as a callback for when the plan/itinerary is updated
    if(planService.itineraries){
      $scope.updatingResults = false;
      $scope.itineraries = planService.itineraries;
    }else{
      $scope.itineraries =[];
      $scope.updatingResults = true;
    }
  }
  //initialize automatically the first time
  $scope.loadItineraries();
  $scope.$on('PlanService:updateItineraryResults', function(event, data){
    $scope.loadItineraries();
  });

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
  $scope.saveTrip = function(itinerary){
    var tripId = itinerary.id;
    var selectedItineraries = { select_itineraries: [ { itinerary_id: tripId } ] };
    var promise = planService.selectItineraries($http, selectedItineraries);
    promise.success(function(response){
      $scope.tripSelected = tripId;
      itinerary.showMoreDetails=true;
      ipCookie('rideCount', ipCookie('rideCount') - 1);
    });
    promise.error(function(error){
      console.log(error);
    })
    console.log('saving...');
  }

  $scope.cancelTrip = function(itinerary) {
    var tripId = itinerary.id;
    var message = "Are you sure you want to drop this ride?";
    var successMessage = 'Your trip has been dropped.'

    bootbox.confirm({
      message: message,
      buttons: {
        'cancel': {
          label: 'Keep Ride'
        },
        'confirm': {
          label: 'Cancel Ride'
        }
      },
      callback: function(result) {
        if(result == true){
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
          })
        }
      }
    });
  };

  $scope.toggleEmail = function(){
    $scope.invalidEmail = false;
    $scope.showEmail = !$scope.showEmail;
  };

  $scope.sendEmail = function(){
    var tripId = planService.tripId;
    var emailString = $scope.emailAddresses.text;
    var emailRequest, emailPromise;
    
    if(emailString && tripId){
      if( planService.validateEmail(emailString) ){
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
      }else{
        $scope.invalidEmail = true;
      } 
    }
  }

}]);
