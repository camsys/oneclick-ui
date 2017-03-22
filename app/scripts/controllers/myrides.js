'use strict';
var app = angular.module('oneClickApp');
var debugHelper;
app.controller('MyridesController', [
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
    $scope.itineraryhideButtonBar = null;
    $scope.showTab = null;
    $scope.trips = null;
    $scope.tripDivs = null;
    $scope.emailAddresses = {};
    var updateRides = function () {
      //getPastRides and getFutureRides modify $scope.trips adding .future and .past
      planService.getFutureRides($http, $scope, ipCookie);
      planService.getPastRides($http, $scope, ipCookie);
    };
    updateRides();
    $scope.$on('LoginController:login', function () {
      updateRides();
    });
    $scope.itinerary = planService.selectedTrip;
    $scope.hideButtonBar = true;
    $window.visited = true;
    //default the past/future selected tab 
    $scope.showTab = planService.myRidesShowTab || 'future';
    $scope.cancelTrip = function (trip) {
      var message = $translate.instant('confirm_remove_trip');
      if (trip.itineraries[0].booking_confirmation) {
        message = $translate.instant('confirm_cancel_trip');
      }
      var successMessage = $translate.instant('cancel_booking_success', trip.itineraries[0]);
      var errorHandler = function (e) {
        bootbox.alert($translate.instant('cancel_booking_failure', trip.itineraries[0]));
        console.error(e);
      };
      bootbox.confirm({
        message: message,
        buttons: {
          'cancel': { label: 'Keep Trip' },
          'confirm': { label: 'Cancel Trip' }
        },
        callback: function (result) {
          var cancelRequest;
          if (result === true) {
            cancelRequest = planService.buildCancelTripRequest(trip.itineraries);
            //send the request, process response
            planService.cancelTrip($http, cancelRequest).then(function (response) {
              //look for errors:
              var errors = false;
              response.data.cancellation_results.forEach(function (e) {
                errors = !e.success || errors;
              });
              if (errors) {
                errorHandler(response);
                return;
              }
              bootbox.alert(successMessage);
              trip.cancelled = true;
              $scope.tripSelected = false;
              ipCookie('rideCount', ipCookie('rideCount') - 1);
            }).catch(errorHandler);
          }
        }
      });
    };
    $scope.toggleShowEmail = function () {
      $scope.showEmail = !$scope.showEmail;
    };
    $scope.sendEmail = function (trip) {
      var tripIds = [];
      var emailString = $scope.emailAddresses.text;
      trip.itineraries.forEach(function (itinerary) {
        tripIds.push(itinerary.trip_id);
      });
      //validate
      if (!emailString || !tripIds.length || !planService.validateEmail(emailString)) {
        $scope.invalidEmail = true;
        return true;
      }
      //valid
      tripIds.forEach(function (tripId) {
        //send an email for each leg
        var emailRequest;
        $scope.showEmail = false;
        emailRequest = {
          email_address: emailString,
          trip_id: tripId
        };
        planService.emailItineraries($http, emailRequest).then(function (response) {
          if (!response.data) {
            bootbox.alert('An error occurred on the server, your email was not sent.');
            return;
          }
          bootbox.alert($translate.instant('your_email_was_sent'));
        });
      });
    };
  }
]);