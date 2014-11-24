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

var Item = Backbone.Model.extend({
    defaults: {
        key: ''
    }
});


var ItemList = Backbone.Collection.extend({
    model: Item,
    toFinalJSON: function() {
        var ret = {};
        if(!this.models.length){
            return '';
        }
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


var Table = Backbone.View.extend({
    el: $('#table'),
    template: _.template($('#tpl').html()),
    events: {
        'change input[type=checkbox]': 'toggleCheck'
    },
    render: function() {
        this.$el.find('tbody').html(this.template({
            keys: window.keys
        }));
    },
    toggleCheck: function(e) {
        if ($(e.target).prop('checked')) {
            var item = new Item();
            item.set('key', $(e.target).attr('data-key'));
            itemsList.add(item);
        } else {
            itemsList.removeKey($(e.target).attr('data-key'));
        }
    }
});

new Table().render();

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