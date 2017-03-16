'use strict';

var app = angular.module('oneClickApp');

app.controller('BookController', ['$scope', '$http','$routeParams', '$location', 'planService', 'util', 'flash', '$q', 'LocationSearch', 'localStorageService', 'ipCookie', '$timeout', '$window', '$filter', '$translate',

function($scope, $http, $routeParams, $location, planService, util, flash, $q, LocationSearch, localStorageService, ipCookie, $timeout, $window, $filter, $translate) {

  $scope.rides_forms = {};
  $scope.service_username = {};
  $scope.service_password = {};
  $scope.rides_forms = {};

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
  };
  $scope.cancelBookItinerary = function(itinerary){
    $scope.showServiceLoginForm = false;
    $scope.showPrebookingQuestions = false;
  }
  $scope.answerPrebookQuestions = function(itinerary){
    //return if itinerary already being booked
    if(itinerary.itineraryBooking === true){ return; }
    itinerary.itineraryBooking = true;
    var request = $.extend({}, itinerary.answers);
    //if the form is OK, attach the id to the answers and submit
    var stop = false;
    angular.forEach(request, function(val, key){
      stop = !(parseInt(val) > -1) || stop;
      $scope.rides_forms.prebooking_questions[key].error_required = stop;
    });
    if(stop){
      itinerary.itineraryBooking = false;
      return;
    }
    //populate the id and return time (if applicable)
    request.itinerary_id = itinerary.id;
    if(itinerary.booking_return_time){
      request.return_time = itinerary.booking_return_time;
    }
    planService.bookItinerary($http, [request])
      .then(function(response){
        itinerary.itineraryBooking = false;
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
        itinerary.itineraryBooking = false;
        bootbox.alert( $translate.instant('booking_failure_message') );
        console.error('error booking', e);
      });
  };
  
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

}]);