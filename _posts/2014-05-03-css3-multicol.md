---
layout: post
title:  "CSS3多列布局"
date:   2014-05-03
categories: css3 column layout
---

过宽的大段文字内容对读者不够友好，尝试阅读一下[这里](/example/columns.html)的第一段文字，是否在换行时遇到困难。

像报纸一样，web 设计时遇到大段文字一般都会尝试将文字内容分成多列显示，在技术上可以通过加入表格(table)或任意其它块级元素标签解决。显然这样的设计欠缺灵活性，需要手动分割文字内容，过多或过少的文字都将影响分割算法。`CSS 2.1` 后带来了新的布局功能————多列布局，很好地解决了此问题。

#####语法

###### 多列布局

多列布局适用于非替换 `block` 元素（除 `table` 外），`table-cell` 和 `inline-block` 元素。

    article{
        columns:3;
    }

这段 CSS 代码即定义所有 `article` 元素分为3列进行排版。这是最大列数定义，当文字不足时，也可能按2列或1列显示。

也可以这样定义：

    article{
        columns:10em;
    }

这意味着每列最多显示10个字符宽度。

事实上，`columns` 是 `column-count` 和 `column-width` 的缩写。大多数时候仅需给出一个值，当两个值都给出时，一般仅有一个能影响最终排版，`column-count` 代表可以分割的最大列数。

######列间隙

使用 `column-gap` 设置列与列之间的间隙，如：

    article{
        column-gap:3em;
    }

######列分割线

列分割线由 `column-rule-color` ， `column-rule-width` 和 `column-rule-style` 定义，语法类似与 `border` ，如：

    article{
        column-rule-color:#28b;
        column-rule-style:dashed;
        column-rule-width:1px;
    }

或者简写为：

    article{
        column-rule:1px #28b dashed;
    }

######分割位置

可以定义一些分割位置的建议，如不能在某些元素的中间分割：

    article p{
        break-before:avoid;
        break-after:column;
        break-inside:avoid;
    }

这些属性仅对块级元素有效，不过好像目前还没有浏览器支持它们。

######夸列元素

可以定义夸列元素，如：

    article h1{
        column-span:all|none;
    }

######列填充策略

两种策略：平衡和非平衡的，目前只有 `Firefox` 支持:

    article{
        column-fill:balance|auto;
    }


#####浏览器支持

虽然多列布局一直处于 [Candidate Recommendation](http://www.w3.org/TR/css3-multicol/) 阶段，但是现代 PC 和 Mobile 浏览器几乎已经全部实现， `IE` 从 10 开始支持。部分浏览器需要加厂商前缀。


 - IE 10+
 - Firefox 5+
 - Chrome 12+
 - Safari 3.2+
 - Opera 11.1+
 - Android 2.1+
 - iOS 3.2+


下面是多列布局所需的所有 CSS 属性的  `LESS` ：

    .column(@w){
        -webkit-columns:@w;
        -moz-columns:@w;
        columns:@w;
    }
    .column-gap(@len){
        -webkit-column-gap:@len;
        -moz-column-gap:@len;
        column-gap:@len;
    }
    .column-rule-color(@color){
        -webkit-column-rule-color:@color;
        -moz-column-rule-color:@color;
        column-rule-color:@color;
    }
    .column-rule-style(@style:solid){
        -webkit-column-rule-style:@style;
        -moz-column-rule-style:@style;
        column-rule-style:@style;
    }
    .column-rule-width(@width){
        -webkit-column-rule-width:@width;
        -moz-column-rule-width:@width;
        column-rule-width:@width;
    }
    .break-before(@break){
        -webkit-break-before:@break;
        -moz-break-before:@break;
        break-before:@break;
    }
    .break-after(@break){
        -webkit-break-after:@break;
        -moz-break-after:@break;
        break-after:@break;
    }
    .break-inside(@break){
        -webkit-break-inside:@break;
        -moz-break-inside:@break;
        break-inside:@break;
    }
    .column-span(@span){
        -webkit-column-span:@span;
        -moz-column-span:@span;
        column-span:@span;
    }
    .column-fill(@fill:balance){
        -webkit-column-fill:@fill;
        -moz-column-fill:@fill;
        column-fill:@fill;
    }

查看多列布局的实际效果，点击[这里](/example/columns.html)。

#####总结

使用 CSS 多列布局不仅大大提高了布局灵活性，对屏幕阅读器、打印机和 `SEO` 也更友好。但需要针对旧浏览器设计功能降级。

#####参考

- <https://developer.mozilla.org/zh-CN/docs/Web/Guide/CSS/Using_multi-column_layouts>
- <http://css-tricks.com/snippets/css/multiple-columns/>
- <http://webdesign.tutsplus.com/articles/an-introduction-to-the-css3-multiple-column-layout-module--webdesign-4934>
