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

        var onIndex = this.onIndex = 0;
        this.$container = $container;
        var $slider = this.$slider = $container.find(opt.slider);
        var $children = this.$children = $slider.find(opt.child);

        if (!$children.length) {
            return;
        }

        $slider.data('data-slider', this);

        var itemW = this.itemW = $children.eq(onIndex).addClass('on').outerWidth() + parseInt($children.css('margin-left')) + parseInt($children.css('margin-right'));
        $slider.width(itemW * $children.length);


        this.init().showIndex();
        $slider.mousemove(function() {});
    }

    AutoSlider.prototype = {
        init: function() {
            $(window).resize(function() {
                this.showIndex();
            }.bind(this));

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
        showIndex: function(idx) {
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
                'left': sW / 2 - (idx + 0.5) * this.itemW
            });

        }
    };

    $.fn.autoSlider = function(options) {
        $.each(this, function(idx, slider) {
            new AutoSlider($(slider), options);
        });
    };
}));