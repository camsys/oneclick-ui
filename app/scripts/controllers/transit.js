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
          var routeColor = '#' + (leg.routeColor || 'FFF');
          var routeTextColor = '#' + (leg.routeTextColor || '000');
          var routeShortName = leg.routeShortName || '';
          boxText.innerHTML =
              '<img src="' + imageUrl + '" style="width: 16px; height: 16px;"/>'+
              '<span style="margin: 0px 1px 0px 2px; position: relative; padding: 0px 4px; color: rgb(255, 255, 255); background-color: ' + routeColor + '; color: ' + routeTextColor + '">' + routeShortName + '</span>'+
              '<img src="http://maps.gstatic.com/mapfiles/tiph.png" draggable="false" style="-webkit-user-select: none; border: 0px; padding: 0px; margin: 0px; position: absolute; right: -7px; top: 17px; width: 15px; height: 9px;"/>';

          var pixelOffset = new google.maps.Size(-50, -25);
          if(leg.mode == 'BICYCLE' || leg.mode == 'CAR'){
            pixelOffset = new google.maps.Size(-35, -25);
          }
          var myOptions = {
            pixelOffset: pixelOffset,
            content: boxText,
            alignBottom: true,
            boxStyle: { background: 'white' },
            closeBoxURL: ''
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
        var bounds = new google.maps.LatLngBounds();
        var legLines = [];
        //generate the selected itinerary lines using the primary color palette
        angular.forEach($scope.itinerary.json_legs, function(leg, index){
          $scope.generateLeg(leg, index, true, legLines);
          bounds.extend( new google.maps.LatLng(leg.from.lat, leg.from.lon) );
          bounds.extend( new google.maps.LatLng(leg.to.lat, leg.to.lon) );
          angular.forEach(leg.steps, function(step){
            bounds.extend( new google.maps.LatLng(step.lat, step.lon) );
          });
        });
        $scope.routeMap.setCenter( bounds.getCenter() );
        $scope.routeMap.fitBounds( bounds );

        $scope.renderLegLines( legLines );
        return bounds;
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
      var start_location, end_location, bounds;
      var rebuildMap = function()
      {
        google.maps.event.trigger($scope.routeMap, 'resize');
        var origin = $scope.itinerary.start_location || $scope.itinerary.origin;
        var destination = $scope.itinerary.end_location || $scope.itinerary.destination;
        if(!start_location){
          start_location = new google.maps.Marker({
            map: $scope.routeMap,
            position: new google.maps.LatLng(origin.geometry.location.lat, origin.geometry.location.lng),
            icon: $scope.toFromIcons.from
          });
          end_location = new google.maps.Marker({
            map: $scope.routeMap,
            position: new google.maps.LatLng(destination.geometry.location.lat, destination.geometry.location.lng),
            icon: $scope.toFromIcons.to
          });
          bounds = $scope.renderRouteOnMap();
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

    }
  ]);
