---
layout: post
title: "滚动区内消失的右边距"
date: 2016-03-28 17:13:57 +0800
categories: css
---

观察[这个](/example/miss-right-margin.html)页面，在可滚动区域内部，为 _.content_ 元素定义的右边距消失了。

![Missing Right Margin](/images/missing-right-margin/missing.jpg)

StackOverflow 上有关于这个现象的详细[解释](http://stackoverflow.com/questions/11695354/css-right-margin-does-not-work-inside-a-div-with-overflow-scroll)，简单来讲这就是 CSS 这么[要求](https://www.w3.org/TR/CSS21/visudet.html#blockwidth)的。

<!-- more -->

但是回过来想一想 CSS 为什么这么要求？这还要从边距和滚动条的意义说起。__边距__，顾名思义，就是定义本元素与四周元素的距离的，在元素排列的方向上（一般是ltr），如果后面没有元素，那么边距也就没有意义了。__滚动条__，其目的是提供一种能显示后代元素完整内容的方式，既然是内容，那么其右侧边距的渲染便没有了意义。以上两个概念综合到一起，当子元素内容大于父元素激活滚动条时，右侧的边距便被当做0处理。在 rtl 的排列中，相应的，是左边距。

其实，如果给容器 _.container_ 定义内边距，会发现其右侧内边距也会“消失”，这与 _.content_ 的右外边距“消失”是一个道理。

这个现象会直接影响容器 _.container_ 的 `scrollWidth` 属性以及滚动条最大滚动量。

另外先入为主应当显示右边距的想法应该是与 iframe 混淆了。iframe中的页面元素可以有外边距，这属于另一个文档（document）了，与本文情形不同。