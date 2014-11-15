/**
 * Copyright (C) 2014 yanni4night.com
 * navController.js
 *
 * changelog
 * 2014-11-15[20:23:57]:revised
 *
 * @author yanni4night@gmail.com
 * @version 0.1.0
 * @since 0.1.0
 */

var navModule = angular.module('navModule', []);

navModule.controller('navController', ['$rootScope','$scope', 'notesList', function($rootScope,$scope, notesList) {

    $scope.notes = [];

    var setNewCurrentNote = function(note){
        $rootScope.$broadcast('currentNoteChanged',note);
    };

    $scope.$watch('notes',function(){
       // $('.notes-list').css('width',notes.length*);
    });

    notesList.getNotesList(function(list) {
        $scope.notes = list;
        if (list.length) {
           setNewCurrentNote(list[0]);
        }
    });

}]).service('notesList', ['$http', function($http) {

    var cache;

    this.getNotesList = function(cb) {
        if (cache) {
            return cb(cache);
        }

        $http.get('notes.json').success(function(list) {
            cb(cache = list);
        });
    };

}]);