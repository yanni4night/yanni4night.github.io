---
layout: post
title: "模拟submit、change事件冒泡"
date: 2014-11-29
categories: bubble event jquery
---

IE8以下 form 表单的 `submit` 事件、checkbox/radio 的 `change` 都不会冒泡到 `document` 中，[jQuery][jquery-url] 对它们进行了修复，使得在这些 DOM 元素的父节点上 `delegate` 这些事件得以实现。

### submit

模拟 `submit` 事件冒泡的一个前提是表单由点击提交按钮或在输入框中敲击回车触发，这两个事件都是可以冒泡的，因此可以在监听到有表单输入元素(input、button)的`click`、`keypress`时向包含这些元素的 form 表单元素注册一个 `submit` 事件，而 `submit` 事件一定是在 `click` 事件处理过后再触发的，因此不必担心错过时机。

### change

radio、checkbox的 `change` 事件除了不能不能冒泡外，其在自身也有问题：失去焦点后才会触发，而不是选中状态变化后立即触发。所以这里的 fix 要分为两步。

IE 中存在 `propertychange` 这样一个事件，可以监听所有属性的变化，那么就以此代替 `change` 事件，只要处理event.propertyName === 'checked' 即可。这样，选中状态变化后不能立即触发 `change` 的问题得到了解决。

radio、checkbox的选中状态在变化前，在IE中会触发一个叫 `beforeactivate` 的事件，那么跟 `submit` 一样的原理，以此来解决 `change` 事件不能冒泡的问题。

### focusin focusout mouseenter mouseleave

这4个事件是 [jQuery][jquery-url] 模拟的，支持冒泡。


顺便提一下当调用 `jQuery.on` 时发生了什么，[jQuery][jquery-url] 首先要判断应不应该在指定DOM 元素上绑定，一般都应该直接绑，不过像上面提到的 `submit`、`change`就不能直接绑，可能需要在子孙元素上绑定，也可能绑定其它替代事件。而像 `focusin`、`focusout` 这样模拟的事件就需要编程去实现冒泡了。

当调用 `jQuery.trigger` 时，[jQuery][jquery-url] 内部会尝试在 DOM 元素上调用与事件同名的方法，而不是用事件 API 去构造一个 event 对象。


[jquery-url]:http://jquery.com/


## 参考
 - <https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement.click>
 - <http://learn.jquery.com/events/event-extensions/>