---
layout: post
title: "Javascript '+' 运算符原理"
date: 2018-03-23 15:02:57 +0800
categories: js
---

继了解完“==”的原理后，再来了解一下加号“+”的 ECMAScript 实现原理。

例如：

```js
a + b
```

第一步，对 a 和 b 执行 *toPrimitive()*，不指定 [hint](https://tc39.github.io/ecma262/#sec-ordinarytoprimitive)。

以 *toPrimitive(a)* 为例，先看 a 有没有定义 *Symbol.toPrimitive*，比如：

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

如果定义了 *Symbol.toPrimitive* 属性，则执行：

```js
customToPrimitive.call(a, 'default')
```

否则执行原生 *toPrimitive("number")*，也就是要依次调用 a 的 *valueOf* 和 *toString* 方法。

如果执行 *a.valueOf()* 返回不是 Object，则为 *toPrimitive(a)* 的终值，否则执行 *a.toString()*。

接下来，看 a 有没有定义 toString，如果有，则执行 *a.toString()*，为 *toPrimitive(a)* 的终值。

如果没有，则执行原型链顶端的 *Object.prototype.toString*,这首先要看 a 有没有定义 *Symbol.toStringTag*。

如果定义了，比如：

```js

function customStringTag() {
        ...
}

Object.defineProperty(a, Symbol.toStringTag, {
    get: customStringTag
});
```

那么返回 *"[object " + customStringTag.apply(a) + "]"*，否则返回 *"[object Object]"*，为 *toPrimitive(a)* 的终值。

如果发现 *toPrimitive(a)* 或者 *toPrimitive(b)* 任一为字符串，则执行字符串拼接，否则执行数字加法。

---

可见 *a + b* 核心就是 *toPrimitive* 操作，只不过从 ES2015 以来，*toPrimitive* 受到 Symbol 的影响，变得越来越复杂。

相比之下，减号“-”就很简单了，就是执行 *toNumber(a) - toNumber(b)*。