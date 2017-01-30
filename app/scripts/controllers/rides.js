'use strict';

var app = angular.module('oneClickApp');

app.controller('RidesController', ['$scope', '$http','$routeParams', '$location', 'planService', 'util', 'flash', '$q', 'LocationSearch', 'localStorageService', 'ipCookie', '$timeout', '$window', '$filter', '$translate',

function($scope, $http, $routeParams, $location, planService, util, flash, $q, LocationSearch, localStorageService, ipCookie, $timeout, $window, $filter, $translate) {

  $scope.tripSelected =  false;
  $scope.invalidEmail = false;
  $scope.itineraries = [];
  $scope.emailAddresses = {};
  $scope.selectedItineraryModes = {};
  $scope.service_username = {};
  $scope.service_password = {};
  $scope.rides_forms = {};
  $scope.dateOptions = {
    formatYear: 'yy',
    startingDay: 0,
    showWeeks: false,
    showButtonBar: false
  };

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
  $scope.$on('PlanService:beforeUpdateItineraryResults', function(event, data){
    $scope.updatingResults = true;
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
      'mode_car' : 'rides-itinerary-bicycle.html',
      'mode_bicycle' : 'rides-itinerary-bicycle.html'
    };
    //return the mode's template, or a "missing template error" template 
    var templatePath = '/views/' + (templates[ mode ] || 'rides-itinerary-templatemissing.html');
    return templatePath;
  }
  var _okModes = [];
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
  $scope.serviceLogin = function(itinerary){
    var profile = {};
    //make the booking array if not already there
    profile.booking = planService.profile.booking || [];
    var serviceProfile = {
      service_id: itinerary.service_id,
      user_name: $scope.service_username.text,
      password: $scope.service_password.text
      };
    profile.booking.push(serviceProfile);
    planService.postProfileUpdate($http, profile).then(function(response){
      //hide the service login form, show the pre booking questions
      $scope.showServiceLoginForm = false;
      itinerary.user_registered = true;
      _showPrebookQuestions();
    }).catch(function(response){
      console.warn('profile response', response);
    });
  }
  $scope.cancelBookItinerary = function(itinerary){
    $scope.showServiceLoginForm = false;
    $scope.showPrebookingQuestions = false;
  }
  $scope.bookItinerary = function(itinerary){
    if(!itinerary.user_registered){
      //show the service login form if the uesr isn't registered yet
      $scope.showServiceLoginForm = true;
      return;
    }
    _showPrebookQuestions();
  }
  var _showPrebookQuestions = function(){
    $scope.showPrebookingQuestions = true;
  }
  $scope.answerPrebookQuestions = function(itinerary){
    var request = $.extend({}, itinerary.answers);
    //if the form is OK, attach the id to the answers and submit
    var stop = false;
    angular.forEach(request, function(val, key){
      stop = !(parseInt(val) > -1) || stop;
      $scope.rides_forms.prebooking_questions[key].error_required = stop;
    });
    if(stop){ return; }
    //populate the id and return time (if applicable)
    request.itinerary_id = itinerary.id;
    if(itinerary.booking_return_time){
      request.return_time = itinerary.booking_return_time;
    }
    planService.bookItinerary($http, [request])
      .then(function(response){
        var booking_results = response.data.booking_results;
        var error = false;
        var confirmation_ids = [];
        angular.forEach(booking_results, function(itinerary){
          error = !itinerary.booked || error;
          confirmation_ids.push(itinerary.confirmation_id);
        })
        if(error){
          bootbox.alert( $translate.instant('booking_failure_message') );
          return;
        }
        itinerary.confirmation_ids = confirmation_ids;
        var confirmationMessage = $translate.instant('trip_booked_2');
        confirmationMessage += ' ' + $translate.instant('confirmation');
        confirmationMessage += ': #' + confirmation_ids.join(' #');
        bootbox.alert(confirmationMessage);
        $scope.itineraryBooked =  true;
      })
      .catch(function(e){
        bootbox.alert( $translate.instant('booking_failure_message') );
        console.error('error booking', e);
      });
  }
  $scope.prebookingQuestionTemplate = function(questions){
    //return a template for either question datatype
    if(!questions){ return '';}
    var templateType = typeof questions[0];
    var templates = {
      'object':'/views/rides-prebookingQuestion-array.html',
      'number':'/views/rides-prebookingQuestion-int.html'
    };
    return templates[templateType];
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
            $scope.cancelBookItinerary();
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