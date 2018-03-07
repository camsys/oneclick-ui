'use strict';
var app = angular.module('oneClickApp');
app.controller('BookController', [
  '$scope',
  '$http',
  '$routeParams',
  '$location',
  'planService',
  'util',
  'flash',
  '$q',
  'LocationSearch',
  'localStorageService',
  'ipCookie',
  '$timeout',
  '$window',
  '$filter',
  '$translate',
  function ($scope, $http, $routeParams, $location, planService, util, flash, $q, LocationSearch, localStorageService, ipCookie, $timeout, $window, $filter, $translate) {
    var _showPrebookQuestions = function () {
      $scope.showPrebookingQuestions = true;
    };
    $scope.rides_forms = {};
    $scope.service_username = {};
    $scope.service_password = {};
    $scope.rides_forms = {};
    $scope.login_error = false;
    $scope.serviceLogin = function (itinerary) {
      var profile = {};
      //make the booking array if not already there
      profile.booking = planService.profile.booking || [];
      var serviceProfile = {
        service_id: itinerary.service_id,
        user_name: $scope.service_username.text,
        password: $scope.service_password.text
      };
      profile.booking.push(serviceProfile);
      planService.postProfileUpdate($http, profile).then(function(profile_response) {
        //hide the service login form, show the pre booking questions
        $scope.showServiceLoginForm = false;
        itinerary.user_registered = true;
        $scope.login_error = false;
        // THIS IS NOT THE ANGULARJS WAY. I piggybacked the prebooking questions onto the profile update response.
        itinerary.prebooking_questions = profile_response.data.booking.prebooking_questions[itinerary.service_id];
        _showPrebookQuestions();
      }).catch(function (response) {
        $scope.login_error = true;
        console.warn('profile response', response);
      });
    };
    $scope.cancelBookItinerary = function () {
      $scope.showServiceLoginForm = false;
      $scope.showPrebookingQuestions = false;
    };
    $scope.answerPrebookQuestions = function (itinerary) {
      //return if itinerary already being booked
      if (itinerary.itineraryBooking === true) {
        return;
      }
      itinerary.itineraryBooking = true;
      var request = $.extend({}, itinerary.answers);
      //if the form is OK, attach the id to the answers and submit
      var stop = false;
      angular.forEach(request, function (val, key) {
        //stop = !(parseInt(val) > -1) || stop;
        $scope.rides_forms.prebooking_questions[key].error_required = stop;
      });
      if (stop) {
        itinerary.itineraryBooking = false;
        return;
      }
      //populate the id and return time (if applicable)
      request.itinerary_id = itinerary.id;
      if (itinerary.booking_return_time) {
        request.return_time = itinerary.booking_return_time;
      }
      planService.bookItinerary($http, [request]).then(function (response) {
        itinerary.itineraryBooking = false;
        var booking_results = response.data.booking_results;
        var error = false;
        var confirmation_ids = [];
        var wait_start;
        var wait_end;
        var first = true
        angular.forEach(booking_results, function (itinerary) {
          error = !itinerary.booked || error;
          confirmation_ids.push(itinerary.confirmation_id);
          if(first){
            wait_start = itinerary.wait_start
            wait_end = itinerary.wait_end
          }
          first = false;
        });
        if (error) {
          bootbox.alert($translate.instant('booking_failure_message'));
          return;
        }
        itinerary.wait_start = wait_start
        itinerary.wait_end = wait_end
        itinerary.confirmation_ids = confirmation_ids;
        itinerary.booked = true;
        var confirmationMessage = $translate.instant('trip_booked_2');
        confirmationMessage += ' ' + $translate.instant('confirmation');
        confirmationMessage += ': #' + confirmation_ids.join(' #');
        bootbox.alert(confirmationMessage);
      }).catch(function (e) {
        itinerary.itineraryBooking = false;
        bootbox.alert($translate.instant('booking_failure_message'));
        console.error('error booking', e);
      });
    };
    $scope.bookItinerary = function (itinerary) {
      if (!itinerary.user_registered) {
        //show the service login form if the uesr isn't registered yet
        $scope.showServiceLoginForm = true;
        return;
      }
      _showPrebookQuestions();
    };
    $scope.prebookingQuestionTemplate = function (questions) {
      //return a template for either question datatype
      if (!questions) {
        return '';
      }
      var templateType = typeof questions[0];
      var templates = {
        'object': '/views/rides-prebookingQuestion-array.html',
        'number': '/views/rides-prebookingQuestion-int.html',
        'string': '/views/rides-prebookingQuestion-string.html'
      };
      return templates[templateType];
    };
  }
]);