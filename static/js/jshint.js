/**
 * Copyright (C) 2014 yanni4night.com
 * jshint.js
 *
 * Backbone kinds of poor
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
        if (!this.models.length) {
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
var checkedItemList = new ItemList();

var Table = Backbone.View.extend({
    el: $('#table'),
    template: _.template($('#tpl').html()),
    events: {
        'change input[type=checkbox]': 'toggleCheck'
    },
    initialize: function() {
        this.listenTo(itemsList, 'sync', this.onListFetch);
        itemsList.fetch({
            url: 'jshint.json'
        });
    },
    render: function() {
        this.$el.find('tbody').html(this.template({
            keys: this.keys
        }));
    },
    onListFetch: function(e, data) {
        this.keys = data;
        this.render();
    },
    toggleCheck: function(e) {
        if ($(e.target).prop('checked')) {
            var item = new Item();
            item.set('key', $(e.target).attr('data-key'));
            checkedItemList.add(item);
        } else {
            checkedItemList.removeKey($(e.target).attr('data-key'));
        }
    }
});

new Table();

var Panel = Backbone.View.extend({
    el: $('#output'),
    initialize: function() {
        this.listenTo(checkedItemList, 'add', this.onNewAdded);
        this.listenTo(checkedItemList, 'remove', this.onNewAdded);
    },
    render: function() {
        this.$el.text(checkedItemList.toFinalJSON());
    },
    onNewAdded: function() {
        this.render();
    }
});

new Panel();