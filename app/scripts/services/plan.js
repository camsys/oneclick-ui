'use strict';
angular.module('oneClickApp').service('planService', [
  '$rootScope',
  '$filter',
  '$q',
  '$translate',
  function ($rootScope, $filter, $q, $translate) {
    this.reset = function () {
      delete this.fromDate;
      delete this.fromTime;
      delete this.fromTimeType;
      delete this.from;
      delete this.fromDetails;
      delete this.to;
      delete this.toDetails;
      delete this.returnDate;
      delete this.returnTime;
      delete this.returnTimeType;
      delete this.numberOfCompanions;
      delete this.hasEscort;
      delete this.driverInstructions;
      delete this.transitSaved;
      delete this.transitCancelled;
      delete this.taxiSaved;
      delete this.taxiCancelled;
      delete this.uberSaved;
      delete this.uberCancelled;
      delete this.walkSaved;
      delete this.walkCancelled;
      delete this.selectedBusOption;
      delete this.selectedTaxiOption;
      delete this.selectedUberOption;
      delete this.showBusRides;
    };
    var urlPrefix = '//' + APIHOST + '/';
    this.allModes = [
      'mode_car',
      'mode_transit',
      'mode_ride_hailing',
      'mode_taxi',
      'mode_paratransit',
      'mode_bicycle',
      'mode_walk'
    ];
    this.getPrebookingQuestions = function () {
      var questions = this.paratransitItineraries[0].prebooking_questions;
      var questionObj = {};
      angular.forEach(questions, function (question, index) {
        if (question.code == 'assistant') {
          questionObj.assistant = question.question;
        } else if (question.code == 'children' || question.code == 'companions') {
          questionObj.children = question.question;
          questionObj.limit = question.choices;
        }
      });
      return questionObj;
    };
    var cached_characteristics_questions;
    this.getCharacteristicsQuestions = function ($http) {
      var deferred;
      if (cached_characteristics_questions) {
        deferred = $q.defer();
        deferred.resolve(cached_characteristics_questions);
        return deferred.promise;
      }
      deferred = $http.get('//' + APIHOST + '/api/v1/characteristics/list');
      deferred.then(function (data) {
        if (data.statusText === 'OK') {
          //cache the questions for next view
          cached_characteristics_questions = data;
        }
      });
      return deferred;
    };
    var cachedAccommodationQuestions;
    this.getAccommodationQuestions = function ($http) {
      var deferred;
      if (cachedAccommodationQuestions) {
        deferred = $q.defer();
        deferred.resolve(cachedAccommodationQuestions);
        return deferred.promise;
      }
      deferred = $http.get('//' + APIHOST + '/api/v1/accommodations/list');
      deferred.then(function (data) {
        if (data.statusText === 'OK') {
          //cache the questions for next view
          cachedAccommodationQuestions = data;
        }
      });
      return deferred;
    };
    this.emailItineraries = function ($http, emailRequest) {
      return $http.post(urlPrefix + 'api/v1/trips/email', emailRequest, this.getHeaders());
    };
    this.buildCancelTripRequest = function (cancelTrip) {
      //cancelTrip is an array of itineraries, or a single itinerary
      var cancelRequest = { bookingcancellation_request: [] };
      //process single itineraries
      if (!(cancelTrip instanceof Array)) {
        //if confirmation_ids exist, cancel those rather than the itinerary.id
        if (cancelTrip.confirmation_ids instanceof Array) {
          //build the cancelRequest, make sure booking_confirmation is a string
          cancelRequest.bookingcancellation_request = cancelTrip.confirmation_ids.map(function (booking_confirmation) {
            return { booking_confirmation: '' + booking_confirmation };
          });
          //skip the loop below with an empty array
          cancelTrip = [];
        } else {
          //put the single un-boked itinerary in an array for the forEach
          cancelTrip = [cancelTrip];
        }
      }
      //end single itinerary processing
      //build the cancelRequest
      cancelTrip.forEach(function (cancelItinerary) {
        var request;
        //use the booking_confirmation if there's one, else the itinerary id
        if (cancelItinerary.booking_confirmation > 0) {
          request = { booking_confirmation: '' + cancelItinerary.booking_confirmation };
        } else {
          request = { itinerary_id: '' + cancelItinerary.id };
        }
        cancelRequest.bookingcancellation_request.push(request);
      });
      return cancelRequest;
    };
    this.cancelTrip = function ($http, cancelRequest) {
      return $http.post(urlPrefix + 'api/v1/itineraries/cancel', cancelRequest, this.getHeaders());
    };
    this.validateEmail = function (emailString) {
      var addresses = emailString.split(/[ ,;]+/);
      var valid = true;
      var that = this;
      angular.forEach(addresses, function (address, index) {
        var result = that.validateEmailAddress(address);
        if (result == false) {
          valid = false;
        }
      });
      return valid;
    };
    this.validateEmailAddress = function (email) {
      var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
      return re.test(email);
    };
    var _tripCache = null;
    this.getPastRides = function ($http, $scope, ipCookie) {
      var tripType = 'past', urlPath = 'api/v1/trips/past_trips';
      if (_tripCache !== null) {
        $scope.trips = _tripCache;
      }
      return this.getRidesByType($http, $scope, ipCookie, tripType, urlPath);
    };
    this.getFutureRides = function ($http, $scope, ipCookie) {
      var tripType = 'future', urlPath = 'api/v1/trips/future_trips';
      if (_tripCache !== null) {
        $scope.trips = _tripCache;
      }
      return this.getRidesByType($http, $scope, ipCookie, tripType, urlPath);
    };
    this.getRidesByType = function ($http, $scope, ipCookie, tripType, urlPath) {
      var that = this;
      return $http.get(urlPrefix + urlPath, this.getHeaders()).then(function (response) {
        if (!response.data) {
          console.error('no data');
        }
        var data = response.data;
        var sortable = [], tripDivs = [], trips = [];
        if (!$scope.trips)
          $scope.trips = {};
        if (!$scope.tripDivs)
          $scope.tripDivs = {};
        angular.forEach(data.trips, function (trip, index) {
          if (trip[0].departure && trip[0].status && (trip[0].status != 'canceled' || tripType == 'past')) {
            var i = 0;
            var trip_with_itineraries = {};
            trip_with_itineraries.itineraries = [];
            while (typeof trip[i] !== 'undefined') {
              // Check for first itinerary to set Trip values
              if (i == 0) {
                trip_with_itineraries.mode = trip[i].mode;
                trip_with_itineraries.service_name = trip[i].service_name;
                trip_with_itineraries.startDesc = that.getDateDescription(trip[i].wait_start || trip[i].departure);
                trip_with_itineraries.startDesc += ' at ' + moment(trip[i].wait_start || trip[i].departure).format('h:mm a');
                trip_with_itineraries.booking_confirmation_codes = [];
                angular.forEach(trip, function (t) {
                  //add the booking_confirmation if there is one
                  t.booking_confirmation && trip_with_itineraries.booking_confirmation_codes.push(t.booking_confirmation);
                });
                var origin_addresses = trip[0].origin.address_components;
                for (var n = 0; n < origin_addresses.length; n++) {
                  var address_types = origin_addresses[n].types;
                  if (address_types.length > 0 && address_types.indexOf('street_address') != -1) {
                    trip_with_itineraries.from_place = origin_addresses[n].short_name;
                    break;
                  }
                }
                if (!trip_with_itineraries.from_place && trip[0].origin.name) {
                  trip_with_itineraries.from_place = trip[0].origin.name;
                }
                var destination_addresses = trip[0].destination.address_components;
                for (var j = 0; j < destination_addresses.length; j++) {
                  var address_types = destination_addresses[j].types;
                  if (address_types.length > 0 && address_types.indexOf('street_address') != -1) {
                    trip_with_itineraries.to_place = destination_addresses[j].short_name;
                    break;
                  }
                }
                if (!trip_with_itineraries.to_place && trip[0].destination.name) {
                  trip_with_itineraries.to_place = trip[0].destination.name;
                }
              }
              //normalize some values
              trip[i].start_location = trip[i].start_location || trip[i].origin;
              trip[i].end_location = trip[i].end_location || trip[i].destination;
              trip_with_itineraries.itineraries.push(trip[i]);
              i++;
            }
            trip_with_itineraries.roundTrip = typeof trip[1] !== 'undefined' ? true : false;
            sortable.push([
              trip_with_itineraries,
              trip[0].departure
            ]);
          }
        });
        sortable.sort(function (a, b) {
          return a[1].localeCompare(b[1]);
        });
        angular.forEach(sortable, function (trip_and_departure_array, index) {
          trips.push(trip_and_departure_array[0]);
        });
        if (tripType == 'future') {
          $scope.trips.future = trips;
          $scope.tripDivs.future = tripDivs;
          ipCookie('rideCount', trips.length);
          _tripCache = $scope.trips;
        } else {
          $scope.trips.past = trips;
          $scope.tripDivs.past = tripDivs;
          _tripCache = $scope.trips;
        }
      });
    };
    this.prepareConfirmationPage = function ($scope) {
      var itineraryRequestObject = this.createItineraryRequest();
      this.itineraryRequestObject = itineraryRequestObject;
      var request = {};
      var fromLocationDescription = this.getAddressDescriptionFromLocation(itineraryRequestObject.itinerary_request[0].start_location);
      request.fromLine1 = fromLocationDescription.line1;
      request.fromLine2 = fromLocationDescription.line2;
      var toLocationDescription = this.getAddressDescriptionFromLocation(itineraryRequestObject.itinerary_request[0].end_location);
      request.toLine1 = toLocationDescription.line1;
      request.toLine2 = toLocationDescription.line2;
      var outboundTime = itineraryRequestObject.itinerary_request[0].trip_time;
      request.when1 = this.getDateDescription(outboundTime);
      request.when2 = (itineraryRequestObject.itinerary_request[0].departure_type == 'depart' ? 'Start out at ' : 'Arrive by ') + moment(outboundTime).format('h:mm a');
      if (itineraryRequestObject.itinerary_request.length > 1) {
        request.roundtrip = true;
        //round trip
        var returnTime = itineraryRequestObject.itinerary_request[1].trip_time;
        request.when3 = this.getDateDescription(returnTime);
        if (request.when1 == request.when3) {
          request.sameday = true;
        }
        request.when4 = (itineraryRequestObject.itinerary_request[1].departure_type == 'depart' ? 'Leave at ' : 'Get back by ') + moment(returnTime).format('h:mm a');
      }
      request.purpose = this.purpose;
      $scope.request = request;
      this.confirmRequest = request;
    };
    this.prepareTripSearchResultsPage = function () {
      this.transitItineraries = [];
      this.paratransitItineraries = [];
      this.guestParatransitItinerary = null;
      this.taxiItineraries = [];
      this.uberItineraries = [];
      this.walkItineraries = [];
      this.tripId = this.searchResults.trip_id;
      var currencyFilter = $filter('currency');
      var freeFilter = $filter('free');
      var itineraries = this.searchResults.itineraries;
      var itinerariesBySegmentThenMode = this.getItinerariesBySegmentAndMode(itineraries);
      var fare_info = {};
      fare_info.roundtrip = false;
      if (this.itineraryRequestObject.itinerary_request.length > 1) {
        fare_info.roundtrip = true;
      }
      var that = this;
      angular.forEach(Object.keys(itinerariesBySegmentThenMode), function (segmentIndex, index) {
        var itinerariesByMode = itinerariesBySegmentThenMode[segmentIndex];
        angular.forEach(Object.keys(itinerariesByMode), function (mode_code, index) {
          var fares = [];
          angular.forEach(itinerariesByMode[mode_code], function (itinerary, index) {
            if (itinerary.cost) {
              var fare = parseFloat(Math.round(itinerary.cost * 100) / 100).toFixed(2);
              itinerary.cost = fare;
              fares.push(fare);
            } else if (itinerary.discounts) {
              itinerary.travelTime = humanizeDuration(itinerary.duration * 1000, {
                units: [
                  'hours',
                  'minutes'
                ],
                round: true
              });
              itinerary.startTime = moment(itinerary.start_time).format('h:mm a');
              that.guestParatransitItinerary = itinerary;
              angular.forEach(itinerary.discounts, function (discount, index) {
                var fare = parseFloat(Math.round(discount.fare * 100) / 100).toFixed(2);
                fares.push(fare);
              });
            }
          });
          if (fares.length > 0) {
            var lowestFare = Math.min.apply(null, fares).toFixed(2);
            var highestFare = Math.max.apply(null, fares).toFixed(2);
            lowestFare = currencyFilter(lowestFare);
            highestFare = currencyFilter(highestFare);
            if (lowestFare == highestFare || mode_code == 'mode_paratransit' && that.email) {
              fare_info[[mode_code]] = freeFilter(lowestFare);  //if the user is registered, show the lowest paratransit fare
            } else {
              fare_info[[mode_code]] = lowestFare + '-' + highestFare;
            }
          }
        });
      });
      var itinerariesByModeOutbound = itinerariesBySegmentThenMode ? itinerariesBySegmentThenMode[0] : null;
      var itinerariesByModeReturn = itinerariesBySegmentThenMode ? itinerariesBySegmentThenMode[1] : null;
      if (itinerariesByModeOutbound) {
        if (itinerariesByModeOutbound.mode_paratransit) {
          var lowestPricedParatransitTrip = this.getLowestPricedParatransitTrip(itinerariesByModeOutbound.mode_paratransit);
          if (!this.email) {
            //guest user, just use the first paratransit itinerary since the prices are unknown
            lowestPricedParatransitTrip = this.guestParatransitItinerary;
          }
          if (lowestPricedParatransitTrip) {
            this.paratransitItineraries.push(lowestPricedParatransitTrip);
            fare_info.paratransitTravelTime = lowestPricedParatransitTrip.travelTime;
            fare_info.paratransitStartTime = lowestPricedParatransitTrip.startTime;
          }
        }
        if (itinerariesByModeOutbound.mode_transit) {
          this.transitItineraries.push(itinerariesByModeOutbound.mode_transit);
        }
        //Taxi trips are grouped by taxi company, ordered low to high
        if (itinerariesByModeOutbound.mode_taxi) {
          this.taxiItineraries = itinerariesByModeOutbound.mode_taxi;
        }
        if (itinerariesByModeOutbound.mode_ride_hailing) {
          this.uberItineraries = itinerariesByModeOutbound.mode_ride_hailing;
        }
        if (itinerariesByModeOutbound.mode_walk) {
          this.walkItineraries.push(itinerariesByModeOutbound.mode_walk[0]);
        }
      }
      //if a mode doesn't appear in both outbound and return itinerary lists, remove it
      if (itinerariesByModeReturn && fare_info.roundtrip == true) {
        if (itinerariesByModeReturn.mode_transit) {
          this.transitItineraries.push(itinerariesByModeReturn.mode_transit);
        } else {
          this.transitItineraries = [];
        }
        if (itinerariesByModeReturn.mode_paratransit && this.email) {
          //this doesn't matter for guest users since they can't book anyway
          var lowestPricedParatransitTrip = this.getLowestPricedParatransitTrip(itinerariesByModeReturn.mode_paratransit);
          if (lowestPricedParatransitTrip) {
            this.paratransitItineraries.push(lowestPricedParatransitTrip);
          } else {
            this.paratransitItineraries = [];
          }
        }
        if (itinerariesByModeReturn.mode_taxi) {
          //merge the return itineraries into the other itineraries, matching the service_ids
          itinerariesByModeReturn.mode_taxi.forEach(function (returnItinerary) {
            //find the matching taxiItinerary, merge into that
            that.taxiItineraries.forEach(function (departItinerary) {
              if (departItinerary.service_id == returnItinerary.service_id) {
                departItinerary.returnItinerary = returnItinerary;
              }
            });
          });
        } else {
          this.taxiItineraries = [];
        }
        if (itinerariesByModeReturn.mode_ride_hailing) {
          //merge the return itineraries into the other itineraries, matching the service_ids
          itinerariesByModeReturn.mode_ride_hailing.forEach(function (returnItinerary) {
            //find the matching itinerary, merge into that
            that.uberItineraries.forEach(function (departItinerary) {
              if (departItinerary.service_id == returnItinerary.service_id) {
                departItinerary.returnItinerary = returnItinerary;
              }
            });
          });
        } else {
          this.uberItineraries = [];
        }
        if (itinerariesByModeReturn.mode_walk) {
          this.walkItineraries.push(itinerariesByModeReturn.mode_walk[0]);
        } else {
          this.walkItineraries = [];
        }
      }
      this.transitInfos = [];
      if (itinerariesByModeOutbound && itinerariesByModeOutbound.mode_transit) {
        this.transitInfos.push(this.prepareTransitOptionsPage(itinerariesBySegmentThenMode[0].mode_transit));
        //check for return, reseet transitInfos if this is round trip and no return
        if (itinerariesByModeReturn && itinerariesByModeReturn.mode_transit) {
          //for round trips, show the fare as the sum of the two recommended fares
          this.transitInfos.push(this.prepareTransitOptionsPage(itinerariesBySegmentThenMode[1].mode_transit));
          if (this.selectedBusOption) {
            var fare1 = this.transitInfos[0][this.selectedBusOption[0]].cost;
            var fare2 = this.transitInfos[1][this.selectedBusOption[1]].cost;
          } else {
            var fare1 = this.transitInfos[0][0].cost;
            var fare2 = this.transitInfos[1][0].cost;
          }
          fare_info.mode_transit = freeFilter(currencyFilter((Number(fare1) + Number(fare2)).toFixed(2).toString()));
        } else if (fare_info.roundtrip == true) {
          this.transitInfos = [];
        }
      }
      if (this.email) {
        if (this.paratransitItineraries.length > 1) {
          //for round trips, show the fare as the sum of the two PARATRANSIT fares
          var fare1 = this.paratransitItineraries[0].cost || 0;
          var fare2 = this.paratransitItineraries[1].cost || 0;
          fare_info.mode_paratransit = freeFilter(currencyFilter((Number(fare1) + Number(fare2)).toFixed(2).toString()));
        } else if (this.paratransitItineraries.length == 1) {
          fare_info.mode_paratransit = freeFilter(currencyFilter(Number(this.paratransitItineraries[0].cost).toFixed(2).toString()));
        }
      }
      this.fare_info = fare_info;
    };
    this.getLowestPricedParatransitTrip = function (paratransitTrips) {
      var lowestPricedParatransitTrip;
      angular.forEach(paratransitTrips, function (paratransitTrip, index) {
        if (isNaN(parseInt(paratransitTrip.cost))) {
          paratransitTrip.cost = 0;
        }
        if (paratransitTrip.duration && paratransitTrip.start_time && paratransitTrip.cost >= 0) {
          paratransitTrip.travelTime = humanizeDuration(paratransitTrip.duration * 1000, {
            units: [
              'hours',
              'minutes'
            ],
            round: true
          });
          paratransitTrip.startTime = moment(paratransitTrip.start_time).format('h:mm a');
          if (!lowestPricedParatransitTrip) {
            lowestPricedParatransitTrip = paratransitTrip;
          } else {
            if (Number(paratransitTrip.cost) < Number(lowestPricedParatransitTrip.cost)) {
              lowestPricedParatransitTrip = paratransitTrip;
            }
          }
          lowestPricedParatransitTrip.travelTime = humanizeDuration(paratransitTrip.duration * 1000, {
            units: [
              'hours',
              'minutes'
            ],
            round: true
          });
          lowestPricedParatransitTrip.startTime = moment(paratransitTrip.start_time).format('h:mm a');
        }
      });
      return lowestPricedParatransitTrip;
    };
    this.getItinerariesBySegmentAndMode = function (itineraries) {
      var itinerariesBySegmentThenMode = {};
      var that = this;
      angular.forEach(itineraries, function (itinerary, index) {
        that.prepareItinerary(itinerary);
        var mode = itinerary.returned_mode_code;
        var segment_index = itinerary.segment_index;
        if (itinerariesBySegmentThenMode[segment_index] == undefined) {
          itinerariesBySegmentThenMode[segment_index] = {};
        }
        if (itinerariesBySegmentThenMode[segment_index][mode] == undefined) {
          itinerariesBySegmentThenMode[segment_index][mode] = [];
        }
        itinerariesBySegmentThenMode[segment_index][mode].push(itinerary);
      }, itinerariesBySegmentThenMode);
      return itinerariesBySegmentThenMode;
    };
    this.prepareTransitOptionsPage = function (transitItineraries) {
      var transitInfos = [];
      angular.forEach(transitItineraries, function (itinerary, index) {
        var transitInfo = {};
        transitInfo.id = itinerary.id;
        transitInfo.cost = itinerary.cost;
        transitInfo.startTime = itinerary.start_time;
        transitInfo.startDesc = itinerary.startTimeDesc;
        transitInfo.endDesc = itinerary.endTimeDesc;
        transitInfo.travelTime = itinerary.travelTime;
        transitInfo.duration = itinerary.duration;
        var found = false;
        angular.forEach(itinerary.json_legs, function (leg, index) {
          if (!found && leg.mode == 'BUS') {
            transitInfo.route = leg.routeShortName;
            found = true;
          }
        });
        transitInfo.walkTime = itinerary.walkTimeDesc;
        transitInfo.walkTimeInSecs = itinerary.walk_time;
        transitInfos.push(transitInfo);
      }, transitInfos);
      angular.forEach(transitInfos, function (transitInfo, index) {
        if (index == 0) {
          transitInfo.label = 'Recommended';
          return;
        }
        var best = transitInfos[0];
        if (transitInfo.cost < best.cost) {
          transitInfo.label = 'Cheaper';
        } else if (transitInfo.walkTimeInSecs < best.walkTimeInSecs / 2) {
          transitInfo.label = 'Less Walking';
        } else if (transitInfo.duration < best.duration) {
          transitInfo.label = 'Faster';
        } else if (transitInfo.walkTimeInSecs < best.walkTimeInSecs) {
          transitInfo.label = 'Less Walking';
        } else if (transitInfo.cost > best.cost) {
          transitInfo.label = 'More Expensive';
        } else if (transitInfo.startTime < best.startTime) {
          transitInfo.label = 'Earlier';
        } else if (transitInfo.startTime > best.startTime) {
          transitInfo.label = 'Later';
        } else {
          transitInfo.label = 'Similar';
        }
      });
      return transitInfos;
    };
    this.prepareItinerary = function (itinerary) {
      this.setItineraryDescriptions(itinerary);
      if (itinerary.cost) {
        itinerary.cost = parseFloat(Math.round(itinerary.cost * 100) / 100).toFixed(2);
      }
      if (itinerary.json_legs) {
        var that = this;
        angular.forEach(itinerary.json_legs, function (leg, index) {
          that.setItineraryLegDescriptions(leg);
          if (leg.steps) {
            angular.forEach(leg.steps, function (step, index) {
              that.setWalkingDescriptions(step);
            });
          }
        });
        itinerary.destinationDesc = itinerary.json_legs[itinerary.json_legs.length - 1].to.name;
        itinerary.destinationTimeDesc = itinerary.json_legs[itinerary.json_legs.length - 1].endTimeDesc;
      }
    };
    this.setItineraryDescriptions = function (itinerary) {
      var startTime = itinerary.wait_start || itinerary.departure || itinerary.start_time;
      itinerary.startDesc = this.getDateDescription(startTime);
      itinerary.startDesc += ' at ' + moment(startTime).format('h:mm a');
      itinerary.endDesc = this.getDateDescription(itinerary.arrival);
      itinerary.endDesc += ' at ' + moment(itinerary.arrival).format('h:mm a');
      itinerary.travelTime = humanizeDuration(itinerary.duration * 1000, {
        units: [
          'hours',
          'minutes'
        ],
        round: true
      });
      itinerary.walkTimeDesc = humanizeDuration(itinerary.walk_time * 1000, {
        units: [
          'hours',
          'minutes'
        ],
        round: true
      });
      itinerary.dayAndDateDesc = moment(startTime).format('dddd, MMMM Do');
      itinerary.startTimeDesc = moment(itinerary.wait_start || itinerary.departure).format('h:mm a');
      itinerary.endTimeDesc = itinerary.arrival ? moment(itinerary.arrival).format('h:mm a') : 'Arrive';
      itinerary.distanceDesc = (itinerary.distance * 0.000621371).toFixed(2);
      itinerary.walkDistanceDesc = (itinerary.walk_distance * 0.000621371).toFixed(2);
    };
    this.setItineraryLegDescriptions = function (itinerary) {
      itinerary.startDateDesc = this.getDateDescription(itinerary.startTime);
      itinerary.startTimeDesc = moment(itinerary.startTime).format('h:mm a');
      itinerary.startDesc = itinerary.startDateDesc + ' at ' + itinerary.startTimeDesc;
      itinerary.endDateDesc = this.getDateDescription(itinerary.endTime);
      itinerary.endTimeDesc = moment(itinerary.endTime).format('h:mm a');
      itinerary.endDesc = itinerary.endDateDesc + ' at ' + itinerary.endTimeDesc;
      itinerary.travelTime = humanizeDuration(itinerary.duration * 1000, {
        units: [
          'hours',
          'minutes'
        ],
        round: true
      });
      itinerary.distanceDesc = (itinerary.distance * 0.000621371).toFixed(2);
      itinerary.dayAndDateDesc = moment(itinerary.startTime).format('dddd, MMMM Do');
    };
    this.setWalkingDescriptions = function (step) {
      step.distanceDesc = (step.distance * 0.000621371).toFixed(2);
      step.arrow = 'straight';
      if (step.relativeDirection.indexOf('RIGHT') > -1) {
        step.arrow = 'right';
      } else if (step.relativeDirection.indexOf('LEFT') > -1) {
        step.arrow = 'left';
      }
      if (step.relativeDirection == 'DEPART') {
        step.description = 'Head ' + step.absoluteDirection.toLowerCase() + ' on ' + step.streetName;
      } else {
        step.description = this.capitalizeFirstLetter(step.relativeDirection) + ' on ' + step.streetName;
      }
      step.description = step.description.replace(/_/g, ' ');
    };
    this.capitalizeFirstLetter = function (string) {
      return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    };
    this.getAddressDescriptionFromLocation = function (location) {
      var description = {};
      if (location.poi) {
        description.line1 = location.poi.name;
        description.line2 = location.formatted_address;
        if (description.line2.indexOf(description.line1) > -1) {
          description.line2 = description.line2.substr(description.line1.length + 2);
        }
      } else if (location.name) {
        description.line1 = location.name;
        description.line2 = location.formatted_address;
        if (description.line2.indexOf(description.line1) > -1) {
          description.line2 = description.line2.substr(description.line1.length + 2);
        }
      } else {
        angular.forEach(location.address_components, function (address_component, index) {
          if (address_component.types.indexOf('street_address') > -1) {
            description.line1 = address_component.long_name;
          }
        }, description.line1);
        description.line2 = location.formatted_address;
        if (description.line2.indexOf(description.line1) > -1) {
          description.line2 = description.line2.substr(description.line1.length + 2);
        }
      }
      return description;
    };
    this.getDateDescription = function (date) {
      if (!date)
        return null;
      var description;
      var now = moment().startOf('day');
      var then = moment(date).startOf('day');
      var dayDiff = now.diff(then, 'days');
      if (dayDiff == 0) {
        description = $translate.instant('today');
      } else if (dayDiff == -1) {
        description = $translate.instant('tomorrow');
      } else if (dayDiff == 1) {
        description = $translate.instant('yesterday');
      } else {
        description = moment(date).format('dddd MMM DD, YYYY');
      }
      return description;
    };
    this.getTripPurposes = function ($scope, $http) {
      this.fixLatLon(this.fromDetails);
      return $http.post(urlPrefix + 'api/v1/trip_purposes/list', this.fromDetails, this.getHeaders()).then(function (response) {
        if (!response.data) {
          console.error('no data');
        }
        var data = response.data;
        $scope.top_purposes = data.top_trip_purposes;
        data.trip_purposes = data.trip_purposes || [];
        $scope.purposes = data.trip_purposes.filter(function (el) {
          var i;
          for (i = 0; i < $scope.top_purposes.length; i += 1) {
            if (el.code && $scope.top_purposes[i].code === el.code) {
              return false;
            }
          }
          return true;
        });
        if (data.default_trip_purpose != undefined && $scope.email == undefined) {
          $scope.default_trip_purpose = data.default_trip_purpose;
          $scope.showNext = true;
        }
      }).error(function (data) {
        alert(data);
      });
    };
    this.selectItineraries = function ($http, itineraryObject) {
      return $http.post(urlPrefix + 'api/v1/itineraries/select', itineraryObject, this.getHeaders());
    };
    this.checkServiceArea = function ($http, place) {
      this.fixLatLon(place);
      return $http.post(urlPrefix + 'api/v1/places/within_area', place, this.getHeaders());
    };
    var itineraryRequestPromise;
    this.postItineraryRequest = function ($http) {
      ga('send', 'event', 'Search');
      $rootScope.$broadcast('PlanService:beforeUpdateItineraryResults');
      var planService = this;
      planService.itineraries = null;
      !itineraryRequestPromise || itineraryRequestPromise.abort();
      var deferredAbort = $q.defer();
      var config = this.getHeaders();
      config.timeout = deferredAbort.promise;
      itineraryRequestPromise = $http.post(urlPrefix + 'api/v1/itineraries/plan', this.itineraryRequestObject, config);
      itineraryRequestPromise.abort = function () {
        deferredAbort.resolve();
      };
      itineraryRequestPromise.then(function (response) {
        var alphabetical = function (a, b) {
          var textA = a.toUpperCase();
          var textB = b.toUpperCase();
          return textA < textB ? -1 : textA > textB ? 1 : 0;
        };
        //set self properties first
        planService.accommodationsQuestions = response.data.accommodations;
        planService.characteristicsQuestions = response.data.characteristics;
        var modes = {};
        planService.itineraries = response.data.itineraries.map(function (itinerary) {
          if (itinerary.cost != null) {
            itinerary.cost = parseFloat(itinerary.cost) || 0;
          }
          itinerary.walk_distance = parseFloat(itinerary.walk_distance) || 0;
          itinerary.duration = parseInt(itinerary.duration) || 0;
          if (!itinerary.hidden) {
            modes[itinerary.returned_mode_code] = null;
          }
          //bookable services require a place to keep pre-booking question answers
          if (itinerary.service_bookable) {
            //populate the answers with the first value
            itinerary.answers = {};
            itinerary.prebooking_questions.forEach(function (e) {
              itinerary.answers[e.code] = null;
            });
            itinerary.returnTimeOptions = planService.returnTimeOptions(itinerary);
          }
          return itinerary;
        });
        planService.purposes = response.data.purposes;
        planService.tripId = response.data.trip_id;
        planService.itineraryModes = Object.keys(modes).sort(alphabetical);
        $rootScope.$broadcast('PlanService:updateItineraryResults', response.data);
        itineraryRequestPromise = false;
      }).catch(function(e){
        //broadcast the error if it's a number over 0
        if(e.status > 0 ){
          $rootScope.$broadcast('PlanService:updateItineraryResultsError', e.data);
        }
        itineraryRequestPromise = false;
      });
      return itineraryRequestPromise;
    };
    // Returns a nice array of time labels for populating the return time picker drop-down.
    this.returnTimeOptions = function (itinerary) {
      // function to generate labels
      var _timeLabel = function (labelTime, startTime) {
        return {
          time: labelTime.toISOString(),
          label: $filter('humanizeDuration')(moment.duration(labelTime - startTime))
        };
      };
      // Set the start time based on the itinerary.
      var arrivalTime = moment(new Date(itinerary.end_time || ''));
      //schedule keys are english, get the arrivalDay in english
      var arrivalDay = arrivalTime.clone().locale('en').format('dddd');
      try {
        //find the schedule for the start day
        var scheduleDay = itinerary.schedule.filter(function (s) {
          return s.day == arrivalDay;
        }).slice(-1)[0];
        // Take the last schedule day if there are multiple.
        var scheduleStart = moment(arrivalTime.format('YYYY-MM-DD ') + scheduleDay.end[0], 'YYYY-MM-DD h:mm A');
        var scheduleEnd = moment(arrivalTime.format('YYYY-MM-DD ') + scheduleDay.end[0], 'YYYY-MM-DD h:mm A');
        /* Start with 60 minutes after the arrival time of the trip and move forward.
          While before the end of the service's hours for that day, add time options
          every 15 minutes until the end of the service day. */
        var startTime = moment.min(arrivalTime, scheduleStart);
        var endTime = moment.min(scheduleEnd, arrivalTime.clone().add(12, 'hours'));
        var labelTime = arrivalTime.clone().add(60, 'minutes');
        var timeOptions = [];
        while (labelTime.isBefore(endTime)) {
          timeOptions.push(_timeLabel(labelTime, startTime));
          labelTime.add(15, 'minutes');
        }
      } catch (e) {
        console.error(e);
      } finally {
        return timeOptions;
      }
    };
    var guestUserTokenPromise;
    this.getGuestToken = function ($http) {
      // only request the token once, return the last promise if necessary 
      if(guestUserTokenPromise){
        return guestUserTokenPromise;
      }
      var planService = this;
      var guestUserTokenPromise = $http.get(urlPrefix + 'api/v1/users/get_guest_token');
      guestUserTokenPromise.then(function (response) {
        planService.email = response.data.email;
        planService.authentication_token = response.data.authentication_token;
      });
      return guestUserTokenPromise;
    };
    this.buildProfileUpdateRequest = function (profile) {
      //cleanup profile for update request
      var accommodationsRequest = {}, characteristicsRequest = {};
      //process the profile keys to work for the request
      if (profile.accommodations.length > 0) {
        profile.accommodations.forEach(function (accommodation) {
          accommodationsRequest[accommodation.code] = accommodation.value;
        });
        profile.accommodations = accommodationsRequest;
      }
      if (profile.characteristics.length > 0) {
        profile.characteristics.forEach(function (characteristic) {
          characteristicsRequest[characteristic.code] = characteristic.value;
        });
        profile.characteristics = characteristicsRequest;
      }
      return profile;
    };
    this.postProfileUpdate = function ($http, profile) {
      var planService = this;
      return $http.post(urlPrefix + 'api/v1/users/update', profile, this.getHeaders());
    };
    var profilePromise = false;
    this.getProfile = function ($http, ipCookie) {
      
      //return the existing promise if there is one
      if (profilePromise) {
        return profilePromise;
      }
      profilePromise = $http.get(urlPrefix + 'api/v1/users/profile', this.getHeaders());
      var planService = this;
      var _resetProfilePromise = function () {
        setTimeout(function () {
          profilePromise = false;
        }, 100);
      };
      profilePromise.then(function (response) {
        // If the profile isn't valid, delete the email/auth_token and reload
        if(!response.data.email || !response.data.first_name){
          planService.email = null;
          planService.authentication_token = null;
          ipCookie.remove('email');
          ipCookie.remove('authentication_token');
          window.location.reload();
        }
        planService.profile = response.data;
        planService.first_name = response.data.first_name;
        planService.last_name = response.data.last_name;
        //drop the profilePromise after promises have run
        _resetProfilePromise();
      }).catch(function (e) {
        _resetProfilePromise();
      });
      return profilePromise;
    };
    this.getServiceHours = function ($http) {
      return $http.get(urlPrefix + '/api/v1/services/hours', this.getHeaders());
    };
    this.bookItinerary = function ($http, bookingRequest) {
      //replacement for bookSharedRide
      var request = { booking_request: bookingRequest };
      ga('send', 'event', 'Booking');
      return $http.post(urlPrefix + 'api/v1/itineraries/book', request, this.getHeaders());
    };
    this.bookSharedRide = function ($http) {
      console.log('depricated');
      var requestHolder = {};
      requestHolder.booking_request = [];
      var that = this;
      angular.forEach(this.paratransitItineraries, function (paratransitItinerary, index) {
        var bookingRequest = {};
        bookingRequest.itinerary_id = paratransitItinerary.id;
        if (that.hasEscort) {
          bookingRequest.escort = that.hasEscort;
        }
        if (that.numberOfFamily) {
          bookingRequest.family = that.numberOfFamily;
        }
        if (that.numberOfCompanions) {
          bookingRequest.companions = that.numberOfCompanions;
        }
        if (that.driverInstructions) {
          bookingRequest.note = that.driverInstructions;
        }
        requestHolder.booking_request.push(bookingRequest);
      });
      this.booking_request = requestHolder;
      ga('send', 'event', 'Booking');
      return $http.post(urlPrefix + 'api/v1/itineraries/book', requestHolder, this.getHeaders());
    };
    this.createItineraryRequest = function () {
      if (this.fromDetails && this.fromDetails.poi) {
        this.fromDetails.name = this.fromDetails.poi.name;
      }
      if (this.toDetails && this.toDetails.poi) {
        this.toDetails.name = this.toDetails.poi.name;
      }
      var request = {};
      request.trip_purpose = this.purpose;
      request.itinerary_request = [];
      var outboundTrip = {};
      outboundTrip.segment_index = 0;
      outboundTrip.start_location = this.fromDetails;
      outboundTrip.end_location = this.toDetails;
      //optimize request -- remove unnecessary data
      if (outboundTrip.start_location.reviews) {
        delete outboundTrip.start_location.reviews;
      }
      if (outboundTrip.end_location.reviews) {
        delete outboundTrip.end_location.reviews;
      }
      this.addStreetAddressToLocation(outboundTrip.start_location);
      this.addStreetAddressToLocation(outboundTrip.end_location);
      this.fixLatLon(outboundTrip.start_location);
      this.fixLatLon(outboundTrip.end_location);
      var fromTime = this.fromTime;
      if (fromTime == null) {
        fromTime = new Date();
      } else {
        fromTime = moment(this.fromTime).toDate();
      }
      var fromDate = moment(this.fromDate).startOf('day').toDate();
      fromDate.setHours(fromTime.getHours());
      fromDate.setMinutes(fromTime.getMinutes());
      outboundTrip.trip_time = moment.utc(fromDate).format();
      if (this.asap) {
        outboundTrip.trip_time = moment.utc(new Date()).format();
        outboundTrip.departure_type = 'depart';
      } else {
        outboundTrip.departure_type = this.fromTimeType;
      }
      request.itinerary_request.push(outboundTrip);
      if (this.returnDate) {
        var returnTrip = {};
        returnTrip.segment_index = 1;
        returnTrip.start_location = this.toDetails;
        returnTrip.end_location = this.fromDetails;
        returnTrip.departure_type = this.returnTimeType;
        var returnTime = this.returnTime;
        if (returnTime == null) {
          returnTime = new Date();
        } else {
          returnTime = moment(this.returnTime).toDate();
        }
        var returnDate = moment(this.returnDate).startOf('day').toDate();
        returnDate.setHours(returnTime.getHours());
        returnDate.setMinutes(returnTime.getMinutes());
        var returnTimeString = moment.utc(returnDate).format();
        returnTrip.trip_time = returnTimeString;
        request.itinerary_request.push(returnTrip);
      }
      //if the profile was updated, include it in the request
      if (this.user_profile) {
        request.user_profile = this.user_profile;
        delete this.user_profile;
      }
      request.modes = this.allModes;
      if (this.tripPurpose) {
        request.trip_purpose = this.tripPurpose;
      }
      return request;
    };
    this.setTripPurpose = function (purpose) {
      if (purpose) {
        this.tripPurpose = purpose;
      } else {
        //deleting trip purpose sets to all
        delete this.tripPurpose;
      }
    };
    this.addStreetAddressToLocation = function (location) {
      return;  /*
        var street_address;
        angular.forEach(location.address_components, function(address_component, index) {
          if(address_component.types.indexOf("street_number") > -1){
            street_address = address_component.long_name + " ";
          }
        }, street_address);

        angular.forEach(location.address_components, function(address_component, index) {
          if(address_component.types.indexOf("route") > -1){
            street_address += address_component.long_name;
          }
        }, street_address);

        location.address_components.push(
          {
            "long_name": street_address,
            "short_name": street_address,
            "types": [
              "street_address"
            ]
          }
        )
        */
    };
    this.fixLatLon = function (location) {
    };
    this.getHeaders = function () {
      //return empty object if no email
      if (!this.email) {
        return {};
      }
      var headers = {
        headers: {
          'X-User-Email': this.email,
          'X-User-Token': this.authentication_token
        }
      };
      return headers;
    };
  }
]);
angular.module('oneClickApp').service('LocationSearch', [
  '$http',
  '$q',
  'localStorageService',
  '$filter',
  'planService',
  function ($http, $q, localStorageService, $filter, planService) {
    var countryFilter = $filter('noCountry');
    var urlPrefix = '//' + APIHOST + '/';
    var autocompleteService = new google.maps.places.AutocompleteService();
    var LocationSearch = {};
    var recentRemoteSearches = {};
    var recentsConfig = planService.getHeaders();
    var getRecentSearches = function(){
      //get the recent searches
      $http.get(urlPrefix + '/api/v1/places/recent', recentsConfig).then(function (response) {
        if (!response.data) {
          return;
        }
        var data = response.data;
        if (data.places) {
          angular.forEach(data.places, function (place) {
            recentRemoteSearches[place.name] = place;
          });
        }
      });
    };
    //if the config is ready, go. but otherwise get the guest user token 
    if(recentsConfig.headers && recentsConfig.headers['X-User-Token']){
      getRecentSearches();
    }else{
      //get guest user token, then get recent searches
      planService.getGuestToken($http).then(function(){
        //update the recentsConfig headers with teh token
        recentsConfig = planService.getHeaders();
        getRecentSearches();
      });
    }

    LocationSearch.getLocations = function (text, config, includeRecentSearches) {
      var compositePromise = $q.defer();
      if (includeRecentSearches == true) {
        $q.all([
          LocationSearch.getGooglePlaces(text),
          LocationSearch.getSavedPlaces(text, config),
          LocationSearch.getRecentSearches(text)
        ]).then(function (results) {
          compositePromise.resolve(results);
        });
      } else {
        $q.all([
          LocationSearch.getGooglePlaces(text),
          LocationSearch.getSavedPlaces(text, config)
        ]).then(function (results) {
          compositePromise.resolve(results);
        });
      }
      return compositePromise.promise;
    };
    LocationSearch.getGooglePlaces = function (text) {
      var googlePlaceData = $q.defer();
      this.placeIds = [];
      this.results = [];
      var that = this;
      var request = {
        input: text,
        componentRestrictions: {country: 'us'}
      };
      // if map_radius is defined, use that. Otherwise use the map_bounds
      if( !dist_env.map_radius ){
        request.bounds = new google.maps.LatLngBounds( new google.maps.LatLng(dist_env.map_bounds.latA, dist_env.map_bounds.lonA), new google.maps.LatLng(dist_env.map_bounds.latB, dist_env.map_bounds.lonB));
      }else{
        request.location = new google.maps.LatLng(dist_env.map_radius.location[0], dist_env.map_radius.location[1]);
        request.radius = dist_env.map_radius.radius;
      }
      autocompleteService.getPlacePredictions(request, function (list, status) {
        angular.forEach(list, function (value, index) {
          var formatted_address;
          // skip this value (return) if the state_bounds is set (ucase, 2letter state code), and the bounds could not be found in terms
          if( dist_env.state_bounds && !value.terms.some(function(t){ return t.value === dist_env.state_bounds; }) ){
            return;
          }
          //verify the location has a street address
          if (that.results.length < 10 && (value.types.indexOf('route') > -1 || value.types.indexOf('establishment') > -1 || value.types.indexOf('street_address') > -1)) {
            //var terms = [];
            //angular.forEach(value.terms, function(term, index) { terms.push(term.value); }, terms);
            formatted_address = countryFilter(value.description);
            that.results.push(formatted_address);
            that.placeIds.push(value.place_id);
          }
        });
        googlePlaceData.resolve({
          googleplaces: that.results,
          placeIds: that.placeIds
        });
      });
      return googlePlaceData.promise;
    };
    LocationSearch.getRecentSearches = function (text) {
      var recentSearchData = $q.defer();
      var recentSearches = recentRemoteSearches;
      //localStorageService.get('recentSearches');
      if (!recentSearches) {
        recentSearchData.resolve({
          recentsearches: [],
          placeIds: []
        });
      } else {
        this.recentSearchResults = [];
        this.recentSearchPlaceIds = [];
        var that = this;
        angular.forEach(Object.keys(recentSearches), function (key, index) {
          if (that.recentSearchResults.length < 10 && key.toLowerCase().indexOf(text.toLowerCase()) > -1 && that.recentSearchResults.indexOf(key) < 0) {
            var location = recentSearches[key];
            that.recentSearchResults.push(countryFilter(key));
            that.recentSearchPlaceIds.push(location.place_id);
          }
        });
        recentSearchData.resolve({
          recentsearches: that.recentSearchResults,
          placeIds: that.recentSearchPlaceIds
        });
      }
      return recentSearchData.promise;
    };
    LocationSearch.getSavedPlaces = function (text, config) {
      var savedPlaceData = $q.defer();
      this.savedPlaceIds = [];
      this.savedPlaceAddresses = [];
      this.savedPlaceResults = [];
      this.poiData = [];
      var that = this;
      $http.get(urlPrefix + 'api/v1/places/search?include_user_pois=true&search_string=%25' + text + '%25', config).then(function (response) {
        if (!response.data) {
          console.error('no data');
        }
        var data = response.data;
        var locations = data.places_search_results.locations;
        angular.forEach(locations, function (value, index) {
          if (that.savedPlaceResults.length < 10) {
            that.savedPlaceResults.push(value.name + ' ' + value.formatted_address);
            that.savedPlaceAddresses.push(value.formatted_address);
            that.savedPlaceIds.push(value.place_id);
            that.poiData.push(value);
          }
        });
        savedPlaceData.resolve({
          savedplaces: that.savedPlaceResults,
          placeIds: that.savedPlaceIds,
          savedplaceaddresses: that.savedPlaceAddresses,
          poiData: that.poiData
        });
      });
      return savedPlaceData.promise;
    };
    return LocationSearch;
  }
]);
