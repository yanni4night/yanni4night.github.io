---
layout: post
title: "沙箱是如何工作的"
date: 2023-01-14 11:32:48 +0800
categories: 微前端
---

## 一、前言

从 _qiankun_ 开始，沙箱（或沙盒、sandbox）已经成了几乎所有微前端框架的标配功能。但事实上其内部涉及实现的大量细节，导致每家的能力参差不齐。

严格来说，沙箱并没有遵循的标准，在一些细节上的实现也没有对错，具体行为还是要取决于业务的需求。

_Node.js_ 的<a href="https://nodejs.org/dist/latest-v18.x/docs/api/vm.html" target="_blank">vm 模块</a>并不能直接移植到浏览器端，一个很大的原因在于浏览器涉及的视图（包括 DOM、URL）无法被拷贝，只能共享，那么共享到什么水平就成了沙箱方案能力差别的衡量标准之一。

## 二、变量隔离

沙箱的基础能力就是隔离上下文，让下列操作都只局限在特定的上下文内，不会干扰到外部：

- 删除已有变量，如 _delete obj.a_ 或 _Relect.deleteProperty(obj, 'a')_ ；
- 修改已有变量
  - 修改取值，如 _obj.a=1_ 或 _Reflect.set(obj, 'a', 1)_ 或 _Reflect.defineProperty(obj, 'a', { value: 1 })_
  - 修改描述符，如 _Reflect.defineProperty(obj, 'a', { writable: false })_
  - 修改 frozen、sealed、extensible 状态，如 _Object.freeze(obj.a)_ 、 _Object.seal(obj.a)_ 或 _Object.preventExtensions(obj.a)_
  - 修改原型链，如 _Object.setPrototypeOf(obj.a, null)_
- 创建新的变量，如 _obj.a=1_ 或 _Relect.defineProperty(obj, 'a', {value: 1})_

上面的 **obj** 对象即指上下文对象，在浏览器中通常是 _window_ 或 _document_ ，这两个全局对象。但事实上，window 下的所有属性都可以直接取到，如 _addEventListener_ 、 _name_ 、 _CSS_ 、 _location_ 、 _history_ 、 _navigator_ 、 _HTMLElement_ 等等，不胜枚举。因此， **沙箱不可能监视所有变量的属性删除/修改/创建，因此也就不可能实现“完美”沙箱** ，毕竟你不能遍历 window 下的所有属性，都监视一遍。

**with(){}** 的做法不在考虑范围之内，对性能损耗过大。

这个事实带来的后果是，如果你想逃逸出沙箱，是非常容易的，比如 _navigator.no=1_ 。所以，沙箱在微前端中有使用价值的前提是， **你必须尽可能保障对全局变量的访问是可控、无副作用的** ，这是沙箱的脆弱之处，也是一种规范。接下来我们将在这一规范下继续讨论沙箱的实现问题，假设我们只考量对 window 和 document 这两个变量的属性监视。

### 2.1 属性监视

毫无疑问，在现代浏览器中，Proxy 是监视对象的最佳方案，通过它，我们应该可以被通知且控制获取、修改、删除、遍历等几乎所有操作。但是，proxy 对象真的可以为所欲为吗？

观察下列代码：

<iframe width="100%" height="500" src="//jsfiddle.net/yanni4night/xms2nkpa/15/embedded/js,result/" allowfullscreen="allowfullscreen" allowpaymentrequest frameborder="0"></iframe>

这里涉及到了关于 _configurable_ 导致的错误，事实上，有大量的操作都是被 proxy 所禁止的，在 _ECMA262_ 上的<a href="https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-proxy-object-internal-methods-and-internal-slots">Proxy</a>部分搜索 **Invariants** 能查询得到。因此 proxy 对象并非无所不能，它无法任意伪装原始对象的行为， **该失败的必须失败** 。相关规则包括如下：

<table class="table">
    <thead>
        <th>对象操作</th>
        <th>不变量</th>
    </thead>
    <tbody>
        <tr>
            <td>defineProperty</td>
            <td>
                <ol>
                    <li>如果目标对象是不可扩展的，那么使用defineProperty新增属性时不能返回true；</li>
                    <li>如果目标对象没有不可配置属性a，则代理对象也不能用defineProperty在将属性a定义成不可配置时时返回true；</li>
                    <li>如果目标对象没有不可配置且不可写的属性a，则代理对象也不能用defineProperty在将不可配置属性a定义成不可写时返回true</li>
                </ol>
            </td>
        </tr>
        <tr>
            <td>deleteProperty</td>
            <td>
                <ol>
                    <li>如果目标对象有不可配置属性a，那么代理对象在用deleteProperty删除a时不能返回true；</li>
                    <li>如果目标对象是不可扩展的，且有属性a，那么代理对象在用deleteProperty删除a时不能返回true；</li>
                </ol>
            </td>
        </tr>
        <tr>
            <td>get</td>
            <td>
                <ol>
                    <li>如果目标对象有不可配置且不可写的属性a，那么代理对象在用get取值a时必须返回和目标对象相同值；</li>
                    <li>如果目标对象的属性a是不可配置的，且是缺少get的存取类型，那么代理在用get取值a时必须返回undefined</li>
                </ol>
            </td>
        </tr>
        <tr>
            <td>getOwnPropertyDescriptor</td>
            <td>
                <ol>
                    <li>如果目标对象有不可配置的属性a，那么代理对象在用getOwnPropertyDescriptor获取a时不能返回undefined；</li>
                    <li>如果目标对象是不可扩展的，且有属性a，那么代理对象在用getOwnPropertyDescriptor获取a时不能返回undefined；</li>
                    <li>如果目标对象是不可扩展的，且没有有属性a，那么代理对象在用getOwnPropertyDescriptor获取a时必须返回undefined；</li>
                    <li>除非目标对象有不可配置且不可写的属性a，那么代理对象在用getOwnPropertyDescriptor获取a时就不能是不可配置且不可写的；</li>
                </ol>
            </td>
        </tr>
        <tr>
            <td>getPrototypeOf</td>
            <td>
                <ol>
                    <li>如果目标对象是不可扩展的，那么代理对象在用getPrototypeOf时必须返回与在目标对象上调用的返回值</li>
                </ol>
            </td>
        </tr>
        <tr>
            <td>has</td>
            <td>
                <ol>
                    <li>如果目标对象有不可配置的属性a，那么代理对象在用has获取a时不能返回false；</li>
                    <li>如果目标对象是不可扩展的，且有属性a，那么代理对象在用has获取a时不能返回false；</li>
                </ol>
            </td>
        </tr>
        <tr>
            <td>ownKeys</td>
            <td>
                <ol>
                    <li>如果目标对象是不可扩展的，那么代理对象在用ownKeys时必须返回目标对象的全部属性名，不能包含额外属性名</li>
                </ol>
            </td>
        </tr>
        <tr>
            <td>set</td>
            <td>
                <ol>
                    <li>如果目标对象有不可配置且不可写的属性a，那么代理对象就不能用set给a设置不同的值；</li>
                    <li>如果目标对象的属性a是不可配置的，且是缺少set的存取类型，那么代理在用set设值a时必须返回false</li>
                </ol>
            </td>
        </tr>
    </tbody>
</table>

看似复杂，但实际总结来看，就是代理对象必须遵循一个原则： **操作的结果要真实反应 target 的最新状态。**

举几个例子：

 + 如果Reflect.has(proxyObj, 'a')返回true，那么target就必须不能有一个不可配置的属性a；
 + 如果Reflect.set(proxyObj, 'a', 1)返回true，那么target对象必然不能是不可扩展的，也不可以有一个不可写也不可配置的属性a

如下的做法，直接代理原始 window、document 肯定是不可以的，根据上面的 Invariants 可知我们几乎必须把属性同步给原始的 window、document 才能不报错，显然违背我们做沙箱的初衷。

```ts
const proxy = new Proxy(window, {});
```

因此，通常的做法是把一个 **新创建的对象** 当作原始对象进行代理，下文简称为 **target** 。

```ts
const target = {};
const winProxy = new Proxy(target, {});
```

所有的操作几乎都是最终体现在 target 对象上的，个别稍有例外。

```ts
const target = {} as Window;

const winProxy = new Proxy(target, {
    defineProperty: function (target: Window, p: PropertyKey, attributes: PropertyDescriptor): boolean {
        return Reflect.defineProperty)(target, p, attributes);
    },
    deleteProperty: function (target: Window, p: PropertyKey): boolean {
        return Reflect.deleteProperty(target, p);
    },
    get: function (target: T, p: PropertyKey /*, receiver: any */): any {
        return Reflect.get(target, p);
    },
    getOwnPropertyDescriptor: function (target: T, p: PropertyKey): PropertyDescriptor | undefined {
        return Reflect.getOwnPropertyDescriptor(target, p);
    },
    has: function (target: T, p: PropertyKey): boolean {
        return Reflect.has(target, p);
    },
    ownKeys: function (target: T): ArrayLike<string | symbol> {
        return Reflect.ownKeys(target);
    },
    set: function (target: T, p: PropertyKey, value: unknown /*, receiver: unknown */): boolean {
        return Reflect.set(target, p, value);
    },
    getPrototypeOf() {
        return Reflect.getPrototypeOf(window);
    }
});
```

但显然这样是有严重问题的，因为 target 是伪装的 Window 对象，它身上没有任何属性，这不但会影响 get、getOwnPropertyDescriptor、has、ownKeys 这些只读操作的结果，由于 Proxy 的规则，同样也会影响 defineProperty、deletePrperty、set 这些写操作的结果。

举个例子，本来真实 window 对象上有一个不可配置的属性 foo，正常来说，我们用 defineProxy 修改其描述符类型时一定会报错，但是 target 本身并没有任何属性，Reflect.defineProperty(target)却是成功的，不符合期望。

于是，业界常规的做法都是会把 **原始对象的自身属性拷贝到 target 中，特别是那些不可配置的属性** 。这样无论是读操作还是写操作，其结果都真实反应到了代码对象的 target 中，不会被任何 Proxy 原则所影响。

```ts
const target = {} as Window;

for (let key of Object.getOwnPropertyNames(window)) {
  const descriptor = Reflect.getOwnPropertyDescriptor(window, key);
  if (!descriptor.configurable) Reflect.defineProperty(target, p, descriptor);
}
```

这一步的成本稍高，但是又是必须的。在具体的实现策略上也可以区分为一次性拷贝和懒惰式拷贝，即用到某属性时才执行拷贝。

### 2.2 主动变量逃逸

虽然沙箱的关键作用就是为了限制变量的访问和变更范围，但是毕竟在同一个浏览器页面之下，难免有需要例外放行的 case。我们称这类变量为 exception 或者 escaped，这种功能称之为“主动变量逃逸”。

实现主动变量逃逸比较简单，以 set 和 get 操作为例：

```ts
const target = {} as Window;

const winProxy = new Proxy(target, {
  get: function (target: T, p: PropertyKey /*, receiver: any */): any {
    if (isEscaped(p)) {
      return Reflect.get(window, p);
    }
    return Reflect.get(target, p);
  },
  set: function (
    target: T,
    p: PropertyKey,
    value: unknown /*, receiver: unknown */
  ): boolean {
    if (isEscaped(p)) {
      return Reflect.set(window, p, value);
    }
    return Reflect.set(target, p, value);
  },
});
```

不过别忘记了 Proxy 的那些 Invariants 限制，上述这些操作的结果都要反应到 target 身上，所以最后还是得把原始对象（如 window）上的属性同步到 target 上。

```ts
const target = {} as Window;

const winProxy = new Proxy(target, {
  get: function (target: T, p: PropertyKey /*, receiver: any */): any {
    if (isEscaped(p)) {
      // 同步到target中
      Reflect.defineProperty(
        target,
        p,
        Reflect.getOwnPropertyDescriptor(window, p)
      );
      return Reflect.get(window, p);
    }
    return Reflect.get(target, p);
  },
  set: function (
    target: T,
    p: PropertyKey,
    value: unknown /*, receiver: unknown */
  ): boolean {
    if (isEscaped(p)) {
      // 同步到target中
      Reflect.defineProperty(
        target,
        p,
        Reflect.getOwnPropertyDescriptor(window, p)
      );
      Reflect.set(window, p, value);
      return Reflect.set(target, p, value);
    }
    return Reflect.set(target, p, value);
  },
});
```

### 2.3 函数属性上下文

上面提到，我们需要把原始对象（window、document）的属性同步到 target 对象中，Proxy 才会不受到 Invariants 的影响，能更真实的模拟读写操作。

我们看下面一个例子：

<iframe width="100%" height="300" src="//jsfiddle.net/yanni4night/nhtwo0x2/4/embedded/js,result/" allowfullscreen="allowfullscreen" allowpaymentrequest frameborder="0"></iframe>

再来看这样一个例子：

<iframe width="100%" height="300" src="//jsfiddle.net/yanni4night/1buvLtag/2/embedded/js,result/" allowfullscreen="allowfullscreen" allowpaymentrequest frameborder="0"></iframe>

有这样一类函数，它们只能在指定的上下文中执行，即便是 Proxy 也不可以，否则在 Chrome 下就会报告 **Illegal invocation** 错误。在 Firefox 和 Safari 上的错误信息会更通俗易懂一些。

目标没有很好的办法来解决这个问题，毕竟函数内部的逻辑是无法预测的，只能尽可能兼容。一些策略有：

- 如果属性名是 constructor，无需特殊处理；
- 如果属性名以大些字母开头， **认为它们是构造函数** ，无需特殊处理；
- 创建包装函数来锁定上下文:

```ts
const newValueInTarget = function (this: any, ...args: unknown[]): unknown {
  // 小写字母也可能是构造函数
  if (new.target) {
    return Reflect.construct(valueInRaw, args);
  }

  return Reflect.apply(valueInRaw, raw, args);
};
```

- 一些特殊属性的处理，例如 window 上的 eval、isFinite、isNaN、parseFloat、parseInt、hasOwnProperty、decodeURI、decodeURIComponent、encodeURI、encodeURIComponent，直接走主动变量逃生即可

## 三、执行 JavaScript 代码

上面讨论的是沙箱的最关键能力——变量隔离，但无论实现怎样的能力，子应用的 JS 代码还是要得到执行，那么该如何执行的？

### 3.1 eval

业界普遍的做法是异步 fetch 到源代码，然后 eval 它，虽然需要跨域环境的支持，但并不是难事。只是 eval 需要一些技巧。

首先，eval 需要在真正的 window 上下文中执行，避免调用环境的影响，这一点，目前已经有比较明确的实现方案，就是“间接调用”：

```ts
function evalScript(code: string): any {
  return ("", eval)(code);
}
```

其次，利用函数入参来改变一些全局变量名的作用域，将其指向既定的对象，比如：

```ts
evalScript(`;
    (function (window, self, parent, top, globalThis, document) {
        ${appCode}
    }).call(winProxy, winProxy.window, winProxy.self, winProxy.parent, winProxy.top, winProxy.globalThis, winProxy.document)`);
```

从这里也能看出，如果直接引用如 location、navigator、history 将无法被沙箱捕获，你需要用 window.location、window.navigator、window.history 的方法。进而可以推断出你在全局定义的变量，也必须以 window 属性的方式来读取，比如：

```html
<head>
  <title></title>
  <script>
    var loadStartTime = Date.now();
  </script>
</head>
<body>
  <script>
    var loadCost = Date.now() - loadStartTime;
  </script>
  <script src="./entry.js" entry></script>
</body>
```

像上面这种 case，如果不以 window.loadStartTime 的方式能不能读取得到呢？也有一些技巧可做到。

比如使用嵌套递归作用域的方式来实现，相当于每执行一次 JS 之后，就会为下一次执行生成一个新的嵌套上下文，这样后面的 JS 就可以直接读取上次的变量。

```ts
function() {
    var loadStartTime = Date.now();
    function() {
         var loadCost = Date.now() - loadStartTime;
    }
}
```

具体的实现机理稍有复杂，理论上也会带来额外的性能开销，而且对于下面这种双向访问的场景也无法支持：

```html
<head>
  <title></title>
  <script>
    var loadStartTime = Date.now();
    function sendLog() {
      // 访问未预定义变量
      sendToServer({ loadCost });
    }
  </script>
</head>
<body>
  <script>
    var loadCost = Date.now() - loadStartTime;
  </script>
  <script src="./entry.js"></script>
</body>
```

不过仍然具有一定的价值，对于以 HTML 作为 entry 的子应用的容纳范围更广，子应用的灵活度更高。

### 3.2 环境变量

有时，需要暴露给子应用的 JS 一些临时的虚拟变量，比如 qiankun 提供的 \_**\_POWERED_BY_QIANKUN\_\_** ，而且允许不同子应用读取到的同一名称的变量有不同的取值。

如果不开启沙箱的话，这一功能反而困难，需要在 window 上定义变量，然后以同步的形式运行子应用 JS 代码，最后在从 window 上移除掉。这个过程不但很可能和 window 上已经有的同名变量冲突，而且也只能保证同步代码中能读取到，异步代码中就读不到。举例说明：

```ts
if (window.__IN_MICRO_ENV__) {
  Promise.resolve().then(() => {
    console.log(window.__IN_MICRO_ENV__); // undefined
  });
}
```

在沙箱环境中，实现环境变量更简单，而且可以不受同步/异步的影响，可以持续访问。

```ts
evalScript(`;
    (function (window, document, __IN_MICRO_ENV__) {
        ${appCode}
    }).call(winProxy, winProxy.document, winProxy.__IN_MICRO_ENV__)`);
```

### 3.3 ESM

**ESM** 格式的 JS 代码不能直接 eval 来执行。事实上，浏览器还未提供能直接运行 ESM 源码的方法。Garfish 采取来将源码转换成 URI 的方式实现了一定程度的 eval 能力，但是需要正则匹配 import 指令，存在一定的隐患。即便如此，因为不能用函数直接封装 ESM 源码，因此也无法实现沙箱运行。因此，garfish 还实现了一套运行时转译 ESM 的机制，但是对性能有较大影响，相信其稳定性也存在安全隐患。

## 四、DOM 结构

一般来说，子应用有自认为的 DOM 环境，比如 html、body、head 以及#app 等等。

### 4.1 固定 DOM

在沙箱环境中，如果把真正的 html、body、head 暴露给子应用，那么它很有可能在上面做一些副作用的操作，比如插入新 DOM、修改样式等等。为了避免这种情况，微前端框架一般都会给子应用生成一个模拟的 DOM 结构，比如：

```html
<pseudo-html>
    <pseudo-head>
        <pseudo-title></pseudo-title>
    <pseudo-head>
    <pseudo-body></pseudo-body>
</pseudo-html>
```

DOM API 中的 **document.documentElement** 、 **document.body** 、 **document.head** 也都指向它们。

根据业务需求，可以做更深的伪装定制，通过以下测试：

```ts
document.documentElement.tagName === "HTML";
document.documentElement.nodeName === "HTML";
document.documentElement.version === "";
document.documentElement.parentNode === document;
document.documentElement.parentElement === null;
document.documentElement.constructor === HTMLHtmlElement;
document.documentElement instanceof HTMLHtmlElement === true;

document.body.tagName === "BODY";
document.body.nodeName === "BODY";
document.body.constructor === HTMLBodyElement;
document.body instanceof HTMLBodyElement === true;

document.head.tagName === "HEAD";
document.head.nodeName === "HEAD";
document.head.constructor === HTMLHeadElement;
document.head instanceof HTMLHeadElement === true;
```

注意 **document.documentElement.parentElement** ，如果等于 null，可能对一些视觉框架、组件库等需要用 parentElement 向上递归搜索的功能不友好。可根据需要是否开启以上伪装能力。

### 4.2 存量 DOM

存量 DOM 是指那些在子应用的 HTML entry 中已有的 DOM 结构，简单的如#app，也可能有更复杂的结构。

通常需要把它们同步到上述固定 DOM 的 body 中，也有些方案把 head 中的 meta 都同步了过来。

一旦需要拷贝，需要考虑如下问题：

- 非法元素、样式的过滤；
- 元素在沙箱环境的适配

### 4.3 新增 DOM

新增 DOM 有多种创建方式：

+ document.createElement()；
+ dom.clone()；
+ dom.innerHTML=

通常来说只有第一种会被沙箱接管，使得新创建的 DOM 的 ownerDocument、baseURI 是符合沙箱环境的。

需要特别关注的是，新创建的 script 元素会被转换成一个无实际功能的&lt;pseudo-script&gt;元素。框架会在后台自行下载/执行其代码，模拟了 script 的能力。

Custom Element默认是inline类型，除了在shadow DOM内部使用 __:host{display:block}__ 外，只能在外部用选择器覆盖。未来如果Safari支持<a href="https://caniuse.com/custom-elementsv1" target="_blank">继承built-in元素</a>后可以解决。

## 五、总结

- 沙箱只能处理有限范围内的变量隔离，通常为 window 和 document；
- 以 eval function 的方式执行 JS 源码，全局变量引用应以 window 属性的方式使用；ESM 无法支持沙箱；
- 子应用的 DOM 结构可以被伪装，但仍然能轻易实现逃逸

**沙箱的本质是为子应用打造一个微型的独立浏览器环境，受限于成本，无法做到尽善尽美，仍然需要子应用遵循一定的规范和约定** 。而由于微前端的主、子应用在管理上的独立性，往往沙箱能力的升级会对子应用造成较大的影响。

## 六、未来发展

业界对沙箱的实现均强依赖 Proxy 技术，区别仅在于对副作用的拦截能力多少。随着业务复杂度的提升，以及一些存量旧业务在遵循冲突约定的改造成本上的考虑，逐渐意识到 Proxy 的能力仍然有限，想实现健壮性更强的沙箱环境，开发成本高且性能不稳定。

业界已经有一些方案开始逐渐回归 iframe。iframe 天生具有强隔离性，不必对全局变量一一关注即可达到期望的隔离性能。不过这种一刀切的做法在实际的业务中仍然受到挑战，比如对主动逃逸变量的支持，比如对 DOM 的操作等等，仍然需要一定的机制将 iframe 和主页面整合到一起。这一步，仍然离不开 Proxy 的支持。

ECMA 已经有一个新的提案，叫做<a href="https://github.com/tc39/proposal-shadowrealm" target="_blank">ShadowRealm</a>，位于 Stage3，对于创建独立的 JS 执行环境是一个比较理想的方案。不过微前端离不开视图，如何共享视图对象以及控制共享的粒度，就不是 ShadowRealm 的范围了。
