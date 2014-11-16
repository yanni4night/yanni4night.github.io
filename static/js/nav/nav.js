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

"use strict";

require('../plugins/autoslider');

var navModule = angular.module('navModule', []);

navModule.controller('navController', ['$rootScope', '$scope', '$timeout', 'notesList',
    function($rootScope, $scope, $timeout, notesList) {

        $scope.notes = [];

        var setNewCurrentNote = function(note) {
            $rootScope.$broadcast('currentNoteChanged', note);
        };

        $scope.$on('ngRepeatFinished', function() {
            $('nav').autoSlider({
                onSelect: function(idx) {
                    $timeout(function() {
                        setNewCurrentNote($scope.notes[idx]);
                    }, 0);
                }
            });
        });

        notesList.getNotesList(function(list) {
            $scope.notes = list;
            if (list.length) {
                setNewCurrentNote(list[0]);
            }

        });

    }
]).service('notesList', ['$http',
    function($http) {

        var cache;

        this.getNotesList = function(cb) {
            if (cache) {
                return cb(cache);
            }

            $http.get('notes.json').success(function(list) {
                cb(cache = list);
            });
        };

    }
]).directive('notesListCompleted', ['$timeout',
    function($timeout) {
        return {
            restrict: 'A',
            link: function($scope) {
                if ($scope.$last === true) {
                    $timeout(function() {
                        $scope.$emit('ngRepeatFinished');
                    });
                }
            }
        };
    }
]);