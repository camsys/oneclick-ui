'use strict';
var app = angular.module('oneClickApp');
var debugHelper;
app.controller('PlanController', [
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
    var currentLocationLabel = 'Current Location';
    var urlPrefix = '//' + APIHOST + '/';
    var eightAm = new Date();
    var countryFilter = $filter('noCountry');
    debugHelper = function (index) {
      index = index || 0;
      var from = [
        '100 North, Salt Lake City, UT',
        '1596 W Warnock Ave, West Valley City, UT 84119',
        'Tooele High School',
        '150 Main Street, Geneseo, NY',
        'Amtrak Salt Lake City Station',
        '3251 Eastern Blvd, York, Pa'
      ];
      var to = [
        'Utah DMV Tooele Office',
        '1860 W 4100 S, West Valley City, UT 84119',
        'Utah DMV Tooele Office',
        '1 College Circle, Geneseo, NY',
        'Salt Lake City International Airport',
        'York City Hall, South George Street'
      ];
      setTimeout(function () {
        var exit = false;
        var count = 0, plan = function () {
            if (!planService.from || !planService.to) {
              count++;
              if (count < 15) {
                setTimeout(plan, 1000);
              }
            } else {
              $scope.planFromLanding();
            }
          };
        if (exit || $location.path() != '/') {
          return;
        }
        $scope.rideTime = new Date();
        $scope.rideTime.setDate($scope.rideTime.getDate() + 14);
        $scope.from = from[index];
        mapOnBlur($scope.from, 'from');
        setTimeout(function () {
          $scope.to = to[index];
          mapOnBlur($scope.to, 'to');
          plan();
        }, 1000);
      }, 1000);
    };
    //FIXME remove debug code before production
    //!APIHOST.match(/local$/) || debugHelper();
    $scope.refreshResults = $location.path() !== '/';
    $scope.itineraryModes = [];
    $scope.accommodations = {};
    $scope.characteristics = {};
    $scope.tripPurpose = null;
    var planTimeoutId = null;
    $scope.planFromResults = function () {
      //only run after a timeout, and cancel the previous if called again within the timeout
      var timeout = 700;
      if (planTimeoutId) {
        clearTimeout(planTimeoutId);
      }
      planTimeoutId = setTimeout(function () {
        _planTrip();
        planTimeoutId = null;
      }, timeout);
    };
    $scope.planFromLanding = function () {
      //plan the trip if planService is ready
      if (planService.from && planService.to) {
        planService.fromTimeType = $scope.fromTimeType;
        _planTrip();
        return;
      }
      //try selecting $scope.to and $scope.from
      //use promises to first try selecting the from, then to
      //resulting operatoins are async, will pass in deferred object
      var deferredFrom = $q.defer();
      //if from is OK, resolve deferredFrom to try 'to'
      if (planService.from) {
        deferredFrom.resolve();
      } else if (!planService.from && $scope.from) {
        if (!$scope.selectPlace($scope.from, 'from', true, deferredFrom)) {
          deferredFrom.reject('Could not select');
        }
        //wait for deferredFrom to resolve/reject
        setTimeout(deferredFrom.reject, 45000);
      }
      deferredFrom.promise.then(function () {
        //once FROM is resolved, try TO
        //TODO: these could be paralell
        var deferredTo = $q.defer();
        var success = false;
        var updateScopeTo = false;
        if (planService.to) {
          deferredTo.resolve();
        }
        if (!planService.to && $scope.to) {
          updateScopeTo = true;
          if (!$scope.selectPlace($scope.to, 'to', true, deferredTo)) {
            deferredTo.reject('Could not select');
          }
          //wait for deferredTo to resolve/reject
          setTimeout(deferredTo.reject, 45000);
        }
        deferredTo.promise.then(function () {
          //once TO is resolved, plan the trip
          success = true;
          if (false && updateScopeTo) {
            //$scope.to = countryFilter(planService.toDetails.formatted_address);
            planService.to = $scope.to;
          }
          _planTrip();
        }).catch(function (e) {
          if (!success) {
            $scope.errors.to = $translate.instant('address_not_found');
          }
        });
      }).catch(function (e) {
        $scope.errors.from = $translate.instant('address_not_found');
      });
    };
    //handle login -- update results
    $scope.$on('LoginController:login', function (event, data) {
      if ($scope.itineraries.length) {
        //reload itineraries
        $scope.planFromResults();
      }
    });
    var _updatePlanWithQuestionResponses = function (question, value) {
      planService.user_profile = planService.user_profile || {};
      planService.user_profile.characteristics = $scope.characteristics;
      planService.user_profile.accommodations = $scope.accommodations;
      $scope.planFromResults();
    };
    $scope.characteristicChange = _updatePlanWithQuestionResponses;
    $scope.accommodationChange = _updatePlanWithQuestionResponses;
    $scope.purposeChange = function (code) {
      code = null;
      if ($scope.tripPurpose) {
        code = $scope.tripPurpose.code;
      }
      planService.setTripPurpose(code);
      $scope.planFromResults();
    };
    var _planTrip = function (callback) {
      if (!planService.from || !planService.to) {
        return;
      }
      $window.visited = true;
      $location.path('/rides').replace();
      planService.prepareConfirmationPage($scope);
      planService.transitResult = [];
      planService.paratransitResult = null;
      planService.postItineraryRequest($http).then(function (response) {
        if (!response.data) {
          bootbox.alert($translate.instant('server_error'));
        }
        var result = response.data;
        var i;
        for (i = 0; i < result.itineraries.length; i += 1) {
          result.itineraries[i].origin = planService.getAddressDescriptionFromLocation(result.itineraries[i].start_location);
          result.itineraries[i].destination = planService.getAddressDescriptionFromLocation(result.itineraries[i].end_location);
          if (result.itineraries[i].returned_mode_code == 'mode_paratransit') {
            planService.paratransitResult = result.itineraries[i];
          } else {
            planService.transitResult.push(result.itineraries[i]);
          }
        }
        planService.searchResults = result;
        if (callback && typeof callback === 'function') {
          callback();
        }
      }).catch(function(e){
        //if status is -1 it's OK -- the XHR was cancelled. otherwise report error
        if(e.status > 0){
          //bootbox.alert( $translate.instant('service_error') );
        }
      });  //formerly _bookTrip();
    };
    $scope.itineraries = planService.transitResult || [];
    //helper for setQuestionsDefaults
    var _getKeyQuestionDefault = function (key, code) {
      //default to true if undefined
      if (!planService.profile[key] || undefined === planService.profile[key][code]) {
        return true;
      }
      return planService.profile[key][code];
    };
    //generator function which sets defaults for accommodations/characteristics which are identical, except for the key name
    var setQuestionsDefaults = function (key) {
      return function (data) {
        var i, code, value;
        for (i = 0; i < data.length; i += 1) {
          if ('boolean' === typeof data[i].value) {
            value = data[i].value;
          } else {
            value = data[i].value == 't';
          }
          $scope[key][data[i].code] = value;
        }
      };
    };
    var initializeScopeVarsFromPlanServiceResults = function () {
      $scope.characteristicsQuestions = planService.characteristicsQuestions || [];
      $scope.accommodationsQuestions = planService.accommodationsQuestions || [];
      $scope.purposes = {};
      $scope.purposesQuestions = planService.purposes || [];
      $scope.itineraryModes = planService.itineraryModes;
      //make sure we have the profile before setting question defaults
      planService.getProfile($http, ipCookie).then(function () {
        if ($scope.characteristicsQuestions.length > 0) {
          setQuestionsDefaults('characteristics')(planService.profile.characteristics || []);
        }
        if ($scope.accommodationsQuestions.length > 0) {
          setQuestionsDefaults('accommodations')(planService.profile.accommodations || []);
        }
      });
    };
    $scope.$on('PlanService:updateItineraryResults', function (event, data) {
      initializeScopeVarsFromPlanServiceResults();
    });
    //initialize rideTime to today, unless there's a fromDate in planService
    if (planService.fromDate > 9000) {
      $scope.rideTime = new Date(planService.fromDate);
    } else {
      $scope.rideTime = new Date();
    }
    $scope.$watch(function () {
      return !$scope.rideTime || $scope.rideTime.getTime();
    }, function (n, o) {
      //only show next if we have a valid moment object
      if (!n || !n instanceof Date) {
        return;
      }
      $scope.showNext = true;
      //save the date/time to planService
      planService.fromDate = n;
      planService.fromTime = n;
      planService.asap = false;
      // refresh the results only if value changed
      if ($scope.refreshResults == true && n !== o) {
        $scope.planFromResults();
      }
    });
    //default the scope and planService fromTimeTypes to 'depart' (if planService doesn't already have a value)
    $scope.fromTimeType = planService.fromTimeType || 'depart';
    planService.fromTimeType = $scope.fromTimeType;
    $scope.$watch('fromTimeType', function (n, o) {
      // refresh the results only if value changed
      if ($scope.refreshResults == true && n !== o) {
        planService.fromTimeType = n;
        $scope.planFromResults();
      }
    });
    eightAm.setSeconds(0);
    eightAm.setMinutes(0);
    eightAm.setHours(8);
    eightAm.setDate(eightAm.getDate() - 1);
    $scope.toFromMarkers = {};
    $scope.toFromIcons = {
      'to': '//maps.google.com/mapfiles/markerB.png',
      'from': '//maps.google.com/mapfiles/marker_greenA.png'
    };
    $scope.locations = [];
    $scope.placeIds = [];
    $scope.showConfirmLocationMap = false;
    $scope.whereToMap = null;
    $scope.mapOptions = {
      zoom: 11,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    //disable some map options if mobile user
    if (util.isMobile()) {
      $scope.mapOptions.scrollwheel = false;
      $scope.mapOptions.zoomControl = false;
      $scope.mapOptions.navigationControl = false;
      $scope.mapOptions.mapTypeControl = false;
      $scope.mapOptions.scaleControl = false;
      $scope.mapOptions.draggable = false;
    }
    $scope.showNext = true;
    $scope.showEmail = false;
    $scope.invalidEmail = false;
    $scope.planService = planService;
    $scope.errors = {};
    $scope.loggedIn = !!planService.email;
    $scope.toDefault = countryFilter(localStorage.getItem('last_destination') || '');
    $scope.to = countryFilter(planService.to || '');
    $scope.fromDefault = countryFilter(localStorage.getItem('last_origin') || '');
    $scope.from = countryFilter(planService.from || '');
    //plan/confirm bus options selected-tab placeholder
    $scope.selectedBusOption = planService.selectedBusOption || [
      0,
      0
    ];
    $scope.dateOptions = {
      formatYear: 'yy',
      startingDay: 0,
      showWeeks: false,
      showButtonBar: false
    };
    function _bookTrip(success) {
      planService.prepareConfirmationPage($scope);
      planService.transitResult = [];
      planService.paratransitResult = null;
      planService.postItineraryRequest($http).then(function (response) {
        success(response.data);
      }).catch(function (e) {
        //if status is -1 it's OK -- the XHR was cancelled. otherwise report error
        if (e.status > 0) {
          //bootbox.alert($translate.instant('service_error'));
        }
      });
    }
    $scope.specifyTripPurpose = function (purpose) {
      planService.purpose = purpose;
      _bookTrip();
    };
    $scope.specifyFromTimeType = function (type) {
      $scope.fromTimeType = type;
      if (type == 'asap') {
        $scope.fromTime = new Date();
        $scope.fromTime.setMinutes($scope.fromTime.getMinutes() + 10);
        $scope.next();
      }
    };
    $scope.specifyReturnTimeType = function (type) {
      $scope.returnTimeType = type;
      planService.returnTimeType = type;
    };
    $scope.clearFrom = function () {
      $scope.showNext = false;
      $scope.from = null;
    };
    $scope.clearTo = function () {
      $scope.showNext = false;
      $scope.to = null;
    };
    $scope.getFromLocations = function (typed) {
      planService.from = '';
      $scope.getLocations(typed, false);
    };
    $scope.getToLocations = function (typed) {
      planService.to = '';
      $scope.getLocations(typed, false);
    };
    $scope.getLocations = function (typed, addCurrentLocation) {
      if (typed) {
        var config = planService.getHeaders();
        $scope.suggestions = LocationSearch.getLocations(typed, config, planService.email != null);
        $scope.suggestions.then(function (data) {
          $scope.placeLabels = [];
          $scope.placeIds = [];
          $scope.placeAddresses = [];
          $scope.poiData = [];
          var choices = [];
          if (addCurrentLocation && util.isMobile()) {
            choices.push({
              label: currentLocationLabel,
              option: true
            });
          }
          var savedPlaceData = data[1].savedplaces;
          if (savedPlaceData && savedPlaceData.length > 0) {
            choices.push({
              label: 'Saved Places',
              option: false
            });
            angular.forEach(savedPlaceData, function (savedPlace, index) {
              choices.push({
                label: savedPlace,
                option: true
              });
            }, choices);
            $scope.placeLabels = $scope.placeLabels.concat(savedPlaceData);
            $scope.placeIds = $scope.placeIds.concat(data[1].placeIds);
            $scope.poiData = data[1].poiData;
            $scope.placeAddresses = $scope.placeAddresses.concat(data[1].savedplaceaddresses);
          }
          if (data.length > 2) {
            var recentSearchData = data[2].recentsearches;
            if (recentSearchData && recentSearchData.length > 0) {
              choices.push({
                label: 'Recently Searched',
                option: false
              });
              angular.forEach(recentSearchData, function (recentSearch, index) {
                choices.push({
                  label: recentSearch,
                  option: true
                });
              }, choices);
              $scope.placeLabels = $scope.placeLabels.concat(recentSearchData);
              $scope.placeIds = $scope.placeIds.concat(data[2].placeIds);
              $scope.placeAddresses = $scope.placeAddresses.concat(recentSearchData);
            }
          }
          var googlePlaceData = data[0].googleplaces;
          if (googlePlaceData.length > 0) {
            choices.push({
              label: 'Suggestions',
              option: false
            });
            angular.forEach(googlePlaceData, function (googleplace, index) {
              choices.push({
                label: googleplace,
                option: true
              });
            }, choices);
            $scope.placeLabels = $scope.placeLabels.concat(googlePlaceData);
            $scope.placeIds = $scope.placeIds.concat(data[0].placeIds);
            $scope.placeAddresses = $scope.placeAddresses.concat(googlePlaceData);
          }
          $scope.locations = choices;
        });
        return $scope.suggestions;
      }
      return false;
    };
    //begin private scope for keeping track of last input, and mapping when appropriate
    var lastFrom = $scope.from || $scope.fromDefault;
    var lastTo = $scope.to || $scope.toDefault;
    var lastMappedPlaces = {};
    var ignoreBlur = false;
    function mapOnBlur(place, toFrom) {
      var defaulted = false;
      //blur handler runs each time the autocomplete input is blurred via selecting, or just blurring
      //If it was blurred because of a selection, we don't want it to run -- let the selectTo or selectFrom run instead
      //return if no change, return if place is empty, or we're supposed to ignore blur events
      if (place && lastMappedPlaces[toFrom] === place || true === ignoreBlur || place && 6 > place.length) {
        //hide the place marker if place is empty or too short
        if ((!place || 6 > place.length) && $scope.toFromMarkers[toFrom]) {
          $scope.toFromMarkers[toFrom].setMap(null);
        }
        lastMappedPlaces[toFrom] = place;
        ignoreBlur = false;
        return;
      } else if (!place) {
        lastMappedPlaces[toFrom] = place;
        return;
        place = $scope[toFrom + 'Default'];
        defaulted = true;
      } else {
        $scope.showNext = false;
      }
      lastMappedPlaces[toFrom] = place;
      setTimeout(function selectPlace() {
        //if $scope.to or $scope.from is different from place, the autocomplete input's select events are handling
        if (!defaulted && $scope[toFrom] !== place) {
          return;
        }
        //otherwise, run selectPlace
        $scope.selectPlace(place, toFrom);
      });
    }
    $scope.mapFrom = function (place) {
      if (lastFrom != place) {
        lastFrom = place;
        setTimeout(function () {
          mapOnBlur(place, 'from');
        });
      }
    };
    $scope.mapTo = function (place) {
      if (lastTo != place) {
        lastTo = place;
        setTimeout(function () {
          mapOnBlur(place, 'to');
        });
      }
    };
    $scope.focusTo = function (e) {
      lastTo = e.target.value;
    };
    $scope.focusFrom = function (e) {
      lastFrom = e.target.value;
    };
    $scope.selectFrom = function (place) {
      ignoreBlur = true;
      $scope.selectPlace(place, 'from');
    };
    $scope.selectTo = function (place) {
      ignoreBlur = true;
      $scope.selectPlace(place, 'to');
    };
    $scope.selectPlace = function (place, toFrom, loadLocationsIfNeeded, parentPromise) {
      //when a place is selected, update the map
      $scope.poi = null;
      $scope.showNext = false;
      var placeIdPromise = $q.defer();
      $scope.placeLabels = $scope.placeLabels || [];
      if (toFrom == 'from' && util.isMobile()) {
        $scope.placeLabels.push(currentLocationLabel);
      }
      $scope.errors['noResults' + toFrom] = false;
      if ($scope.toFromMarkers[toFrom]) {
        $scope.toFromMarkers[toFrom].setMap(null);
      }
      if (!place) {
        return;
      }
      var selectedIndex = $scope.placeLabels.indexOf(place);
      if (-1 < selectedIndex && $scope.placeLabels[selectedIndex] == currentLocationLabel) {
        //this is a POI result, get the 1Click location name
        $scope.getCurrentLocation(toFrom);
        return true;
      } else if (-1 < selectedIndex && selectedIndex < $scope.poiData.length) {
        //this is a POI result, get the 1Click location name
        $scope.poi = $scope.poiData[selectedIndex];
        $scope.checkServiceArea($scope.poi, $scope.poi.formatted_address, toFrom, false, parentPromise);
        return true;
      } else {
        var placeId = $scope.placeIds[selectedIndex];
        if (placeId) {
          placeIdPromise.resolve({
            placeId: placeId,
            updateResult: false
          });
        } else {
          var labelIndex = $scope.placeLabels.indexOf(place);
          var autocompleteService = new google.maps.places.AutocompleteService();
          var address;
          //if no place has been found, use place as address (manual input)
          if (-1 === labelIndex) {
            address = place;
          } else {
            address = $scope.placeAddresses[labelIndex];
          }
          autocompleteService.getPlacePredictions({
            input: address,
            bounds: new google.maps.LatLngBounds(//                      //PA 7 county region
            //                      new google.maps.LatLng(39.719635, -79.061985),
            //                      new google.maps.LatLng(40.730426, -76.153193)
            //Utah
            new google.maps.LatLng(dist_env.map_bounds.latA, dist_env.map_bounds.lonA), new google.maps.LatLng(dist_env.map_bounds.latB, dist_env.map_bounds.lonB))
          }, function (list, status) {
            if (status == 'ZERO_RESULTS' || list == null) {
              if (loadLocationsIfNeeded) {
                //try again, loading the locations then selecting place
                var locationsPromise = $scope.getLocations(place);
                if (locationsPromise !== false) {
                  locationsPromise.then(function () {
                    $scope.selectPlace(place, toFrom, false, parentPromise);
                  });
                  //exit before errors, new selectPlace will handle things
                  return;
                }
              }
              $scope.errors[toFrom] = $translate.instant('address_not_found');
              $scope.errors['noResults' + toFrom] = true;
              parentPromise && parentPromise.reject && parentPromise.reject('No results found');
            } else {
              var placeId = list[0].place_id;
              placeIdPromise.resolve({
                placeId: placeId,
                updateResult: true
              });
            }
          });
        }
        placeIdPromise.promise.then(function (data) {
          var placesService = new google.maps.places.PlacesService($scope.whereToMap);
          placesService.getDetails({ 'placeId': data.placeId }, function (result, status) {
            if (status == google.maps.GeocoderStatus.OK) {
              //verify the location has a street address
              var datatypes = [];
              var route;
              angular.forEach(result.address_components, function (component, index) {
                angular.forEach(component.types, function (type, index) {
                  datatypes.push(type);
                  if (type == 'route') {
                    route = component.long_name;
                  }
                });
              });
              if (datatypes.indexOf('street_number') < 0 || datatypes.indexOf('route') < 0) {
                if (datatypes.indexOf('route') < 0) {
                  $scope.toFromMarkers[toFrom] && $scope.toFromMarkers[toFrom].setMap(null);
                  $scope.errors[toFrom] = $translate.instant('no_street_address');
                  return;
                } else if (datatypes.indexOf('street_number') < 0) {
                  var streetNameIndex = place.indexOf(route);
                  if (streetNameIndex > -1) {
                    var prefix = place.substr(0, streetNameIndex);
                    prefix = prefix.trim();
                    var streetComponent = {};
                    streetComponent.short_name = prefix;
                    streetComponent.long_name = prefix;
                    streetComponent.types = [];
                    streetComponent.types.push('street_number');
                    result.address_components.push(streetComponent);
                  } else {
                    if ($scope.toFromMarkers[toFrom]) {
                      $scope.toFromMarkers[toFrom].setMap(null);
                    }
                    $scope.errors[toFrom] = $translate.instant('no_street_address');
                    return;
                  }
                }
              }
              $scope.checkServiceArea(result, place, toFrom, data.updateResult, parentPromise);
            } else {
              alert('Geocode was not successful for the following reason: ' + status);  //$scope.errors[toFrom] = 'Geocode was not successful for the following reason: ' + status;
            }
          });
        });
      }
      return true;
    };
    $scope.getCurrentLocation = function (toFrom) {
      if (navigator.geolocation) {
        //$scope.startSpin();
        //navigator.geolocation.getCurrentPosition($scope.setOriginLocation(showPosition, 'from'), $scope.showError);
        navigator.geolocation.getCurrentPosition(function (position) {
          var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          var geocoder = new google.maps.Geocoder();
          var placeIdPromise = $q.defer();
          geocoder.geocode({ 'latLng': latlng }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
              if (results[0]) {
                var result = results[0];
                var place = result.formatted_address;
                if (result.place_id) {
                  placeIdPromise.resolve();
                } else {
                }
                placeIdPromise.promise.then($scope.mapAddressByPlaceId(result.place_id, place, toFrom));
              }
            }
          });
        }, $scope.showError);
      } else {
        $scope.error = 'Geolocation is not supported by this browser.';
      }
    };
    $scope.mapAddressByPlaceId = function (placeId, place, toFrom) {
      var placesService = new google.maps.places.PlacesService($scope.whereToMap);
      placesService.getDetails({ 'placeId': placeId }, function (result, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          //verify the location has a street address
          var datatypes = [];
          var route;
          angular.forEach(result.address_components, function (component, index) {
            angular.forEach(component.types, function (type, index) {
              datatypes.push(type);
              if (type == 'route') {
                route = component.long_name;
              }
            });
          });
          if (datatypes.indexOf('street_number') < 0 || datatypes.indexOf('route') < 0) {
            if (datatypes.indexOf('route') < 0) {
              $scope.toFromMarkers[toFrom].setMap(null);
              $scope.errors[toFrom] = $translate.instant('no_street_address');
              //$scope.stopSpin();
              return;
            } else if (datatypes.indexOf('street_number') < 0) {
              var streetNameIndex = place.indexOf(route);
              if (streetNameIndex > -1) {
                var prefix = place.substr(0, streetNameIndex);
                prefix = prefix.trim();
                var streetComponent = {};
                streetComponent.short_name = prefix;
                streetComponent.long_name = prefix;
                streetComponent.types = [];
                streetComponent.types.push('street_number');
                result.address_components.push(streetComponent);
              } else {
                $scope.toFromMarkers[toFrom].setMap(null);
                $scope.errors[toFrom] = $translate.instant('no_street_address');
                //$scope.stopSpin();
                return;
              }
            }
          }
          $scope.checkServiceArea(result, place, toFrom, true);
        } else {
          bootbox.alert('Geocode was not successful for the following reason: ' + status);  //$scope.stopSpin();
        }
      });
    };
    $scope.checkServiceArea = function (result, place, toFrom, updateResult, parentPromise) {
      var serviceAreaPromise = planService.checkServiceArea($http, result);
      $scope.showNext = false;
      serviceAreaPromise.then(function (response) {
        if (!response.data) {
          bootbox.alert($translate.instant('server_error'));
          return;
        }
        var serviceAreaResult = response.data;
        if (serviceAreaResult.result == true) {
          $scope.errors['rangeError' + toFrom] = false;
          var recentSearches = localStorageService.get('recentSearches');
          if (!recentSearches) {
            recentSearches = {};
          }
          if (typeof recentSearches[place] == 'undefined') {
            recentSearches[place] = result;
            localStorageService.set('recentSearches', JSON.stringify(recentSearches));
          }
          var map = $scope.whereToMap;
          if ($scope.toFromMarkers[toFrom]) {
            $scope.toFromMarkers[toFrom].setMap(null);
          }
          $scope.showNext = true;
          var filteredAddress = countryFilter('' + result.name + ' ' + result.vicinity);
          $scope.errors[toFrom] = '';
          if (toFrom == 'from') {
            planService.fromDetails = result;
            if (updateResult) {
              $scope.from = filteredAddress;
              planService.from = '' + $scope.from;
            } else {
              planService.from = '' + place;
            }
            lastFrom = $scope.from;
          } else if (toFrom == 'to') {
            planService.toDetails = result;
            if (updateResult) {
              $scope.to = filteredAddress;
              planService.to = '' + $scope.to;
            } else {
              planService.to = '' + place;
            }
            lastTo = $scope.to;
          }
          //do the google things after a timeout
          setTimeout(function () {
            google.maps.event.trigger(map, 'resize');
            var location = result.geometry.location;
            //$.extend(true, [], result.geometry.location); //new google.maps.LatLng(result.geometry.location.lat, result.geometry.location.lng);
            if ($scope.poi) {
              var poilocation = $scope.poi.geometry.location;
              location = new google.maps.LatLng(Number(poilocation.lat), Number(poilocation.lng));
            }
            if (typeof location.lat == 'number') {
              location = new google.maps.LatLng(Number(location.lat), Number(location.lng));
            }
            $scope.toFromMarkers[toFrom] = new google.maps.Marker({
              map: map,
              position: location,
              animation: google.maps.Animation.DROP,
              icon: $scope.toFromIcons[toFrom]
            });
            var bounds = new google.maps.LatLngBounds();
            angular.forEach($scope.toFromMarkers, function (marker, k) {
              bounds.extend(marker.position);
            });
            map.setCenter(bounds.getCenter());
            map.fitBounds(bounds);
            var markerCount = $scope.toFromMarkers;
            if (Object.keys($scope.toFromMarkers).length === 1) {
              map.setZoom(15);
            }
            //refresh results
            if ($scope.refreshResults == true) {
              $scope.planFromResults();
            }
          }, 1);
        } else {
          $scope.showNext = false;
          if ($scope.toFromMarkers[toFrom]) {
            $scope.toFromMarkers[toFrom].setMap(null);
          }
          $scope.errors['rangeError' + toFrom] = true;
          $scope.errors[toFrom] = $translate.instant('outside_service_area');  //$scope.stopSpin();
        }  //$scope.stopSpin();
      });
      if (parentPromise) {
        //finally fulfil parent promise
        serviceAreaPromise.then(parentPromise.resolve).catch(parentPromise.reject);
      }
    };
    $scope.showError = function (error) {
      switch (error.code) {
      case error.PERMISSION_DENIED:
        $scope.error = 'User denied the request for Geolocation.';
        break;
      case error.POSITION_UNAVAILABLE:
        $scope.error = 'Location information is unavailable.';
        break;
      case error.TIMEOUT:
        $scope.error = 'The request to get user location timed out.';
        break;
      case error.UNKNOWN_ERROR:
        $scope.error = 'An unknown error occurred.';
        break;
      }
      $scope.$apply();  //$scope.stopSpin();
    };
    //copy the util.isMobile function into scope
    $scope.isMobile = util.isMobile;
  }
]);