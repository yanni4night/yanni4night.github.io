/**
 * Copyright (C) 2014 yanni4night.com
 * jshint.js
 *
 * changelog
 * 2014-11-23[14:55:09]:revised
 *
 * @author yanni4night@gmail.com
 * @version 0.1.0
 * @since 0.1.0
 */
"use strict";

/*
var options = _.map($('td.name'), function(td) {
    return $(td).text();
});

console.debug(options);*/

$('td.name').each(function(idx, td) {
    $('<input type="checkbox" class="key"/>').insertBefore($(td).find('a'));
});

var Item = Backbone.Model.extend({
    defaults: {
        key: ''
    }
});


var ItemList = Backbone.Collection.extend({
    model: Item,
    toFinalJSON: function() {
        var ret = {};
        _.each(this.models, function(item) {
            ret[item.get('key')] = true;
        });
        return JSON.stringify(ret, null, 2);
    },
    removeKey: function(key) {
        this.remove(this.where({
            key: key
        }));
    }
});

var itemsList = new ItemList();

var Panel = Backbone.View.extend({
    el: $('#output'),
    initialize: function() {
        this.listenTo(itemsList, 'all', this.onNewAdded);
    },
    render: function() {
        this.$el.text(itemsList.toFinalJSON());
    },
    onNewAdded: function() {
        this.render();
    }
});

new Panel();

var onChecked = function() {
    var key = $(this).parents('td.name').text();
    var checked = $(this).parents('td.name').find('input.key').prop('checked');
    if (checked) {
        var item = new Item();
        item.set('key', key);
        itemsList.add(item);
    } else {
        itemsList.removeKey(key);
    }
};
$(document).delegate('input.key', 'change', onChecked);