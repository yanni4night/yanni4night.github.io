(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
  * Copyright (C) 2014 yanni4night.com
  * badge.js
  *
  * changelog
  * 2014-11-22[20:54:16]:revised
  *
  * @author yanni4night@gmail.com
  * @version 0.1.0
  * @since 0.1.0
  */
"use strict";

require('./badge/badge');

angular.module('badgePageApp', ['badgeModule']);
},{"./badge/badge":2}],2:[function(require,module,exports){
/**
 * Copyright (C) 2014 yanni4night.com
 * badge.js
 *
 * changelog
 * 2014-11-22[21:07:11]:revised
 *
 * @author yanni4night@gmail.com
 * @version 0.1.0
 * @since 0.1.0
 */

"use strict";
var badgeModule = angular.module('badgeModule', []);

badgeModule.controller('badgeController', ['$scope', function($scope) {
    $scope.user = 'yanni4night';
    $scope.project = 'django';

    $scope.appveyorKey = 'bsu9w9ar8pboc2nj';
    $scope.codeshipUUID = '79da7240-5481-0132-ea32-42ab35009c21';
    $scope.codeshipId = '49203';

    $scope.badges = {
        npmVersion: true,
        npmDownload: true,
        travis: true,
        appveyor: true,
        dependency: true,
        withGrunt: true,
        codeship: false,
        bowerVersion: false
    };

    $scope.onSubmit = function(e) {
        e.preventDefault();
    };
}]);
},{}]},{},[1]);
