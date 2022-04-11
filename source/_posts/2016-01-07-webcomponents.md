---
layout: post
title: "Webcomponents"
date: 2016-01-07 16:44:15 +0800
categories: webcomponents
---

`Webcomponents` 草案包含四个特性：

 - [Custom Elements](http://w3c.github.io/webcomponents/spec/custom/)
 - [HTML Imports](http://w3c.github.io/webcomponents/spec/imports/)
 - [Templates](https://html.spec.whatwg.org/multipage/scripting.html#the-template-element)
 - [Shadow DOM](http://w3c.github.io/webcomponents/spec/shadow/)

具体每个特性的意义不再冗述，网上到处都有，但对四个特性之间的联系及应用普遍缺少更深入的解释。

## 关联

`Webcomponents` 的名字立即会让人想起组件化，有观点认为 `Custom Elements` 与 `HTML Imports` 是主要部分，`Templates` 与 `Shadow DOM` 是次要部分，毕竟，传统的组件系统就是由组件依赖以及组件内容构成的。甚至有人经常把 `Custom Elements` 与 `HTML Imports` 绑定在一起，认为 `Custom Elements` 都是 _import_ 进来的。

以上观点肯定是错误的，可能由于 `Webcomponents` 还在草案之中，文档不全，造成误解也难怪。

先来看 `Custom Elements`，如何注册一个自定义元素？是这样么：

```html
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8"/>
        <title>Demo</title>
        <link rel="import" href="wc-rank.html">
    </head>
    <body>
        <wc-rank></wc-rank>
    </body>
</html>
```

不是，如果是，就证明了 `Custom Elements` 都是 _import_ 进来的观点了。

自定义元素需要通过 JavaScript 脚本来注册：

```javascript
document.registerElement('x-rank', options)
```

使用没有注册过的自定义元素通常也不会有问题，不过它只能代表其后代元素的意义，本身并没有语义。一般地，我们会通过定义 __options__ 参数来扩展 DOM 元素的方法：

```javascript

var RankElement = document.registerElement('x-rank', {
    prototype: {
        next: function () {
        
        }
    }
});

var $fooRank = document.querySelector('#foo-rank');

$fooRank.next();

```

在这种场景下，`registerElement` 就是必须的了。因此，在不支持 `Custom Elements` 的浏览器上，polyfill 是不可能完全实现的。

好了，现在我们实现的 `Custom Elements` 已经有了自定义方法，但还可能需要在内部添加一些固定的后代元素，比如，对于一个 Article 来讲，Header，Footer 就是固定的后代元素，而 Summary 则非。这时候，我们一般使用模板引擎，渲染后直接将 HTML 片段插入到 DOM 中进行解析和展现。`Webcomponents` 提供了原生的 _template_ 元素，预先解析了这部分 DOM，但并不展现，需要时，取出其后代元素的集合（DocumentFragment）：

```html
<wc-rank id="rank"></wc-rank>
<template>
    <header>yanni4night.com</header>
    <h1>Hello</h1>
    <footer>&copy;copyright yanni4night.com 2014~2016</footer>
</template>

<script>
    var template = document.querySelector('template');
    console.log(template.content instanceof DocumentFragment) //true
    document.querySelector('#rank').appendChild(template.content);
</script>
```

如果自定义元素在创建时就已经拥有了固定的后代元素呢，该如何实现？

```html
<wc-rank id="rank">
    <header>yanni4night.com</header>
    <footer>&copy;copyright yanni4night.com 2014~2016</footer>
</wc-rank>
<template>
    <h1>Hello</h1>
</template>

<script>
    var template = document.querySelector('template');
    console.log(template.content instanceof DocumentFragment) //true
    document.querySelector('#rank').insertBefore(template.content, document.querySelector('#rank').lastChild);
</script>
```

可见，template 数量增多后会使操作十分麻烦，`Shadow DOM` 可以解决这个问题：

```html
<wc-rank id="rank">
    <h1>Hello</h1>
</wc-rank>
<template>
    <header>yanni4night.com</header>
    <content select="h1"></content>
    <footer>&copy;copyright yanni4night.com 2014~2016</footer>
</template>

<script>
var proto = Object.create(HTMLElement.prototype);
proto.createdCallback = function() {
  var root = this.createShadowRoot();
  var template = document.querySelector('template');
  var clone = document.importNode(template.content, true);
  root.appendChild(clone);
};
document.registerElement('wc-rank', {
    prototype: proto
});
</script>
```

这样，便以优雅的方式达到了定义自定义元素以及高效重用的目的。现在，将 `Custom Elements` 的定义分离出去，维护在单独的文档中，这就是 `HTML Imports` 的用处之一。

```html
<!-- wc-rank.html -->
<template>
    <header>yanni4night.com</header>
    <content select="h1"></content>
    <footer>&copy;copyright yanni4night.com 2014~2016</footer>
</template>

<script>
var proto = Object.create(HTMLElement.prototype);
proto.createdCallback = function() {
  var root = this.createShadowRoot();
  var template = document.querySelector('template');
  var clone = document.importNode(template.content, true);
  root.appendChild(clone);
};
document.registerElement('wc-rank', {
    prototype: proto
});
</script>
```

```html
<!-- index.html -->
<link rel="import" href="wc-rank.html">
<wc-rank>
    <h1>Hello</h1>
</wc-rank>
```

如此，四个 `Webcomponents` 的特性全部有了用武之地：


>(语义)->
>Custom Elements 
>(内容)-> 
>Templates
>(效率)->
>Shadow DOM
>(重用)->
>HTML Imports


它们都可以独立使用，但相互组合，更能实现优雅和高效的组件化。

![](/images/webcomponents/webcomponents.png)

## Polyfill

 由于目前仅 Chrome（Opera）实现了全部特性，因此 Polyfill 仍有存在一定的价值。下面几个项目都依赖了 [webcomponentsjs](https://github.com/WebComponents/webcomponentsjs)，但在 API 上有所不同。

### Polymer

谷歌发起的项目。Polymer 使用 < dom-module > 标签来定义 `Custom Elements`：

```html

<!--Custom element defination-->
<dom-module id="wc-rank">

  <template>
    <p>I'm a DOM element. This is my local DOM!</p>
    <content select="footer"></content>
  </template>

  <script>
    Polymer({
      is: "wc-rank"
    });
  </script>

</dom-module>

<!--Custom element usage-->
<wc-rank>
    <footer>&copy;copyright</footer>
</wc-rank>
```

内部同时声明了 `Templates` ，并使用 _shady_ DOM 来针对不支持 _shadow_ DOM 的浏览器。`HTML Imports` 也被支持。

值得一提的是，Polymer 支持更复杂的 template，比如 __mustache__ 语法及 _dom-if_、_dom-repeat_ 指令，有点类似于 Angular 的 _ng-if_ 和 _ng-repeat_。

### X-tag

[X-tag](x-tag.github.io) 是微软支持的项目。X-tag 以纯 JavaScript 脚本声明 `Custom Elements`：

```javascript
xtag.register('wc-rank', {
  content: function(){/*
    ‹h2›My name is rank/h2›
    ‹span›I work for a mad scientist‹/span›
  */}
});
```

X-tag 实现了 `Custom elements` 的生命周期回调，对 `HTML Imports`、`Templates` 和 `Shadow DOM`  没有明显的支持。

### Bosonic

[Bosonic](http://bosonic.github.io/) 旨在构建一套低级的 UI 元素：即拿即用。

```html
<element name="wc-rank">
    <template>
        <span>I'm Shadow DOM</span>
    </template>
    <script>
        Bosonic.register({
            tip: function() {
                var span = this.shadowRoot.querySelector('span');
                span.textContent = 'Hello, world!';
            }
        });
    </script>
</element>

<wc-rank></wc-rank>
<script>
    document.querySelector('wc-rank').tip();
</script>
```

### Rosetta

[Rosetta](http://rosetta-org.github.io/) 是百度的一套 `Webcomponents` 解决方案，与上面三个项目最大的区别是在线下利用构建进行 polyfill，以提高运行时效率。

```html
<element name="r-slider">
    <style>
    </style>
    <template>
        <div>
            {attrs.text}
        </div>
        <content select='.aaa'>
        </content>
    </template>
    <script type="text/javascript">
        Rosetta({
            is: 'r-slider',
            properties: {
                list: {
                    type: Array,
                    value:[
                        {
                            title: '111'
                            src: 'xxx'
                        },
                        {
                            title: '222'
                            src: 'zzz'
                        }
                    ]
                },
                text: {
                    type: String,
                    value: '测试'
                }
            }
        });
    </script>
</element>
```

 API 与 Polymer 如出一辙。 

## 扩展 

换个角度，`Webcomponents` 目前在前端生产环境中使用还为时尚早，但其组织方式可以被服务端借鉴。试想，每个组件或者自定义元素都组织在私有的目录下：

 - components
     + wc-rank
         * wc-rank.html
         * wc-rank.js
         * wc-rank.less
     + wc-rank-content
         * wc-rank-content.html
         * wc-rank-content.js
         * wc-rank-content.less

将 `Custom Elements` 作为 __组件名__ 和 __组件引用指令__，如：

```html
<!--wc-rank.html-->
<wc-rank>
    <template>
        <h1>This is a rank</h1>
        <wc-rank-content></wc-rank-content>
        <aside>Aside of rank</aside>
    </template>
</wc-rank>

<!--wc-rank-content.html-->
<wc-rank-content>
    <template>
        <content select="ul"></content>
    </template>
</wc-rank-content>

<!--index.html-->
<wc-rank>
    <wc-rank-content>
        <ul>
            <li>First</li>
            <li>Second</li>
        </ul>
    </wc-rank-content>
</wc-rank>
```

那么最终输出可以是：

```html
<div is="wc-rank">
    <h1>This is a rank</h1>
    <div is="wc-rank">
        <ul>
            <li>First</li>
            <li>Second</li>
        </ul>
    </div>
    <aside>Aside of rank</aside>
</div>
```

该过程完全可以在服务端完成，已经成为了一种简单的模板引擎。同时，如果需要执行 document.createElement('wc-rank') ，可以将 wc-rank.html 和 wc-rank-content.html 带到前端进行动态解析。

接着，css 和 js 可以按照传统的方式进行依赖搜索和 combo。这样便将 `Webcomponents` 应用于服务端，并沿用组件化的思想和 `Webcomponents` 的草案 API，不失为前端工程化的一种解决方案。

## 参考
 - <http://webcomponents.org/>