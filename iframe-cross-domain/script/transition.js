/**
 * Copyright (C) 2014 yanni4night.com
 * step.js
 *
 * changelog
 * 2014-11-03[19:23:32]:authorized
 *
 * @author yanni4night@gmail.com
 * @version 0.1.0
 * @since 0.1.0
 */
var EVT_TRANSITIONEND = 'webkitTransitionEnd mozTransitionEnd msTransitionEnd transitionend';

//we have to assume that all properties are done in a transition
function TransEntity(opt) {
  opt = this.opt = $.extend({
    $entity: null,
    init: $.noop,
    transClass: ['trans-on'],
    onComplete: $.noop
  }, opt || {});
  var transIndex = 0;
  var self = this;
  var endCache = {};

  if (!opt.$entity) {
    throw new Error('entity is required');
  }

  opt.init.call(this);

  opt.$entity.on(EVT_TRANSITIONEND, function(e) {
    if (!endCache[transIndex]) {
      opt.onComplete.call(self, transIndex);
      endCache[transIndex] = true;
    }
  });

  this.next = function() {
    var tclaz;
    if (!(tclaz = opt.transClass[transIndex])) {
      return;
    }
    opt.$entity.addClass(tclaz);
    ++transIndex;
  };

  this.prev = function() {

  };
}

module.exports = TransEntity;