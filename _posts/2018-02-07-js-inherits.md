---
layout: post
title:  "JavaScript 中继承的实现"
date:   2018-02-06 21:37:24 +0800
categories: js
---

我们都知道 JavaScript 是通过原型链继承的，在不支持 class、extends 语法的环境里，继承又该如何实现呢？

首先我们来整理实现继承后的效果表征，假设存在两个类（函数）A 和 B，我们要实现 B 继承于 A，那么需要满足：

1. new B() instanceof A 为真；
1. B.prototype.constructor === B 为真；
1. 如果 A.foo = 1，则 B.foo = 1 为真，即静态变量可继承；
1. 在普通方法 foo 中可以调用 super.foo() 调用基类方法；
1. 在构造方法中可以调用 super() 调用基类构造方法

在很多年前，jQuery 作者 *John Resig* 曾写过一个继承的[实现](https://johnresig.com/blog/simple-javascript-inheritance/)，在那个还在 ES3 语法的时代已经非常难得。在今天看来，这种实现方式的语义已经远远落后，同时也不能实现静态变量。

---

下面我们来一步一步地去理解 babel 的实现方式。

首先定义两个类（函数），以及子类的实例：

```js
function A() {}
function B() {}

var b = new B();
```

想实现 B 继承于 A，那边必然 *b instanceof B* 为真，根据 instanceof 的意义，一定有：

```js
b.__proto__.__proto__... === A.prototype
```

我们知道：

```js
b.__proto__ === B.prototype
```

那么我们只需要：

```js
B.prototype.__proto__... === A.prototype
```

于是我们覆写 *B.prototype*：

```js
B.prototype = Object.create(A.prototype)
```

这样一定有 *A.prototype.isPrototypeOf(B.prototype)* 为真。

现在我们已经实现了：

```js
b instanceof A === true
```

也就是说第一条我们已经实现了，下面看第二条，只需要：

```js
B.prototype.constructor = B;
```

或者更优雅一些：

```js
B.prototype = Object.create(A.prototype, {
    constructor: {
        value: B,
        enumerable: false,
        writable: true,
        configurable: true
    }
});
```

现在我们要实现静态成员的继承：

```js
Object.setPrototypeOf(B, A);
```

目前为止，我们定义的是两个空类，现在我们为他们增加 name 属性：

```js
function A() {}
function B() {}

A.prototype = Object.create(null, {
    constructor: {
        value: A,
        enumerable: false,
        writable: true,
        configurable: true
    },
    name: {
        get: function() {
            return 'A';
        },
        enumerable: true,
        configurable: true
    }
});

B.prototype = Object.create(A.prototype, {
    constructor: {
        value: B,
        enumerable: false,
        writable: true,
        configurable: true
    },
    name: {
        get: function() {
            return 'B';
        },
        enumerable: true,
        configurable: true
    }
});

Object.setPrototypeOf(B, A);

console.log(new A().name); // => A
console.log(new B().name); // => B
```

现在我们要在 B 的 name 中获取父类的 name 属性，那么我们就需要找到 B.prototype 中的 name。

在 B 环境中，灵活的做法是通过 B.prototype 找到 A.prototype，根据 *B.prototype = Object.create(A.prototype)*，我们知道：

```js
A.prototype === Object.getPrototypeOf(B.prototype)
```

于是：

```js
function A() {}
function B() {}

A.prototype = Object.create(null, {
    constructor: {
        value: A,
        enumerable: false,
        writable: true,
        configurable: true
    },
    name: {
        get: function() {
            return 'A';
        },
        enumerable: true,
        configurable: true
    }
});

B.prototype = Object.create(A.prototype, {
    constructor: {
        value: B,
        enumerable: false,
        writable: true,
        configurable: true
    },
    name: {
        get: function() {
            var sup = Object.getPrototypeOf(B.prototype);
            var desc = Object.getOwnPropertyDescriptor(sup, 'name');
            return desc.get.call(this) + 'B';
        },
        enumerable: true,
        configurable: true
    }
});

Object.setPrototypeOf(B, A);

console.log(new A().name); // => A
console.log(new B().name); // => AB
```

这就实现了 super.name 的效果。当然，我们假设 B 的父类是定义了 name 的，如果没有找到 name，那应该沿着原型链继续向上寻找。因此更健壮的写法是：

```js
function A() {}
function B() {}

A.prototype = Object.create(null, {
    constructor: {
        value: A,
        enumerable: false,
        writable: true,
        configurable: true
    },
    name: {
        get: function() {
            return 'A';
        },
        enumerable: true,
        configurable: true
    }
});

B.prototype = Object.create(A.prototype, {
    constructor: {
        value: B,
        enumerable: false,
        writable: true,
        configurable: true
    },
    name: {
        get: function() {
            var sup = B.prototype, desc;
            do {
                sup = Object.getPrototypeOf(sup);
                if (!sup) {
                    break;
                }
                desc = Object.getOwnPropertyDescriptor(sup, 'name');
            } while(!desc);
           
            return (desc ? desc.get.call(this) : undefined) + 'B';
        },
        enumerable: true,
        configurable: true
    }
});

Object.setPrototypeOf(B, A);

console.log(new A().name); // => A
console.log(new B().name); // => AB
```

> 这里没有考虑 name 不是 getter 的情形，不过原理类似，不再冗述。

最后我们来实现在构造方法中调用 super()。显然，实质是在 B 函数中找到函数 A，根据 *Object.setPrototypeOf(B, A)*，我们有：

```js
function B() {
    Object.getPrototypeOf(B).call(this)
}
```

我们为 A 添加一个 age 构造参数：

```js
function A(age) {
    this.age = age;
}
function B(age) {
    Object.getPrototypeOf(B).call(this, age);
}

A.prototype = Object.create(null, {
    constructor: {
        value: A,
        enumerable: false,
        writable: true,
        configurable: true
    },
    name: {
        get: function() {
            return 'A';
        },
        enumerable: true,
        configurable: true
    }
});

B.prototype = Object.create(A.prototype, {
    constructor: {
        value: B,
        enumerable: false,
        writable: true,
        configurable: true
    },
    name: {
        get: function() {
            var sup = B.prototype, desc;
            do {
                sup = Object.getPrototypeOf(sup);
                if (!sup) {
                    break;
                }
                desc = Object.getOwnPropertyDescriptor(sup, 'name');
            } while(!desc);
           
            return (desc ? desc.get.call(this) : undefined) + 'B';
        },
        enumerable: true,
        configurable: true
    }
});

Object.setPrototypeOf(B, A);

console.log(new B(18).age); // => 18
```

于是，一个基本的继承的手写版本就实现了，当然，babel 还考虑了更多细节，比如构造方法有返回值的情况等等，但基本的继承原理就是这个样子。

下图很好地反应了诸多对象的关系。值得一提的是， *b* 也可能成为下一级类的 prototype，你可以清晰地看到通过 \_\_proto\_\_ 搜索原型链的轨迹。

![js-inherit](/images/inherits/inherit.jpg)

---

在现代浏览器的不断迭代下，已经有大部分版本都实现了对 class 关键字和继承的原生支持，相信在不久的将来，就无需在这么麻烦地实现继承了。无论如何，JavaScript 继承的原理仍然是不变的，上面这些内容有助于理解原型链是怎么样工作的。