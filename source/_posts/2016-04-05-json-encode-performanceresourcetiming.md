---
layout: post
title: "Chrome bug 之 JSON 序列化 PerformanceResourceTiming 对象"
date: 2016-04-05 11:32:35 +0800
categories: chrome json performance resource timing
---

利用 [nightmare](http://nightmarejs.org) 做下线性能对比分析中，少不了要获取 [PerformanceResourceTiming](https://www.w3.org/TR/resource-timing/#performanceresourcetiming) 数据：

```js
performance.getEntriesByType('resource');
```

<!-- more -->

但运行 _nightmare_ 的 NodeJS 环境与运行 [getEntriesByType](https://www.w3.org/TR/performance-timeline/#dom-performance-getentriesbytype) 的 Browser 环境之间只能传输简单数据类型如 string、boolean、number，故下面的写法不可行：

```js
let resources = yield nightmare.evaluate(() => performance.getEntriesByType('resource'));
```

当不得不写成这样时：

```js
let resources = yield nightmare.evaluate(() => JSON.stringify(performance.getEntriesByType('resource')));
```

你会发现返回值是这样的：

```js
[
  {
    "name": "https://...",
    "entryType": "resource",
    "startTime": 1059.82,
    "duration": 413.96500000000015
  }
]
```

显然这比我们见过的 _PerformanceResourceTiming_ 对象少了好多字段。

转向 Chrome，执行类似的操作，发现这并非 _nightmare_ 的问题，而是 blink 内核的bug。Safari 由于不支持 _getEntriesByType_ 而无法测试，Firefox 则输出正常：

```js
[
  {
    "name": "https://...",
    "entryType": "resource",
    "startTime": 4326.712201,
    "duration": 1264.9166809999997,
    "initiatorType": "xmlhttprequest",
    "redirectStart": 0,
    "redirectEnd": 0,
    "fetchStart": 4326.712201,
    "domainLookupStart": 0,
    "domainLookupEnd": 0,
    "connectStart": 0,
    "connectEnd": 0,
    "secureConnectionStart": 0,
    "requestStart": 0,
    "responseStart": 0,
    "responseEnd": 5591.628882
  }
]
```

造成该现象的原因是，序列化 JSON 时，字段取的是 [PerformanceEntry](https://www.w3.org/TR/performance-timeline/#performanceentry) 而非其子类 [PerformanceResourceTiming](https://www.w3.org/TR/resource-timing/#performanceresourcetiming)。

目前，[twitter](https://twitter.com/) 员工提出的该 [bug](https://bugs.chromium.org/p/chromium/issues/detail?id=592171) 与我先前[提出的](https://bugs.chromium.org/p/chromium/issues/detail?id=587713)雷同，代码上已经被修复，等待 Chrome 50 的发版。