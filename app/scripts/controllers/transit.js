'use strict';

angular.module('oneClickApp')
  .controller('TransitController', ['$scope','$routeParams', '$location', 'flash', 'planService', '$http','ipCookie', '$attrs',
    function ($scope, $routeParams, $location, flash, planService, $http, ipCookie, $attrs) {

      if($routeParams.departid && $attrs.segmentid > -1){
        $scope.segmentid = $attrs.segmentid;
        $scope.tripid = ($scope.segmentid == 0) 
          ? $routeParams.departid
          : $routeParams.returnid; //$scope.$parent.transitInfos[$attrs.segmentid][0].id;
        $scope.embedded = true;
      }else{
        $scope.segmentid = $routeParams.segmentid;
        $scope.tripid = $routeParams.tripid;
      }
      $scope.location = $location.path();
      $scope.fare_info = planService.fare_info;
      $scope.disableNext = true;
      $scope.showDiv = {};
      $scope.showEmail = false;
      $scope.transitSaved = planService.transitSaved || false;
      $scope.transitCancelled = planService.transitCancelled || false;
      $scope.walkSaved = planService.walkSaved || false;
      $scope.walkCancelled = planService.walkCancelled || false;
      $scope.loggedIn = !!planService.email;
      $scope.showSteps = {};
      $scope.routeMap = null;
      $scope.mapOptions = {
        zoom: 11,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      $scope.viewport;
      $scope.mapElements = [];
      
      function getLegBox(leg, box){
        box = box || {minLat:null, minLon:null, maxLat:null, maxLon:null};
        if(box.minLat == null || box.minLat > leg.from.lat){
          box.minLat = leg.from.lat;
        }
        if(box.maxLat == null || box.maxLat < leg.from.lat){
          box.maxLat = leg.from.lat;
        }
        if(box.minLon == null || box.minLon > leg.from.lat){
          box.minLon = leg.from.lon;
        }
        if(box.maxLon == null || box.maxLon < leg.from.lon){
          box.maxLon = leg.from.lon;
        }
        if(box.minLat == null || box.minLat > leg.to.lat){
          box.minLat = leg.to.lat;
        }
        if(box.maxLat == null || box.maxLat < leg.to.lat){
          box.maxLat = leg.to.lat;
        }
        if(box.minLon == null || box.minLon > leg.to.lon){
          box.minLon = leg.to.lon;
        }
        if(box.maxLon == null || box.maxLon < leg.to.lon){
          box.maxLon = leg.to.lon;
        }
        return box;
      }
      $scope.generateLeg = function(leg, index, selected, legLines){

        var palette = 'secondary';

        if(selected){
          palette = 'primary';
        }

        var routeColors = {
          'primary' : {'walk':'hsl(198, 100%, 50%)', 'bus':'hsl(198, 100%, 50%)',
            'bike':'hsl(198, 100%, 50%)', 'car':'hsl(198, 100%, 50%)' },
          'secondary' : {'walk':'hsla(198, 0%, 50%, .7)', 'bus':'hsla(198, 0%, 50%, .7)',
            'bike':'hsla(198, 0%, 50%, .7)', 'car':'hsla(33, 0%, 50%, .7)' }
        };

        legLines.push({
          geometry: leg.legGeometry.points,
          mode: leg.mode,
          walkColor: routeColors[palette].walk,
          busColor: routeColors[palette].bus,
          bikeColor: routeColors[palette].bike,
          carColor: routeColors[palette].car
        });

        //Secondary itineraries don't need the markers below (start, end, bus numbers)
        if(!selected){
          return;
        }

        //show the START marker if this is the first leg. Otherwise show a simple circle (transfer) marker
        var marker;
        if(index == 0){
          marker = new google.maps.Marker({
            position: new google.maps.LatLng(leg.from.lat, leg.from.lon),
            map: $scope.routeMap,
            icon: "http://maps.google.com/mapfiles/marker_greenA.png"
          });
        }else{
          marker = new google.maps.Marker({
            position: new google.maps.LatLng(leg.from.lat, leg.from.lon),
            map: $scope.routeMap,
            title: leg.mode,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 4,
              strokeWeight: 2,
              fillOpacity: 1,
              fillColor: 'white',
              strokeColor: 'black'
            },
          });
        }
        //push the marker on our stack of elements to be rendered
        $scope.mapElements.push(marker);

        //For non-walking legs, show the transit icon and a route number in an InfoBox attached to the marker
        if(leg.mode != 'WALK'){
          var imageUrl = null;
          if(leg.mode == 'BUS'){
            imageUrl = 'images/modes/transit.png';
            legLines[legLines.length-1].busColor = '#'+leg.routeColor;
          }else if(leg.mode == 'TRAM' || leg.mode == 'RAIL'){
            imageUrl = 'images/modes/streetcar.png';
            legLines[legLines.length-1].busColor = '#'+leg.routeColor;
          }else if(leg.mode == 'BICYCLE'){
            imageUrl = 'images/modes/bicycle.png';
          }else if(leg.mode == 'CAR'){
            imageUrl = 'images/modes/auto.png';
          }else{
            alert("found unhandled mode " + leg.mode);
            return;
          }

          var boxText = document.createElement("div");
          boxText.setAttribute("id", "infobox-" + index);
          boxText.style.cssText = "border: 1px solid #81807D; background: white; white-space: nowrap;";
          var routeColor = leg.routeColor ? "#" + leg.routeColor : "white";
          var routeTextColor = leg.routeTextColor ? "#" + leg.routeTextColor : "white";
          var routeShortName = leg.routeShortName ? leg.routeShortName : "";
          boxText.innerHTML =
              '<img src="' + imageUrl + '" style="width: 16px; height: 16px;"/>'+
              '<span style="margin: 0px 1px 0px 2px; position: relative; padding: 0px 4px; color: rgb(255, 255, 255); background-color: ' + routeColor + '; color: ' + routeTextColor + '">' + routeShortName + '</span>'+
              '<img src="http://maps.gstatic.com/mapfiles/tiph.png" draggable="false" style="-webkit-user-select: none; border: 0px; padding: 0px; margin: 0px; position: absolute; right: -7px; top: 17px; width: 15px; height: 9px;"/>';

          var pixelOffset = new google.maps.Size(-50, -25);
          if(leg.mode == 'BICYCLE' || leg.mode == 'CAR')
            pixelOffset = new google.maps.Size(-35, -25);
          var myOptions = {
            pixelOffset: pixelOffset,
            content: boxText
            ,boxStyle: {
              background: "white"
            }
            ,closeBoxURL: ""
          };
          var ib = new InfoBox(myOptions);
          ib.open($scope.routeMap, marker);
          $scope.mapElements.push(ib);
        }

        //attach the END marker if this is the last leg
        /*
        var selectedItinerary = $scope.isWizard ? $scope.wizardSelectedItinerary : $scope.selectedItinerary;
        if(index == selectedItinerary.json_legs.length - 1){
          var map = $scope.isWizard ? $scope.wizardRouteMap : $scope.routeMap;
          marker = new google.maps.Marker({
            position: new google.maps.LatLng(leg.to.lat, leg.to.lon),
            map: map,
            icon: 'http://maps.google.com/mapfiles/markerB.png'
          });
          $scope.mapElements.push(marker);
        }
        */
      }
      $scope.renderRouteOnMap = function(){
        var legLines = [];
        //generate the selected itinerary lines using the primary color palette
        angular.forEach($scope.itinerary.json_legs, function(leg, index){
          $scope.generateLeg(leg, index, true, legLines);
          $scope.viewport = getLegBox(leg, $scope.viewport);
        });
        var bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng($scope.viewport.maxLat, $scope.viewport.minLon),
            new google.maps.LatLng($scope.viewport.minLat, $scope.viewport.maxLon)
        );
        $scope.routeMap.fitBounds(bounds);

        $scope.renderLegLines(legLines);
      }
      $scope.renderLegLines = function(legLines){
        var lineSymbol = {
          path: google.maps.SymbolPath.CIRCLE,
          fillOpacity: 1,
          scale: 3
        };

        angular.forEach(legLines, function(legLine, index) {
          var coordinates = google.maps.geometry.encoding.decodePath(legLine.geometry);
          var poly;
          if(legLine.mode.toLowerCase() == 'walk'){
            poly = new google.maps.Polyline({
              strokeColor: legLine.walkColor,
              strokeOpacity: 0,
              fillOpacity: 0,
              icons: [{
                icon: lineSymbol,
                offset: '0',
                repeat: '10px'
              }],
              map: $scope.routeMap
            });
          } else if(legLine.mode.toLowerCase() == 'bicycle'){
            poly = new google.maps.Polyline({
              strokeColor: legLine.bikeColor,
              strokeOpacity: 1,
              strokeWeight: 5,
              map: $scope.routeMap
            });
          } else if(legLine.mode.toLowerCase() == 'car') {
            poly = new google.maps.Polyline({
              strokeColor: legLine.carColor,
              strokeOpacity: 1,
              strokeWeight: 5,
              map: $scope.routeMap
            });
          }else{
            poly = new google.maps.Polyline({
              strokeColor: legLine.busColor,
              strokeOpacity: 1,
              strokeWeight: 5,
              map: $scope.routeMap
            });
          }
          angular.forEach(coordinates, function(coordinate, index) {
            poly.getPath().push(coordinate);
          });
          $scope.mapElements.push(poly);
        });
      }
      $scope.toFromIcons={'to' : '//maps.google.com/mapfiles/markerB.png',
                      'from' : '//maps.google.com/mapfiles/marker_greenA.png' };
      var start_location, end_location;
      var bounds = new google.maps.LatLngBounds();
      var rebuildMap = function()
      {
        google.maps.event.trigger($scope.routeMap, 'resize');
        var origin = $scope.itinerary.start_location || $scope.itinerary.origin;
        var destination = $scope.itinerary.end_location || $scope.itinerary.destination;
        if(!start_location){
          start_location = new google.maps.Marker({
            map: $scope.routeMap,
            position: origin.geometry.location,
            icon: $scope.toFromIcons.from
          });
          end_location = new google.maps.Marker({
            map: $scope.routeMap,
            position: destination.geometry.location,
            icon: $scope.toFromIcons.to
          });
          bounds.extend(start_location.position);
          bounds.extend(end_location.position);
          $scope.renderRouteOnMap();
        }
        $scope.routeMap.setCenter(bounds.getCenter());
        $scope.routeMap.fitBounds(bounds);
        google.maps.event.trigger($scope.routeMap, 'resize');
      }

      var watchVar = $scope.trip || $scope.itinerary;
      $scope.$watch(function(){
        return watchVar.showMoreDetails;
      }, function(n,o){
        //if new value is true rebuild the map
        if(true === n){
          setTimeout(rebuildMap);
        }
      });

      $scope.toggleEmail = function() {
        $scope.invalidEmail = false;
        $scope.showEmail = !$scope.showEmail;
      };


      $scope.sendEmail = function() {
        if($scope.emailString){
          var result = planService.validateEmail($scope.emailString);
          if(result == true){

            $scope.showEmail = false;
            var addresses = $scope.emailString.split(/[ ,;]+/);
            var emailRequest = {};
            emailRequest.email_itineraries = [];
            angular.forEach(addresses, function(address, index) {
              var emailRequestPart = {};
              emailRequestPart.email_address = address;
              emailRequestPart.itineraries = [];
              var ids = [];
              ids.push(planService.outboundTripId);
              if(planService.returnTripId){
                ids.push(planService.returnTripId);
              }
              angular.forEach(ids, function(id, index) {
                emailRequestPart.itineraries.push({"trip_id":planService.searchResults.trip_id,"itinerary_id":id})
              });
              emailRequest.email_itineraries.push(emailRequestPart)
            });
            var emailPromise = planService.emailItineraries($http, emailRequest);
            emailPromise.error(function(data) {
              bootbox.alert("An error occurred on the server, your email was not sent.");
            });
            flash.setMessage('Your email was sent');
          }else{
            $scope.invalidEmail = true;
          }
        }
      };

      $scope.prepareTrip = function(){
        angular.forEach(planService.searchResults.itineraries, function(itinerary, index) {
          if(itinerary.id == $scope.tripid){
            $scope.transitInfos = planService.transitInfos[$scope.segmentid];
            var priorMode = '';
            var priorEndTime;
            angular.forEach(itinerary.json_legs, function(leg, index) {
              /*if(leg.mode = priorMode && priorMode == 'BUS'){
                var waitTime = leg.startTime - priorEndTime;
                waitTime = humanizeDuration(waitTime * 1000,  { units: ["hours", "minutes"], round: true });
                console.log(waitTime);
              }
              priorMode = leg.mode;
              priorEndTime = leg.endTime;*/
            });
            $scope.itinerary = itinerary;
            $scope.tripid = itinerary.id;
          }
        });
        $scope.roundtrip = planService.fare_info.roundtrip;
      }
/*
      if($location.$$path.indexOf('/transitoptions') > -1) {
        $scope.transitInfos = planService.transitInfos[$scope.segmentid];
        if(planService.fare_info.roundtrip == true){
          if ($scope.segmentid == "0") {
            $scope.message = 'Outbound Bus Options';
          } else {
            $scope.message = 'Return Bus Options';
          }
        }else{
          $scope.message = 'Bus Options';
        }
      }else if($location.$$path.indexOf('/transitconfirm') > -1){
        angular.forEach(planService.searchResults.itineraries, function(itinerary, index) {
          if(itinerary.id == planService.outboundTripId){
            $scope.outboundTrip = itinerary;
          }
          if(itinerary.id == planService.returnTripId){
            $scope.returnTrip = itinerary;
          }
        });
        $scope.itineraries = [];
        $scope.itineraries.push($scope.outboundTrip);
        if($scope.returnTrip != null){
          $scope.itineraries.push($scope.returnTrip);
        }
        $scope.purpose = planService.itineraryRequestObject.trip_purpose;
      }else{
        $scope.prepareTrip();
      }
*/

      $scope.selectTransitTrip = function(tripid, segmentid){
        planService.selectedTripId = tripid;
        if(planService.fare_info.roundtrip == true){
          if(segmentid == "0"){
            planService.outboundTripId = tripid;
            $location.path("/transitoptions/1");
            return;
          }else{
            planService.returnTripId = tripid;
          }
        }else{
          planService.outboundTripId = tripid;
        }
        $scope.saveTransitItinerary()
      }

      $scope.saveToMyRides = function(){
        var itineraries = {}
        var selectItineraries = [];
        
        var tripId = planService.tripId;
        var outboundItineraryId = $routeParams.departid;
        var returnItineraryId = $routeParams.returnid;

        if(outboundItineraryId > 0)
          selectItineraries.push({"trip_id":tripId, "itinerary_id":outboundItineraryId});
        if(returnItineraryId > 0)
          selectItineraries.push({"trip_id":tripId, "itinerary_id":returnItineraryId});

        itineraries.select_itineraries = selectItineraries;

        if(outboundItineraryId < 1 && returnItineraryId < 1){
          bootbox.alert("An error occurred and we were unable to save this trip to your list of rides.  Please try your search again.");
        }
        else {
          var promise = planService.selectItineraries($http, itineraries);
          promise.then(function(result) {
            ipCookie('rideCount', ipCookie('rideCount') + 1);
            $scope.rideCount = ipCookie('rideCount');
            $location.path("/transitconfirm");
          });
        }
      }

      $scope.saveTransitItinerary = function(){
        var tripId = planService.tripId;
        planService.outboundTripId
        var selectedItineraries = [];

        selectedItineraries.push({"trip_id":tripId, "itinerary_id":planService.outboundTripId});
        if(planService.fare_info.roundtrip == true){
          selectedItineraries.push({"trip_id":tripId, "itinerary_id":planService.returnTripId});
        }
        var selectedItineraries = {"select_itineraries": selectedItineraries};
        var promise = planService.selectItineraries($http, selectedItineraries);
        promise.then(function(result) {
          ipCookie('rideCount', ipCookie('rideCount') + 1);
          $scope.rideCount = ipCookie('rideCount');
          $location.path("/transitconfirm");
        });
      }

      $scope.viewTransitTrip = function(tripid, segmentid){
        $location.path("/transit/" + segmentid + "/" + tripid);
      }

      $scope.show = function(event){
        var index = $(event.target).parents('.timeline').attr('index');
        $scope.showDiv[index] = !$scope.showDiv[index];
      }

    }
  ]);
