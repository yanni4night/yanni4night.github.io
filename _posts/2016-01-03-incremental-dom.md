---
layout: post
title:  "Incremental DOM"
date:   2016-01-03 16:13:27 +0800
categories: incremental DOM reactjs emberjs glimmer
---

## 简介

[Incremental DOM](https://github.com/google/incremental-dom) 是谷歌公司在 2015年4月起发起的一种支持模板引擎的高效 DOM 操作技术。相比于 `React.js` 的 `DOM Diff` 算法和 `Ember.js` 的 `Glimmer` 引擎，`Incremental DOM` 没有使用 `Virtual DOM` 的概念，转而直接去操作 DOM，因此其特点就是节约内存消耗，这对于移动端来说可能存在积极的意义。

先来看 `Incremental DOM` 的 API 的样子：

```javascript
elementOpen('div', '', ['title', 'tip']);
text('Hello World!');
elementClose('div');
```

可以说 `Incremental DOM` 的 API 十分地原始和简陋。[Google Developers](https://medium.com/google-developers/introducing-incremental-dom-e98f79ce2c5f) 也提到，`Incremental DOM` 并非为开发者直接使用，而是用于模板引擎的底层实现。

## 原理

现在来简单分析下 `Incremental DOM` 的实现原理。

由于操作 DOM 的代价相当高，因此 `React.js` 和 `Glimmer` 都有一套算法来计算最小的 DOM 操作量。在 `Incremental DOM` 内部，通过__遍历__原始 DOM 进行脏检查来计算这个值。

首先了解 `Incremental DOM` 的几个概念：

#### 节点指针

在 `Incremental DOM` 内部，维护了多个节点（HTMLElement）指针：
 - currentNode：当前节点；
 - currentParent：当前节点的父节点；
 - previousNode：当前节点的前置兄弟节点；
 - prevCurrentNode：之前遍历的最后一个节点；
 - prevCurrentParent：之前遍历的最后一个节点的父节点；
 - prevPreviousNode：之前遍历的最后一个节点的前置兄弟节点

#### 节点遍历

主要操作有 `enterNode`、`exitNode`、`nextNode`。

假设当前指针指向为：

```html
<div id="content"> <!--currentParent--> <!--prevCurrentParent-->
    <div class="item1"> <!--prevPreviousNode-->
    </div>
    <div class="item2"> <!--previousNode--> <!--prevCurrentNode-->
    </div>
    <div class="item3"> <!--currentNode-->
        <div title="tip">
            Hello World!
        </div>
    </div>
    <div class="item4">
    </div>
    <div class="item5">
    </div>
</div>
```

`enterNode()` 操作，即进入 `.item3` 内部，各指针变为：

```html
<div id="content">  <!--prevCurrentParent-->
    <div class="item1"> 
    </div>
    <div class="item2"> <!--prevPreviousNode--> 
    </div>
    <div class="item3"> <!--prevCurrentNode--> <!--currentParent-->
        <!--previousNode-->
        <div title="tip"> <!--currentNode-->
            Hello World!
        </div>
    </div>
    <div class="item4">
    </div>
    <div class="item5">
    </div>
</div>
```

`exitNode()` 操作，离开 `.item3`，各指针变为：

```html
<div id="content"> <!--currentParent-->
    <div class="item1"> 
    </div>
    <div class="item2"> 
    </div>
    <div class="item3"> <!--prevCurrentParent--> <!--previousNode-->
        <!--prevPreviousNode-->
        <div title="tip"> <!--prevCurrentNode-->
            Hello World!
        </div>
    </div>
    <div class="item4"> <!--currentNode-->
    </div>
    <div class="item5">
    </div>
</div>
```

`nextNode()` 操作，遍历至下一个节点，各指针变为：

```html
<div id="content"> <!--currentParent--> <!--prevCurrentParent-->
    <div class="item1"> 
    </div>
    <div class="item2"> 
    </div>
    <div class="item3"> <!--prevPreviousNode-->
        <div title="tip">
            Hello World!
        </div>
    </div>
    <div class="item4"> <!--prevCurrentNode--> <!--previousNode--> 
    </div>
    <div class="item5"> <!--currentNode-->
    </div>
</div>
```

## DOM 操作

明白了 `Incremental DOM` 的内部指针状态后，我们来看一个例子。

```html
<div id="content">
    <div class="parent">
        <div class="child" title="James">Hello World!</div>
    </div>
</div>
```

我们要修改 `.child` 元素的 title 值：

```javascript
patch(document.querySelector('#content'), function () {
    elementOpen('div', '', null);
        elementOpen('div', '', ['title', 'Jim']);
            text('Hello World!');
        elementClose('div');
    elementClose('div');
});
```

实际的 DOM 遍历和操作为：

 1. enterNode(#content)
 2. enterNode(.parent)
 3. enterNode(.child)
 4. `setAttribute('title', 'Jim')`
 5. nextNode()
 6. exitNode(.child)
 7. exitNode(.parent)
 8. exitNode(#content)

由于 JS 代码与 HTML 在结构上是一致的，因此当遍历到 `.child` 元素时，直接修改其元素，而其它元素由于结构属性都没有改变，因而没有额外的 DOM 操作。

如果我们要进一步修改 DOM 为：

```html
<div id="content">
    <div class="parent">
        <div class="child">Hello World!</div>
        <div class="sibling">Hello World!</div>
    </div>
</div>
```

`Incremental DOM` 的 API 操作为：

```javascript
patch(document.querySelector('#content'), function () {
    elementOpen('div', '', null);
        elementOpen('div', '', null);
            text('Hello World!');
        elementClose('div');
        elementOpen('div', '', null);
            text('Hello World!');
        elementClose('div');
    elementClose('div');
});
```

实际的 DOM 遍历和操作为：

 1. enterNode(#content)
 2. enterNode(.parent)
 3. enterNode(.child)
 4. `removeAttribute('title')`
 5. nextNode()
 6. exitNode(.child)
 7. enterNode(.sibling)
 8. `createElement()`
 9. `createText()`
 10. nextNode()
 11. exitNode(.sibling)
 12. exitNode(.parent)
 13. exitNode(#content)

`Incremental DOM` 正是通过这种简单粗暴的方式来实现最小量的 DOM 操作。

## 性能

由于直接在原始 DOM 上做脏检查，`Incremental DOM` 在性能上有所下降。

![](/images/incremental/LayoutAndPaint.png)

上图是各个框架在布局和绘画上的性能比较，可见 `Incremental DOM` 是垫底的。

`Incremental DOM` 用性能来换取内存优化：

![](/images/incremental/MajorGC.png)
![](/images/incremental/MinorGC.png)

上图是各个框架在 GC 上的性能，`Incremental DOM` 表现十分优越。

## 如何使用

`Incremental DOM` 的特点使得它适用于内存敏感型而非性能敏感型的应用。同时，前面也提到，`Incremental DOM` 为模板引擎的底层所设计，不适合直接调用其 API。

已经应用了 `Incremental DOM` 的模板引擎有：
 - [Closure Templates](https://developers.google.com/closure/templates/)
 - [JSX](https://github.com/jridgewell/babel-plugin-incremental-dom)
 - [superviews.js](https://github.com/davidjamesstone/superviews.js)
 - [starplate](https://github.com/littlstar/starplate)

`Incremental DOM` 仍在发展中，相比 `react.js` 与 `ember.js` 而言并没有受到太多的关注，期待其对模板引擎在性能上的促进和发展。
