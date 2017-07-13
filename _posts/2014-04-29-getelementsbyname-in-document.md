---
layout: post
title:  "getElementsByName方法的出身"
date:   2014-04-29
categories: document nodelist getElementsByName getElementsByClassName getElementsByTagName
---

###### 定义

在几个 `getElementsBy*` 方法中，`getElementsByName` 算是比较特殊的，表面上看即只有它不能在 `Element` 上调用。

[W3C](http://www.w3.org/) 将该方法定义在 [HTMLDocument](http://www.w3.org/TR/2003/REC-DOM-Level-2-HTML-20030109/html.html#ID-26809268) 接口中：

    interface HTMLDocument : Document {
               attribute DOMString       title;
      readonly attribute DOMString       referrer;
      readonly attribute DOMString       domain;
      readonly attribute DOMString       URL;
               attribute HTMLElement     body;
      readonly attribute HTMLCollection  images;
      readonly attribute HTMLCollection  applets;
      readonly attribute HTMLCollection  links;
      readonly attribute HTMLCollection  forms;
      readonly attribute HTMLCollection  anchors;
               attribute DOMString       cookie;
        
      void               open();
      void               close();
      void               write(in DOMString text);
      void               writeln(in DOMString text);
      NodeList           getElementsByName(in DOMString elementName);
    };


按照此定义， `getElementsByName` 方法应该仅存在于 `HTMLDocument` 中而非 `Document` 中。在能够访问 `Document` 接口的浏览器（Opera，Chrome，Firefox，Safari和 Internet Explorer 10）中，测试下列代码：

    !!Document.prototype.getElementsByName

结果如下：

|浏览器|Opera|Chrome|Firefox|Safari|IE10|
|:---:|:---:|:---:|:---:|:---:|:---:|
|结果|false|true|false|true|true|

分别观察一下 [Gecko](https://developer.mozilla.org/en-US/docs/Mozilla/Gecko) 和 [Webkit](http://www.webkit.org) 关于 `(HTML)Document` 部分的 IDL ：
    
    //Gecko 中 HTMLDocument.webidl 文件
    interface HTMLDocument : Document {
        NodeList getElementsByName(DOMString elementName);
    };
    //Webkit 中 Document.idl 文件
    interface Document : Node {
        NodeList getElementsByName([Default=Undefined] optional DOMString 
    }

可见两者将 `getElementsByName` 定义在了不同的接口中，似乎 [Gecko](https://developer.mozilla.org/en-US/docs/Mozilla/Gecko) 的做法更符合 [W3C](http://www.w3.org/) 规范。

对此的解释可能是 [Webkit](http://www.webkit.org) 和 `Internet Explorer` 按照 [whatwg](http://www.whatwg.org/specs/web-apps/current-work/multipage/dom.html#document) 的 HTML5 草案进行了实现。

###### 返回类型

关于 `getElementsBy*` 方法的返回类型，[whatwg](http://dom.spec.whatwg.org/#document) 规定为 `HTMLCollection` ， [W3C](http://www.w3.org/TR/2004/REC-DOM-Level-3-Core-20040407/core.html#i-Document) 规定为 `NodeList` 。`HTMLCollection` 和 `NodeList` 两者很类似，都有 length 属性，都可以用数字索引或 `item()` 方法方位其中元素。但其差异也是明显的，前者成员为 `HTMLElement` ，而后者为 `Node` ，前者拥有 `namedItem()` 方法。现代浏览器对其实现不一致：

|浏览器|Opera/Safari/Android|Chrome/Firefox|Internet Explorer(+WP8)|
|:---:|:---:|:---:|:---:|:---:|
|getElementsByTagName|NodeList|HTMLCollection|HTMLCollection|
|getElementsByName|NodeList|NodeList|HTMLCollection|
|getElementsByClassName|NodeList|HTMLCollection|HTMLCollection|

显然应该退化到 `Node` 和 `NodeList` 进行编程，避免依赖特定的类型返回值。
