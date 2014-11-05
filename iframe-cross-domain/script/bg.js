/**
 * Copyright (C) 2014 yanni4night.com
 * bg.js
 *
 * changelog
 * 2014-11-05[10:02:50]:authorized
 *
 * @author yanni4night@gmail.com
 * @version 0.1.0
 * @since 0.1.0
 */

"use strict";

var imgs = ['grey', 'red', 'cyan', 'yellow'];

var idx = 0;

var getimg = function(idx) {
    return 'img/bg/' + imgs[idx] + '.jpg';
};

var prefetch = function(idx) {
    new Image().src = getimg(idx);
};

var run = function() {
    $('body').css('background-image', 'url(' + getimg(idx) + ')');
    idx = (1 + idx) % imgs.length;
    prefetch(idx);
};

prefetch(0);
setInterval(run, 1e4);