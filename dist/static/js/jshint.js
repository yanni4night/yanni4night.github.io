!function a(b,c,d){function e(g,h){if(!c[g]){if(!b[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);var j=new Error("Cannot find module '"+g+"'");throw j.code="MODULE_NOT_FOUND",j}var k=c[g]={exports:{}};b[g][0].call(k.exports,function(a){var c=b[g][1][a];return e(c?c:a)},k,k.exports,a,b,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(){"use strict";var a=Backbone.Model.extend({defaults:{key:""}}),b=Backbone.Collection.extend({model:a,toFinalJSON:function(){var a={};return this.models.length?(_.each(this.models,function(b){a[b.get("key")]=!0}),JSON.stringify(a,null,2)):""},removeKey:function(a){this.remove(this.where({key:a}))}}),c=new b,d=Backbone.View.extend({el:$("#table"),template:_.template($("#tpl").html()),events:{"change input[type=checkbox]":"toggleCheck"},render:function(){this.$el.find("tbody").html(this.template({keys:window.keys}))},toggleCheck:function(b){if($(b.target).prop("checked")){var d=new a;d.set("key",$(b.target).attr("data-key")),c.add(d)}else c.removeKey($(b.target).attr("data-key"))}});(new d).render();var e=Backbone.View.extend({el:$("#output"),initialize:function(){this.listenTo(c,"all",this.onNewAdded)},render:function(){this.$el.text(c.toFinalJSON())},onNewAdded:function(){this.render()}});new e},{}]},{},[1]);