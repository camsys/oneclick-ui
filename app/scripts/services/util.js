'use strict';
angular.module('oneClickApp').service('util', function () {
  this.isMobile = function () {
    return /Mobi/.test(navigator.userAgent);
  };
  this.assignDefaultValueIfEmpty = function (arg, val) {
    return typeof arg !== 'undefined' ? arg : val;
  };
});