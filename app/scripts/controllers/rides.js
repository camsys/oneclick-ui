'use strict';

var app = angular.module('oneClickApp');

app.controller('RidesController', ['$scope', '$http','$routeParams', '$location', 'planService', 'util', 'flash', '$q', 'LocationSearch', 'localStorageService', 'ipCookie', '$timeout', '$window', '$filter', '$translate',

function($scope, $http, $routeParams, $location, planService, util, flash, $q, LocationSearch, localStorageService, ipCookie, $timeout, $window, $filter, $translate) {

  $scope.tripSelected =  false;
  $scope.invalidEmail = false;
  $scope.itineraries = [];
  $scope.emailAddresses = {};
  $scope.selectedItineraryModes = {};
  $scope.dateOptions = {
    formatYear: 'yy',
    startingDay: 0,
    showWeeks: false,
    showButtonBar: false
  };

  $scope.orderItinerariesBy = 'cost';
  $scope.itineraryOrderbyChange = function(orderby){
    $scope.orderItinerariesBy = orderby;
  }
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
  $scope.$on('PlanService:beforeUpdateItineraryResults', function(event, data){
    $scope.updatingResults = true;
  });


  // _okModes used by itineraryFilter to allow/hide if mode is selected
  var _okModes = []
  var _initOkModes = function()
  {
    _okModes = planService.profile.preferred_modes || planService.allModes;
    _okModes.forEach(function(mode){
      $scope.selectedItineraryModes[mode] = true;
    })
  }
  //set OK modes from the profile, if we have it, or get it then set it
  if(planService.profile){
    _initOkModes();
  }else{
    planService.getProfile($http).then(_initOkModes)
  }

  $scope.itineraryFilter = function(itinerary, index, arr){
    if(itinerary.hidden){ return false; }
    //returns true if there are no modes selected OR the itinerary's mode is in the array
    return (_okModes.length === 0) || (_okModes.indexOf(itinerary.returned_mode_code) > -1);
  };
  $scope.itineraryFilterChange = function() {
    //make an array of OK mode codes
    var mode;
    _okModes = [];
    for (mode in $scope.selectedItineraryModes) {
      if ($scope.selectedItineraryModes[mode]) {
        _okModes.push(mode);
      }
    }
    var profile = planService.buildProfileUpdateRequest(planService.profile);
    //if length of _okModes is 0, all modes are selected
    if(_okModes.length == 0){
      profile.preferred_modes = planService.allModes;
    }else{
      profile.preferred_modes = _okModes;
    }
    planService.postProfileUpdate($http, profile)
      .catch(console.error);
  }
  $scope.saveTrip = function(itinerary){
    var tripId = itinerary.id;
    var selectedItineraries = { select_itineraries: [ { itinerary_id: tripId } ] };
    var promise = planService.selectItineraries($http, selectedItineraries);
    promise.then(function(response){
      $scope.tripSelected = tripId;
      itinerary.showMoreDetails=true;
      ipCookie('rideCount', ipCookie('rideCount') - 1);
    }).catch(console.error);
  }

  $scope.cancelTrip = function(itinerary) {
    var tripId = itinerary.id;
    var successMessage = $translate.instant('trip_was_successfully_removed');
    var failureMessage = $translate.instant('cancel_booking_failure', itinerary);

    bootbox.confirm({
      message: $translate.instant('confirm_remove_trip'),
      buttons: {
        'cancel': {
          label: $translate.instant('cancel')
        },
        'confirm': {
          label: $translate.instant('remove_trip')
        }
      },
      callback: function(result) {
        if(result == true){
          //cancel one itinerary
          var cancel = planService.buildCancelTripRequest(itinerary);
          var cancelPromise = planService.cancelTrip($http, cancel)
          cancelPromise.then(function(response) {
            //look for errors:
            var errors = false;
            response.data.cancellation_results.forEach(function(e){
              errors = !e.success || errors
            });
            if(errors){
              bootbox.alert(failureMessage);
              return;
            }

            bootbox.alert(successMessage);
            //reset the UI flags that were set during booking
            $scope.itineraryBooked = false;
            $scope.tripSelected = false;
            ipCookie('rideCount', ipCookie('rideCount') - 1);
          }).catch(function(){
            bootbox.alert(failureMessage);
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
          .then(function(response){
            if(!response.data){
              bootbox.alert("An error occurred on the server, your email was not sent.");
              return;
            }
            bootbox.alert( $translate.instant('an_email_was_sent_to_email_addresses_join', {addresses: emailString}) );
          });
        return false;
      }else{
        $scope.invalidEmail = true;
      }
    }
    return true;
  }

}]);