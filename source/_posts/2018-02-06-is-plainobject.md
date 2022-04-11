---
layout: post
title:  "isPlainObject 的不同实现"
date:   2018-02-06 15:21:44 +08:00
categories: js
---

开头一个问题是：什么是 `Plain Object`？

并没有看到有官方去专门定义它，更可能它只不过是业界的一种通俗叫法，因此也没有严格的定义。但我们在汉语环境里通常叫它“纯对象”。

> 业界解释：<https://www.quora.com/What-is-a-plainObject-in-JavaScript>

下面我们来看一下常见 Library 对 *isPlainObject* 函数的实现。

## jQuery

jQuery 3.3 版本中的 *isPlainObject* 定义在[这里](https://github.com/jquery/jquery/blob/3.3.0/src/core.js#L208)。

为便于阅读，核心代码经过整理后如下：

```js
function isPlainObject(obj) {
    var proto, Ctor;

    // (1) null 肯定不是 Plain Object
    // (2) 使用 Object.property.toString 排除部分宿主对象，比如 window、navigator、global
    if (!obj || ({}).toString.call(obj) !== "[object Object]") {
        return false;
    }

    proto = Object.getPrototypeOf(obj);

    // 只有从用 {} 字面量和 new Object 构造的对象，它的原型链才是 null
    if (!proto) {
        return true;
    }

    // (1) 如果 constructor 是对象的一个自有属性，则 Ctor 为 true，函数最后返回 false
    // (2) Function.prototype.toString 无法自定义，以此来判断是同一个内置函数
    Ctor = ({}).hasOwnProperty.call(proto, "constructor") && proto.constructor;
    return typeof Ctor === "function" && Function.prototype.toString.call(Ctor) === Function.prototype.toString.call(Object);
}
```

## lodash

lodash 4.0.6 版本中的 *isPlainObject* 定义在[这里](https://github.com/lodash/lodash/blob/4.0.6-npm-packages/lodash.isplainobject/index.js#L125)。

基本与 jQuery 版本相同，多了一个 *Ctor instanceof Ctor* 的条件，满足此条件的仅有 *Function* 和 *Object* 两个函数。

```js
function isPlainObject(value) {
    if (!value || typeof value !== 'object' || ({}).toString.call(value) != '[object Object]' ) {
        return false;
    }
    var proto = Object.getPrototypeOf(value);
    if (proto === null) {
        return true;
    }
    var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
    return typeof Ctor == 'function' && Ctor instanceof Ctor && Function.prototype.toString.call(Ctor) === Function.prototype.toString.call(Object);
}
```

## redux

redux 从 4.0.0 开始在测试中使用了 *isPlainObject*，代码在[这里](https://github.com/reactjs/redux/blob/v4.0.0-beta.1/src/utils/isPlainObject.js#L5)。

它的实现比较简单。

```js
function isPlainObject(obj) {
  if (typeof obj !== 'object' || obj === null) return false

  let proto = obj
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }
  // proto = null
  return Object.getPrototypeOf(obj) === proto
}
```

---

我们并没有一个能判断 *Plain Object* 的清晰逻辑，大概能理出来的思路是：

1. 先判断 obj 本身是否满足我们熟悉的合法对象概念；
2. 判断 obj 的构造函数是不是 Object

至于判断 prototype 是不是 null，无非是一种 shortcut 罢了。