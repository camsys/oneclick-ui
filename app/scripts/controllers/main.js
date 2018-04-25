'use strict';
angular.module('oneClickApp').controller('MainController', [
  '$scope',
  function ($scope) {
    $scope.foo = false;

    $scope.initCarousel = function () {
		$('.carousel').carousel();
	}

    $( document ).ready(function() {
      $('.carousel').carousel();
    });

  }
]);