'use strict';
angular.module('oneClickApp').controller('MainController', [
  '$scope',
  function ($scope) {
    $scope.foo = false;
    $( document ).ready(function() {
      $('.carousel').carousel();
    });
    
  }
]);