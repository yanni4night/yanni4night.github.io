(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

"use strict";
var articleModule = angular.module('articleModule', []);

articleModule.controller('articleController', ['$rootScope','$scope',function($rootScope,$scope) {
    $rootScope.$on('currentNoteChanged',function(e,note){
        $scope.currentNote = note;
    });
}]);
},{}],2:[function(require,module,exports){
/**
 * Copyright (C) 2014 yanni4night.com
 * index.js
 *
 * changelog
 * 2014-11-15[19:54:40]:revised
 *
 * @author yanni4night@gmail.com
 * @version 0.1.0
 * @since 0.1.0
 */

"use strict";
require('./nav/nav');
require('./article/article');

angular.module('githubPageApp', ['navModule', 'articleModule']);
},{"./article/article":1,"./nav/nav":3}],3:[function(require,module,exports){
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
                    });
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
},{"../plugins/autoslider":4}],4:[function(require,module,exports){
/**
 * Copyright (C) 2014 yanni4night.com
 * autoslider.js
 *
 * changelog
 * 2014-11-16[12:00:36]:authorized
 *
 * @author yanni4night@gmail.com
 * @version 0.1.0
 * @since 0.1.0
 */
"use strict";
(function(factory) {
    if (typeof define === "function" && define.amd) {
        define(["jquery"], factory);
    } else {
        factory(jQuery);
    }
}(function($) {
    function AutoSlider($container, options) {

        var opt = this.opt = $.extend(true, {
            slider: 'ul',
            child: 'li',
            onSelect: $.noop
        }, options || {});

        this.scrollStep = 30;

        this.mouseWidth = 300;

        this.maxScrollStep = 30;

        this.onIndex = 0;
        this.$container = $container;
        this.$slider = $container.find(opt.slider);

        this.initialized = false;

        this.init().showIndex();
    }

    AutoSlider.prototype = {
        init: function() {
            var self = this;

            self.update();
            //window resize
            $(window).resize(function() {
                this.showIndex();
            }.bind(this));

            //hover
            this.$container.mousemove(function(e) {
                if (e.pageX < self.mouseWidth || $(this).width() - e.pageX < self.mouseWidth) {
                    self.scroll(e.pageX > self.mouseWidth);
                    if (e.pageX < self.mouseWidth) {
                        self.scrollStep = self.maxScrollStep * ((self.mouseWidth - e.pageX) / self.mouseWidth);
                    } else {
                        self.scrollStep = self.maxScrollStep * ((self.mouseWidth - $(this).width() + e.pageX) / self.mouseWidth);
                    }
                } else {
                    self.scrollStop();
                }
            }).mouseleave(function() {
                this.scrollStop();
            }.bind(this));

            //<-keys->
            var moveInter;
            $(document).keydown(function(e) {
                var destIdx;
                if (37 === e.keyCode) {
                    destIdx = --this.onIndex;
                } else if (39 === e.keyCode) {
                    destIdx = ++this.onIndex;
                } else {
                    return;
                }
                clearTimeout(moveInter);
                moveInter = setTimeout(function() {
                    this.showIndex(destIdx);
                }.bind(this), 50);
            }.bind(this));

            return this;
        },
        update: function() {
            var $children = this.$children = this.$slider.find(this.opt.child);

            if (!$children.length) {
                return this;
            }

            this.itemW = $children.eq(this.onIndex).addClass('on').outerWidth() + parseInt($children.css('margin-left')) + parseInt($children.css('margin-right'));
            this.$slider.width(this.itemW * $children.length);

            this.initialized = true;

            return this;
        },
        calculateIndex: function() {
            var idx = Math.floor((this.$container.width() / 2 - parseInt(this.$slider.css('left'))) / this.itemW);
            this.showIndex(idx);
        },
        scrollStop: function() {
            if (!this.scrolling || !this.initialized) {
                return;
            }
            this.scrollStopInter = setTimeout(function() {
                clearTimeout(this.scrollInter);
                this.scrolling = false;

                clearTimeout(this.calcuInter);
                this.calcuInter = setTimeout(function() {
                    this.calculateIndex();
                }.bind(this), 1e3);
            }.bind(this), 5e2);

        },
        scroll: function(right) {
            if (this.scrolling || !this.initialized) {
                return;
            }
            var sW = this.$container.width();
            var maxX = sW / 2 - (0.5) * this.itemW;
            var minX = sW / 2 - (this.$children.length - 1 + 0.5) * this.itemW;

            this.scrolling = true;

            clearTimeout(this.calcuInter);

            this.scrollInter = setInterval(function() {
                var dest = parseInt(this.$slider.css('left')) + (right ? -1 : 1) * this.scrollStep;
                if (dest < minX) {
                    dest = minX;
                } else if (dest > maxX) {
                    dest = maxX;
                }
                this.$slider.css('left', dest + 'px');
            }.bind(this), 20);

        },
        showIndex: function(idx) {

            if (!this.initialized) {
                return false;
            }

            var sW = this.$container.width();
            if (undefined === idx) {
                idx = this.onIndex;
            } else if (idx < 0) {
                idx = 0;
            } else if (idx > this.$children.length - 1) {
                idx = this.$children.length - 1;
            }

            this.onIndex = idx;

            this.$children.removeClass('on').eq(idx).addClass('on');

            this.opt.onSelect.call(this, idx);

            this.$slider.stop().animate({
                left: sW / 2 - (idx + 0.5) * this.itemW
            });
            return true;
        }
    };

    $.fn.autoSlider = function(options) {
        $.each(this, function(idx, slider) {
            new AutoSlider($(slider), options);
        });
    };
}));
},{}]},{},[2]);
