'use strict';
angular.module('oneClickApp').filter('free', function (translateFilter) {
  return function (input) {
    input = input || '$0.00';
    return input == '$0.00' ? translateFilter('free') : input;
  };
}).filter('minutes', function (translateFilter) {
  return function (m) {
    m = m || 0;
    var hours, minutes, translation;
    if (m <= 60) {
      return '' + m + ' ' + translateFilter('minutes');
    } else {
      hours = Math.floor(m / 60);
      minutes = m % 60;
      translation = hours == 1 ? translateFilter('hour_long.one', { count: hours }) : translateFilter('hour_long.other', { count: hours });
      //if minutes are not 0, add minutes translation
      if (minutes > 0) {
        translation += ' ';
        translation += minutes == 1 ? translateFilter('minute.one', { count: minutes }) : translateFilter('minute.other', { count: minutes });
      }
      return translation;
    }
    if (!m || !m._isAMomentObject) {
      return '';
    }
    return m.format('YY-MM-DD');
  };
}).filter('seconds', function (minutesFilter) {
  return function (s) {
    s = s || 0;
    var m = Math.ceil(s / 60);
    return minutesFilter(m);
  };
}).filter('distance', function (translateFilter) {
  //return human readable distance when provided feet
  return function (meters) {
    var feet = meters * 3.28084;
    if (feet < 5280 / 4) {
      return Math.round(feet) + ' ' + translateFilter('feet');
    } else {
      //round to tenth of a mile
      //5280 ft per mile
      return '' + Math.round(feet / 5280 * 100) / 100 + ' ' + translateFilter('miles');
    }
  };
}).filter('momentYMD', function () {
  return function (m) {
    if (!m || !m._isAMomentObject) {
      return '';
    }
    return m.format('YY-MM-DD');
  };
}).filter('noCountry', function () {
  return function (addressString) {
    //filters ", USA" or ", United States" from the end$ of strings. comma optional
    var country = /(, )?(United States|USA)$/;
    return (addressString || '').replace(country, '').trim();
  };
}).filter('toDate', function () {
  return function (dateString) {
    //filters ", USA" or ", United States" from the end$ of strings. comma optional
    if (!dateString) {
      return '';
    }
    return new Date(dateString);
  };
}).filter('telephoneLink', function () {
  var alphaNumTouchPad = {
    a: 2,
    b: 2,
    c: 2,
    d: 3,
    e: 3,
    f: 3,
    g: 4,
    h: 4,
    i: 4,
    j: 5,
    k: 5,
    l: 5,
    m: 6,
    n: 6,
    o: 6,
    p: 7,
    q: 7,
    r: 7,
    s: 7,
    t: 8,
    u: 8,
    v: 8,
    w: 9,
    x: 9,
    y: 9,
    z: 9
  };
  var decimalRegexp = /\d/;
  var nonDecimalRegexp = /\D/;
  function alphaToNumber(alphaString) {
    //split the alphaString, only use chars that mach /\w/
    var alphaSplit = alphaString.replace(/\W/g, '').split('');
    alphaSplit.map(function (character) {
      //if it's a decimal, just return the character
      if (decimalRegexp.test(character)) {
        return character;
      }
      return alphaNumTouchPad[character.toLowerCase()];
    });
    return alphaSplit.join('');
  }
  return function (tel) {
    //strip all non-numeric chars
    //tel = tel.toString().trim().replace(/\D/g, '');
    //default to empty string, trim
    tel = tel || '';
    tel = tel.toString().trim();
    //return nothing if empty
    if (!tel) {
      return '';
    }
    //if tel has textCharacters, turn those into numbers
    if (nonDecimalRegexp.test(tel)) {
      tel = alphaToNumber(tel);
    }
    //prepend 1 if not there
    if (!/^1/.test(tel)) {
      tel = '1' + tel;
    }
    return 'tel:+' + tel;
  };
}).filter('roundUp', function () {
  var roundUpModes = [
    'mode_ride_hailing',
    'mode_lyft',
    'mode_taxi'
  ];
  return function (up, mode) {
    //parse as float then round up, only if mode in roundUpModes
    if (roundUpModes.indexOf(mode) > -1) {
      return '' + Math.ceil(parseFloat(up || 0));
    }
    return up;
  };
}).filter('momentFormat', function () {
  return function (m, f) {
    if (!m || !m._isAMomentObject) {
      return '';
    }
    return m.format(f);
  };
}).filter('notCancelled', function () {
  return function (itineraries) {
    var count = 0;
    itineraries = itineraries || [];
    itineraries.forEach(function (itinerary) {
      if (!itinerary.cancelled) {
        count += 1;
      }
    });
    return count;
  };
}).filter('codeNote', function () {
  return function (code) {
    return code + '_note';
  };
}).filter('directionIcon', function () {
  var icons = {
    'left': 'fa-arrow-left',
    'right': 'fa-arrow-right',
    'straight': 'fa-arrow-up',
    'continue': 'fa-arrow-up',
    'depart': 'fa-bullseye',
    'destination': 'fa-bullseye',
    'waypoint': 'fa-bullseye'
  };
  return function (direction) {
    direction = direction.toLowerCase();
    return icons[direction] || '';
  };
}).filter('modeIcon', function () {
  var icons = {
    'mode_ride_hailing': 'auto.png',
    'mode_lyft': 'auto.png',
    'mode_car': 'auto.png',
    'mode_paratransit': 'paratransit.png',
    'mode_taxi': 'taxi.png',
    'mode_transit': 'transit.png',
    'mode_walk': 'walk.png',
    'mode_rail': 'rail.png',
    'mode_subway': 'rail.png',
    'mode_bicycle': 'bicycle.png',
    'WALK': 'walk.png',
    'BUS': 'transit.png',
    'TRAM': 'streetcar.png',
    'RAIL': 'rail.png',
    'SUBWAY': 'rail.png',
    'BICYCLE': 'bicycle.png',
    'CAR': 'auto.png'
  };
  return function (mode, iconURL) {
    if (iconURL) {
      return iconURL;
    }
    iconURL = '/images/modes/';
    iconURL += icons[mode] || '';
    return iconURL;
  };
}).filter('modeName', function () {
  /* var modes = {
    'mode_ride_hailing': 'Rideshare',
    'mode_lyft': 'Lyft',
    'mode_car': 'Drive',
    'mode_paratransit': 'Paratransit',
    'mode_taxi': 'Taxi',
    'mode_transit': 'Transit',
    'mode_walk': 'Walk',
    'mode_rail': 'Rail',
    'mode_bicycle': 'Bicycle'
  }; */
  var translatedModes = {
    'mode_ride_hailing': 'mode_ride_hailing_name',
    'mode_lyft': 'mode_lyft_name',
    'mode_car': 'mode_car_name',
    'mode_paratransit': 'mode_paratransit_name',
    'mode_taxi': 'mode_taxi_name',
    'mode_transit': 'mode_transit_name',
    'mode_walk': 'mode_walk_name',
    'mode_rail': 'mode_rail_name',
    'mode_subway': 'mode_subway_name',
    'mode_bicycle': 'mode_bicycle_name'
  };
  return function (mode, service_name) {
    return service_name || translatedModes[mode] || '';
  };
}).filter('encodeURI', function () {
  return window.encodeURIComponent;
}).filter('momentHMA', function () {
  return function (m) {
    if (!m || !m._isAMomentObject) {
      return '';
    }
    return m.format('h:mm a');
  };
}).filter('humanizeDuration', function (translateFilter) {
  return function (duration) {
    var hours = duration.hours();
    var mins = duration.minutes();
    var returnString = '';
    if (hours > 1) {
      returnString += translateFilter('hour_long.other', { count: hours }) + ' ';
    } else if (hours === 1) {
      returnString += translateFilter('hour_long.one', { count: hours }) + ' ';
    }
    if (mins > 0) {
      returnString += translateFilter('minute.other', { count: mins });
    }
    return returnString;
  };
});