---
layout: post
title:  "日期的字符串表现形式"
date:   2015-03-02
categories: date time format
---

使用 `Date` 构造一个指定日期，即可以传入毫秒单位的 UNIX 时间戳，也可以传入一定格式的字符串。

默认地，

```javascript
    new Date().toString()//Mon Mar 02 2015 16:49:10 GMT+0800 (CST)
```

返回的字符串即为默认支持的日期表示形式，该格式定义于 [RFC2822](http://tools.ietf.org/html/rfc2822#section-3.3)，也是 `HTTP Header` 经常使用的格式。

`ECMAScript 5.1` 开始支持一种新的表示形式 -- `ISO` ：

```javascript
    new Date().toISOString()//2015-03-02T08:57:08.865Z
```

该格式在 `ECMAScript` 中的定义位于 [15.9.1.15](http://www.ecma-international.org/ecma-262/5.1/#sec-15.9.1.15)，它与 `HTML5` 使用的 [RFC3339](http://tools.ietf.org/html/rfc3339)类似，区别参考 [stackoverflow](http://stackoverflow.com/questions/522251/whats-the-difference-between-iso-8601-and-rfc-3339-date-formats)。

因此 "modern" 浏览器都支持这两种格式，`ISO` 格式会被首先尝试。

除此之外，各种 UA 可以继续实现其它格式的支持，比如 `Firefox` 支持

```javascript
    new Date('3/2/2015')
```

但 `Chrome` 不支持；`Chrome` 支持

```javascript
    new Date('2015-03-02 15:00')
```

但 `Firefox` 不支持。

应尽量使用标准的日期字符串表示形式，ISO 对代码更友好。

另外，在解析字符串格式日期时，假设的时区是不同的，ISO 是 UTC 时间，否则为当前时区。

##### 参考

 - <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse>