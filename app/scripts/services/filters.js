'use strict';


angular.module('oneClickApp')
.filter('free', function() {
  return function(input) {
    input = input || '$0.00';
    return input == '$0.00' ? "Free" : input;
  };
})
.filter('minutes', function() {
  return function(m) {
    m = m || 0;
    if(m <= 60){
      return '' + m + ' minutes';
    }else{
      return '' 
        + (Math.floor( m/60 )) + ' hours, '
        + (m % 60) + ' minutes';
    }
    if(!m || !m._isAMomentObject){ return ''; }
    return m.format('YY-MM-DD');
  };
})
.filter('seconds', function() {
  return function(s) {
    s = s || 0;
    var m = Math.ceil( s/60 );
    if(m <= 60){
      return '' + m + ' Minutes';
    }else{
      return '' 
        + (Math.floor( m/60 )) + ' Hour, '
        + (m % 60) + ' Minutes';
    }
    if(!m || !m._isAMomentObject){ return ''; }
    return m.format('YY-MM-DD');
  };
}).filter('distance', [function(){
  //return human readable distance when provided feet
  return function(meters){
    var feet = meters * 3.28084;
    if(feet < (5280 / 4)) {
      return Math.round(feet) + ' feet';
    }else{
      //round to tenth of a mile
      //5280 ft per mile
      return '' + Math.round( (feet/5280) * 100 )/ 100 + ' miles';
    }
  };
}]).filter('momentYMD', function() {
  return function(m) {
    if(!m || !m._isAMomentObject){ return ''; }
    return m.format('YY-MM-DD');
  };
})
.filter('noCountry', function() {
  return function(addressString) {
    //filters ", USA" or ", United States" from the end$ of strings. comma optional
    var country = /(, )?(United States|USA)$/;
    return (addressString || '').replace(country, '').trim();
  };
})
.filter('toDate', function() {
  return function(dateString) {
    //filters ", USA" or ", United States" from the end$ of strings. comma optional
    if(!dateString){ return '';}
    return new Date(dateString);
  };
})
.filter('telephoneLink', function(){
  return function(tel){
    //strip all non-numeric chars
    if(!tel){return '';}
    tel = tel.toString().trim().replace(/\D/g, '');
    //prepend 1 if not there
    if(tel.charAt(0) !== 1){
      tel = '1'+tel;
    }
    return 'tel:+' + tel;
  }
})
.filter('roundUp', function() {
  var roundUpModes = ['mode_ride_hailing', 'mode_taxi'];
  return function(up, mode){
    //parse as float then round up, only if mode in roundUpModes
    if(roundUpModes.indexOf(mode) > -1){
      return ''+ Math.ceil( parseFloat( up || 0) )
    }
    return up;
    
  }
})
.filter('momentFormat', function() {
  return function(m, f) {
    if(!m || !m._isAMomentObject){ return ''; }
    return m.format( f );
  };
})
.filter('modeIcon', function(){
  var icons = {
    'mode_ride_hailing' : 'auto.png',
    'mode_car' : 'auto.png',
    'mode_paratransit':'paratransit.png',
    'mode_taxi':'taxi.png',
    'mode_transit':'transit.png',
    'mode_walk':'walk.png',
    'mode_rail':'rail.png',
    'mode_bicycle':'bicycle.png',
    'WALK':'walk.png',
    'BUS':'transit.png',
    'TRAM':'streetcar.png',
    'BICYCLE':'bicycle.png',
    'CAR':'auto.png'
  };
  return function(mode, iconURL){
    if(iconURL){
      return iconURL;
    }
    iconURL = '/images/modes/';
    iconURL += icons[mode] || '';
    return iconURL;
  }
})
.filter('modeName', function(){
  var modes = {
    'mode_ride_hailing' : 'Rideshare',
    'mode_car' : 'Drive',
    'mode_paratransit':'Paratransit',
    'mode_taxi':'Taxi',
    'mode_transit':'Transit',
    'mode_walk':'Walk',
    'mode_rail':'Rail',
    'mode_bicycle':'Bicycle'
  };
  var translatedModes = {
    'mode_ride_hailing' : 'mode_ride_hailing_name',
    'mode_car' : 'mode_car_name',
    'mode_paratransit':'mode_paratransit_name',
    'mode_taxi':'mode_taxi_name',
    'mode_transit':'mode_transit_name',
    'mode_walk':'mode_walk_name',
    'mode_rail':'mode_rail_name',
    'mode_bicycle':'mode_bicycle_name'
  }
  return function(mode, service_name){
    return (service_name || translatedModes[mode]) || '';
  }
})
.filter('encodeURI', function() {
    return window.encodeURIComponent;
})
.filter('momentHMA', function() {
  return function(m) {
    if(!m || !m._isAMomentObject){ return ''; }
    return m.format('h:mm a');
  };
});
