/**
 * Copyright (C) 2014 yanni4night.com
 * article.js
 *
 * changelog
 * 2014-11-15[21:04:27]:revised
 *
 * @author yanni4night@gmail.com
 * @version 0.1.0
 * @since 0.1.0
 */


var articleModule = angular.module('articleModule', []);

articleModule.controller('articleController', ['$rootScope','$scope',function($rootScope,$scope) {

    $rootScope.$on('currentNoteChanged',function(e,note){
        $scope.currentNote = note;
    });
}]);