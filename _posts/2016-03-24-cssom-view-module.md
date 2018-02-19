---
layout: post
title:  "CSSOM View Module 中的尺寸与位置属性"
date:   2016-03-24 00:40:22 +0800
categories: css
---

`CSSOM` 指 _CSS Object Model_，即 _CSS对象模型_。CSSOM 是 JavaScript 操纵 CSS 的一系列 API 集合，它属是 DOM 和 HTML API 的附属。

其中视图模型（View Model）中定义了一系列接口，包括多个关于窗体、文档和元素的位置尺寸信息，特别容易混淆。

<!-- more -->

## Window 接口

##### innerWidth/innerHeight

浏览器窗口可见区的高宽，包括滚动条。

##### outerWidth/outerHeight

浏览器窗口的外边沿宽高。

##### scrollX/scrollY

文档水平/垂直滚动量。

##### pageXOffset/pageYOffset

同上。

##### screenX/screenY

浏览器左上角距离屏幕左上角的距离。

## Screen 接口

##### availWidth/availHeight

屏幕可用区域的尺寸。

##### width/height

屏幕整体尺寸。

## Element 接口


##### clientWidth/clientHeight

元素本身尺寸，包括 padding，但不包括 border、margin 和 scroll。

因此一个设置了 _width:100px_ 的元素出现宽度为 15px 的覆盖式滚动条后，它的 clientWidth 为 85px。

一些浏览器的滚动条是半透明的，并允许覆盖页面元素，这种情形下，clientWidth 为 100px。

##### scrollWidth/scrollHeight

元素的内容区域尺寸，如果有滚动条，则包括隐藏的部分。

这一对值与该元素的后代元素相关。如果后代元素尺寸超过了该元素的大小，不管后代元素是否被隐藏(overflow 或  visibility)，都会计算在内。


##### clientTop/clientLeft

元素内容与整个元素的位置偏移，理论上包括边框宽度与滚动条，由于一般滚动条都位于右下侧，因此这一对值基本上就是左侧和顶部边框的值。

##### scrollTop/scrollLeft

滚动条滚动的位移。

两者均可计算最大值：

垂直：

 > maxScrollTop = scrollHeight - clientHeight
 
水平：

 > maxScrollLeft = scrollWidth - clientWidth

计算滚动条宽度的方法，对于浏览器最外层滚动条：

>window.innerWidth - docment.documentElement.clientWidth

对于普通元素：

>offsetWidth - clientWidth - leftBorderWidth - rightBorderWidth

## HTMLElement 接口

##### offsetWidth/offsetHeight

元素本身尺寸，包括 padding、border，但不包括 margin 和 scroll。

即：

>offsetWidth = leftBorderWidth + clientWidth + rightBorderWidth

和

>offsetHeight = leftBorderWidth + clientHeight + rightBorderWidth


##### offsetTop/offsetLeft

元素外边沿(border)与最近一个定位祖先元素内容区（包括 padding 但不包括 border）的距离。

------------

## 图例

![Legend](/images/cssom/legend.jpg)

如上图，假设黑色框代表浏览器，DOM结构为：

```html
 <div class="container">
        <div class="content">
            <article>
            </article>
        </div>
    </div>
```

样式设定为：

```css
html
body {
    margin: 0;
    padding: 0;
}
.container {
    width: 300px;
    height: 300px;
    overflow: scroll;
    border: 10px solid #ddd;
    margin: 80px;
    position: relative;
    padding: 88px;
}
.content {
    width: 500px;
    height: 500px;
    background: #ccc;
    padding: 60px;
    margin: 75px;
    border: 20px solid #785645
}
article {
    width: 1000px;
    background: #ff0;
}
```

我们来看一下 `.container` 与 `.content` 这两个元素的各种尺寸与位置值。

##### .content

| 属性           | 值        | 说明                                       |
| ------------ | -------- | ---------------------------------------- |
| scrollWidth  | _1060px_ | 后代元素 article 宽度 1000px 超过了 .content 宽 500px，因此实际上 .content 的内容宽度为 1000px(article) + 60px(leftPadding)；如果 article 没有溢出，则为 500px(.content) + 60px(leftPadding) + 60px(rightPadding) |
| scrollHeight | _620px_  | 后代元素未溢出，因此 .content 内容高度为 500px(height) + 60px(paddingTop) + 60px(paddingBottom) |
| clientWidth  | _620px_  | 500px(width) + 60px(leftPadding) + 60px(rightPadding) |
| clientHeight | _620px_  | 500px(width) + 60px(leftPadding) + 60px(rightPadding) |
| offsetWidth  | _660px_  | clientWidth + 20px(leftBorderWidth) + 20px(rightBorderWidth) |
| offsetHeight | _660px_  | clientHeight + 20px(leftBorderWidth) + 20px(rightBorderWidth) |
| clientTop    | _20px_   | 上边框宽度                                    |
| clientLeft   | _20px_   | 左边框宽度                                    |
| offsetTop    | _163px_  | 88px(.container paddingTop) + 75px(.content marginTop) |
| offsetLeft   | _163px_  | 88px(.container paddingleft) + 75px(.content marginleft) |
| scrollTop    | 0        | 没有滚动条                                    |
| scrollLeft   | 0        | 没有滚动条                                    |

##### .container

| 属性           | 值             | 说明                                       |
| ------------ | ------------- | ---------------------------------------- |
| scrollWidth  | _1243px_      | 1060px(.content scrollWidth) + 20px(.content leftBorderWidth) + 75px(.content leftMargin) + 88px(.container leftPadding)，注意即使 .content 的后代 article 内容没有溢出，.container 的 scrollWidth 也是 660px(.content scrollWidth) + 75px(.content leftMargin) + 88px(.container leftPadding)，右侧的内外边距并不增加，见[这里](http://stackoverflow.com/questions/11695354/css-right-margin-does-not-work-inside-a-div-with-overflow-scroll) |
| scrollHeight | _986px_       | 620px(.content scrollWidth) + 20px(.content topBorderWidth) + 20px(.content bottomBorderWidth) + 75px(.content topMargin) + 88px(.container leftPadding) |
| clientWidth  | _476px-滚动条宽度_ | 内容区宽度 + padding，去除滚动条                    |
| clientHeight | _476px-滚动条宽度_ | 内容区高度 + padding，去除滚动条                    |
| offsetWidth  | _496px_       | 300px + 88px × 2 + 20px × 2              |
| offsetHeight | _496px_       | 300px + 88px × 2 + 20px × 2              |
| clientTop    | _10px_        | 上边框宽度                                    |
| clientLeft   | _10px_        | 左边框宽度                                    |
| offsetTop    | _80px_        | 最近一个定位元素是body，取 topMargin                |
| offsetLeft   | _80px_        | 最近一个定位元素是body，取 leftMargin               |
| scrollTop    | 不定            | 取决于滚动位置，最大值为 scrollHeight - clientHeight |
| scrollLeft   | 不定            | 取决于滚动位置，最大值为 scrollWidth - clientWidth   |

详见[这里](/example/cssom.html)。


在 CSSOM 草案出台之前，许多浏览器就已经支持其中相当一部分，CSSOM 的目的是规范这些取值，可以看到其中有些量的意义是相同的，比如 scrollX/pageXOffset、scrollY/pageYOffset。另外：

>window.scrollX = document.body.scrollLeft = window.pageXOffset 

与

>window.scrollY = document.body.scrollTop = window.pageYOffset 