---
layout: post
title: "常见 Polyfill 之 getElementsByClassName"
date: 2014-09-29
categories: js
---

常见到一些代码或笔试题会出现针对旧浏览器（主要是IE6/7/8）的 `getElementsByClassName` 方法的 polyfill，我在面试一些初学者时也常常问起，不过回答差不多者寥寥。其实想完整的实现与原生相同的功能基本不可能，原因之一即是不管该方法返回的是 `HTMLCollection` 还是 `NodeList`，它们都必须是 [alive](http://www.w3.org/TR/DOM-Level-3-Core/core.html#td-live) 的，意即针对 DOM 树的任何改动都会实时反应到其中。因此，非瞬时地缓存集合的长度是危险的。同时由于不能构造一个 `HTMLCollection` 或 `NodeList` ，我们一般会以数组代之，因此集合是不可变的。


所有 getElements* 方法返回的集合都是 live 的，只有 [querySelector](http://www.w3.org/TR/2013/REC-selectors-api-20130221/#queryselectorall) 返回的 static 的。测试参见[这里](/example/live.html);



###### 引用
- <https://dom.spec.whatwg.org/#dom-document-getelementsbytagname>
