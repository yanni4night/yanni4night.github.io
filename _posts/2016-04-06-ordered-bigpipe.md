---
layout: post
title: "有序 BigPipe"
date: 2016-04-06 16:13:12 +0800
categories: chunk bigpipe
---

![纪念此猫](/images/bigpipe/shenshen.jpg)

## 概念

`BigPipe` 的原理是使用 _HTTP/1.1_ 的 __chunk__ 能力分片多线程加载页面的不同部分，以降低白屏/首屏时间。由于 HTML 文档（document）是一篇纯文本，文本的内容直接决定了最终页面的展现形态和功能，因此虽然服务端可以采用多线程加载数据和输出页面片段，但在浏览器端这些片段必须保证是有序排列。于是，JavaScript 脚本担负起了这个职责，它将 HTML 片段字符串渲染成为 DOM。

<!-- more -->

在移动端，JavaScript 脚本渲染页面存在可观的性能问题，频繁的 _reflow_/_repaint_将会很大程度影响页面首次展示的视觉体验。既然 JavaScript 脚本在前端不适合做渲染者的角色，那么我们考虑将渲染放在服务端，这也就是传统的 _C/S_ 模式。但是因此前面提到的顺序问题，服务器必须保证整个页面文档是按照顺序输出的，加上 _chunk_ 能力，我们得到的是一种退化的 _BigPipe_：可以降低首屏时间，但会限制整个页面的最终输出时间，我们叫它 _Ordered BigPipe_。

应用 _Ordered BigPipe_ 的前提是你的页面可以分解为相互独立的，自上而下的页面片，每个页面片在 _chunk_ 通道中依次输出：

```
 S ---------------
     /  \ \ \ \
    /    \ \ \ \
 C ---------------
```

使用 _PHP_ 语言可能是这样的：

```php
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8"/>
        <title>Demo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="style.css">
    </head>
    <body>
<?php
flush();
?>
        <header></header>
<?php
flush();
?>
        <article></article>
<?php
flush();
?>
        <footer></footer>
    </body>
    <script src="script.js"></script>
</html>
```

以上页面分为四段进行输出。由于 Server 不必查询到页面所需要的全部数据，因此可以大大提高系统的响应速度，进而有效降低白屏与首屏时间。

## 实现

### Server

上面提到，Server 需要分段获取数据，那么如何定义每段的数据需求呢？两种方式：

 1. 前后端约定一个页面划分哪几段，再规定每段应该有什么样的数据；
 1. 由前端自由划分段落，主动向 Server 索取数据

显然，第二种方式，虽然实现更复杂，然而更灵活，解耦更好。

首先定义模型 `DataProvider`，它的定义是：一组可查询的相关联数据的最小单位。例如查询用户信息和查询用户最近发言两个 _DataProvider_：

```
user_id:
name:
address:
mobile:
gender:
```

```
user_id:
user_recent_posts:
```

既不能单独查询 *user_profile.address*，也不能同时查询 *user_profile* 和 *user_recent_posts*。

合理地规划 _DataProvider_ 有助于提升效能。

接下来，在段中声明它所需要的所有 _DataProvider_ 列表：

```
data-providers:
     - user_profile
     - user_recent_posts
```

这样，Server 端可以收集所有的段以及它们依赖的 _DataProvider_：

```
segment:
    user_profile
segment:
    user_profile
    user_recent_posts
```

按照先后顺序，依次查询每个 _DataProvider_ 的数据，一旦满足最上面段所需要的数据，则进行一次页面输出。以下面的依赖为例：

```
sg1:
    dp1
    dp2
sg2:
    dp1
    dp3
sg3:
    dp2
    dp4
```

那么 _DataProvider_ 按顺序排列后为：

    dp1->dp2->dp3->dp4
 
段组成的队列为:

```
    |sg1| 
    |sg2|
    |sg3|
    -----
```

首先填充 dp1 的数据，发现 sg1 的需求并不能满足，接着填充 dp2 的数据，这时 sg1 得到满足，出队，进行页面渲染输出，但 sg2 还不能。

紧接着填充 dp3 的数据，sg2 进行渲染输出。同样的道理，在填充 dp4 之后，sg3 也可以开始渲染了，直到队列中为空。

### 前端

_Ordered BigPipe_ 的前提是服务端渲染。

"段"实际上是一种前端的模型，它代表页面可垂直划分的片段，不支持嵌套，因为嵌套会带来潜在的标签不闭合风险。

```
<html>-----------------------------------
    <head>                               \
        <meta>                            \  
        <title></title>                    Segment
        <link rel="stylesheet" href="">   /
    </head>                              /
    <body>-------------------------------
    <article>-------------------------------
                                            \
                                             Segment    
                                            /
    </article>------------------------------
    <script src=""></script>----------------
                                            \
    </body>                                  Segment
                                            /
</html>-------------------------------------
```

## 总结

_Ordered BigPipe_ 仅适用于垂直无嵌套排列的页面。
