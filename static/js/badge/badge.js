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
    $scope.user = 'pantojs';
    $scope.project = 'panto-transformer';

    $scope.appveyorKey = 'bsu9w9ar8pboc2nj';
    $scope.codeshipUUID = '79da7240-5481-0132-ea32-42ab35009c21';
    $scope.codeshipId = '49203';

    $scope.badges = {
        npmVersion: true,
        npmDownload: true,
        travis: true,
        appveyor: false,
        dependency: true,
        devDependency: true,
        coveralls: false,
        withGrunt: false,
        codeship: false,
        bowerVersion: false,
        pipVersion:false
    };

    $scope.onSubmit = function(e) {
        e.preventDefault();
    };
}]);