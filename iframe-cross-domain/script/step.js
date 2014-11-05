/**
 * Copyright (C) 2014 yanni4night.com
 * step.js
 *
 * changelog
 * 2014-11-04[16:41:14]:authorized
 *
 * @author yanni4night@gmail.com
 * @version 0.1.0
 * @since 0.1.0
 */

"use strict";

require('./bg');

var curStep = +(location.hash.match(/#step\-(\d)/) || [0, 0])[1];

var $steps = $('.step');

function stepTo(step) {
  if (step < 0) {
    step = 0;
  } else if (step >= $steps.length) {
    step = $steps.length - 1;
  }

  curStep = step;

  $steps.addClass('hide').eq(step).removeClass('hide');
  location.hash = '#step-' + step;
}

if (curStep >= 0 && curStep < $steps.length) {
  stepTo(curStep);
} else {
  stepTo(0);
}

$('.navigator.refresh').click(function(e) {
  stepTo(0);
});
$('.navigator.back').click(function(e) {
  stepTo(--curStep);
});
$('.navigator.forward').click(function(e) {
  stepTo(++curStep);
});

$(document).keyup(function(e) {
  if (39 === e.keyCode || 40 === e.keyCode) {
    stepTo(++curStep);
  } else if (37 === e.keyCode || 38 === e.keyCode) {
    stepTo(--curStep);
  }
});