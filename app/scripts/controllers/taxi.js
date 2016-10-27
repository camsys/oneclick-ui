'use strict';

angular.module('oneClickApp')
  .controller('TaxiController', ['$scope','$routeParams', '$location', 'flash', 'planService', 'ipCookie', 'usSpinnerService', '$http',
    function ($scope, $routeParams, $location, flash, planService, ipCookie, usSpinnerService, $http) {

      $scope.loggedIn = !!planService.email;
      //pull the selected taxi out from selected taxi option, or send to plan again
      if( planService.selectedTaxiOption >= 0 ){
        $scope.taxiItinerary = planService.taxiItineraries[ (planService.selectedTaxiOption||0) ];
      }else{
        $location.path("/plan/where");
      }

      $scope.saveTaxiTrip = function(){

        var tripId = planService.tripId;
        var selectedItineraries = [{"trip_id":tripId, "itinerary_id":planService.taxiItineraries[planService.selectedTaxiOption].id}];
        if(planService.fare_info.roundtrip == true){
          selectedItineraries.push({"trip_id":tripId, "itinerary_id":planService.taxiItineraries[planService.selectedTaxiOption].returnItinerary.id});
        }
        var selectedItineraries = {"select_itineraries": selectedItineraries};

        var promise = planService.selectItineraries($http, selectedItineraries);
        promise.then(function(result) {
          ipCookie('rideCount', ipCookie('rideCount') + 1);
          $scope.rideCount = ipCookie('rideCount');
          $scope.taxiSaved = true;
          planService.taxiSaved = true;
          bootbox.alert("Your trip has been saved");
        });

      }
      $scope.cancelThisTaxiTrip = function(){
        usSpinnerService.spin('spinner-1');
        var cancelRequest = {bookingcancellation_request: []};
        var leg1, leg2;
        leg1 = {itinerary_id: planService.taxiItineraries[planService.selectedTaxiOption].id};
        cancelRequest.bookingcancellation_request.push( leg1 );
        if(planService.fare_info.roundtrip){
          leg2 = {itinerary_id: planService.taxiItineraries[planService.selectedTaxiOption].returnItinerary.id}
          cancelRequest.bookingcancellation_request.push( leg2 );
        }
        var cancelPromise = planService.cancelTrip($http, cancelRequest)
        cancelPromise.error(function(data) {
          bootbox.alert("An error occurred, your trip was not cancelled.  Please call 1-844-PA4-RIDE for more information.");
          usSpinnerService.stop('spinner-1');
        });
        cancelPromise.success(function(data) {
          bootbox.alert('Your trip has been cancelled');
          ipCookie('rideCount', ipCookie('rideCount') - 1);
          $scope.taxiSaved = false;
          $scope.taxiCancelled = true;
          planService.taxiSaved = false;
          planService.taxiCancelled = true;
          usSpinnerService.stop('spinner-1');
        });

      }
      $scope.toggleEmail = function($event) {
        $scope.invalidEmail = false;
        $scope.showEmail = !$scope.showEmail;
        $event.stopPropagation();
      };

      $scope.sendEmail = function($event) {
        $event.stopPropagation();

        var emailString = $scope.emailString;

        if(emailString && planService.tripId){
          var result = planService.validateEmail(emailString);
          if(result == true){

            $scope.showEmail = false;

            var emailRequest = {};
            emailRequest.email_address = emailString;
            emailRequest.trip_id = planService.tripId;

            var emailPromise = planService.emailItineraries($http, emailRequest);
            emailPromise.error(function(data) {
              bootbox.alert("An error occurred on the server, your email was not sent.");
            });
            bootbox.alert('Your email was sent');
          }else{
            $scope.invalidEmail = true;
          } 
        }
      }
    }
  ]);
