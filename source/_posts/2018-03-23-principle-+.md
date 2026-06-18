---
layout: post
title: "Javascript '+' 运算符原理"
date: 2018-03-23 15:02:57 +0800
categories:
  - 技术
  - javascript
tags:
  - javascript
---

继了解完“==”的原理后，再来了解一下加号“+”的 ECMAScript 实现原理。

例如：

```js
a + b
```

第一步，对 a 和 b 执行 _toPrimitive()_，不指定 [hint](https://tc39.github.io/ecma262/#sec-ordinarytoprimitive)。

以 _toPrimitive(a)_ 为例，先看 a 有没有定义 _Symbol.toPrimitive_，比如：

```js

a[Symbol.toPrimitive] = customToPrimitive;
function customToPrimitive(hint) {
    switch (hint) {
        case 'number':
            ...
        case 'string':
            ...
        default: // 'default'
    }
};

```

如果定义了 _Symbol.toPrimitive_ 属性，则执行：

```js
customToPrimitive.call(a, 'default')
```

否则执行原生 _toPrimitive("number")_，也就是要依次调用 a 的 _valueOf_ 和 _toString_ 方法。

如果执行 _a.valueOf()_ 返回不是 Object，则为 _toPrimitive(a)_ 的终值，否则执行 _a.toString()_。

接下来，看 a 有没有定义 toString，如果有，则执行 _a.toString()_，为 _toPrimitive(a)_ 的终值。

如果没有，则执行原型链顶端的 _Object.prototype.toString_,这首先要看 a 有没有定义 _Symbol.toStringTag_。

如果定义了，比如：

```js

function customStringTag() {
        ...
}

Object.defineProperty(a, Symbol.toStringTag, {
    get: customStringTag
});
```

那么返回 _"[object " + customStringTag.apply(a) + "]"_，否则返回 _"[object Object]"_，为 _toPrimitive(a)_ 的终值。

如果发现 _toPrimitive(a)_ 或者 _toPrimitive(b)_ 任一为字符串，则执行字符串拼接，否则执行数字加法，即 _toNumber(a) + toNumber(b)_，这也能解释 **true + true = 2** 的问题。

---

可见 _a + b_ 核心就是 _toPrimitive_ 操作，只不过从 ES2015 以来，_toPrimitive_ 受到 Symbol 的影响，变得越来越复杂。

相比之下，减号“-”就很简单了，就是执行 _toNumber(a) - toNumber(b)_。
