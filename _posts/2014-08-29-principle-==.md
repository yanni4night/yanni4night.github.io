---
layout: post
title: "Javascript '==' 运算符原理"
date: 2014-08-29
categories: js
---

JavaScript 中的`==`运算符用以比较两侧的值是否“近似”相等，区别于`===`的严格相等。

`==`可以达到以下效果：

	null==undefined //true
	[]==false //true
	[]=='' //true
	[1]=='1' //true

要说明 JavaScript 引擎在计算 `==` 运算符时做了什么，先要了解几个内部概念和方法。

##### Type

ECMAScript 规范规定了六种变量类型：null undefined string number boolean object。`Type` 不同于运算符 `typeof` ，它可以分辨出 null 和 object，但不能分辨 function 和 object，当然事实上并没有 function 这样一种类型。

可以这样模拟 `Type` 的行为：

    function Type(e) {
        if (undefined === e) {
            return 'undefined';
        } else if (null === e) {
            return 'null';
        } else if ('number' === typeof e) {
            return 'number';
        } else if ('string' === typeof e) {
            return 'string';
        } else if ('boolean' === typeof e) {
            return 'boolean';
        } else return 'object';
    }


##### 0的符号

另外需要说明的是0本身包括两个值，正零：+0，和负零：-0。一般不会对这两个值进行区分，甚至使用 `===` 运算符也分辨不出：

    +0===-0 //true

在ECMAScript中有内部内部方法可以区别出这两个值，当然我们也可以做到这一点：

    function isPositiveZero(e) {
        return 0 === e && 1 / e > 0;
    }
    
    function isNegativeZero(e) {
        return 0 === e && 1 / e < 0;
    }

关于这两点将会在后面的侦断中用到。

##### ToNumber
转换为数字，规则如下：

|   输入类型    |                 结果                  |
| :-------: | :---------------------------------: |
| Undefined |                 NaN                 |
|   Null    |                 +0                  |
|  Boolean  |             真返回1，假返回+0              |
|  Number   |                直接返回                 |
|  String   |                字面意义                 |
|  Object   | 调用ToNumber(toPrimitive)，hint：Number |

##### toPrimitive

该内部方法将一个对象转换为原始类型，在上面提到的六种类型中，前五种都属于原始类型。对于非原始类型，将根据一个成为 `hint` 的值访问该对象的 `Default Value` 属性来获取原始值。`hint` 取值只能为 “string” 和 “number”（默认）。如果为 “string”，将依次调用对象的 `toString` 和 `valueOf` 来获取原始值，如果为 “number”，将依次调用 `valueOf` 和 `toString` 方法，可见顺序依赖于 `hint` 值。


#### `==`

`==` 操作x，y两个值时要经过一系列的类型和值的侦断，在 ECMAScript 内部称之为 `The Abstract Equality Comparison Algorithm`：

1. 如果 Type(x) 不同于 Type(y)  执行第 14 步。
2. 如果 Type(x) 为 Undefined  返回真。
3. 如果 Type(x) 为 Null  返回真。
4. 如果 Type(x) 不是 Number  执行第 11 步。
5. 如果 x 为 NaN  返回假。
6. 如果 y 为 NaN  返回假。
7. 如果 x 与 y 有相同的值  返回真。
8. 如果 x 为 +0 并且 y 为 −0  返回真。
9. 如果 x 为 −0 并且 y 为 +0  返回真。
10. 返回假。
11. 如果 Type(x) 为 String  那么如果 x 和 y 具有相同的字符序列（等长并且对应位置字符相同）返回真，否则，返回假。
12. 如果 Type(x) 为 Boolean  如果 x 和 y 都是真或者都是假则返回真，否则 返回假。
13. 如果x和y引用相同的对象返回真，否则  返回假。
14. 如果 x 为 null 并且 y 为 undefined  返回真。
15. 如果 x 为 undefined 并且 y 为 null  返回真。
16. 如果 Type(x) 为 Number 并且 Type(y) 为 String 返回 x == ToNumber(y) 的结果。
17. 如果 Type(x) 为 String 并且 Type(y) 为 Number 返回 ToNumber(x) == y 的结果。
18. 如果 Type(x) 为 Boolean  返回 ToNumber(x) == y 的结果。
19. 如果 Type(y) 为 Boolean  返回 x == ToNumber(y) 的结果。
20. 如果 Type(x) 为 String 或者 Number 并且 Type(y) 为 Object 返回 x == ToPrimitive(y) 的结果。
21. 如果 Type(x) 为 Object 并且 Type(y) 为 String 或者 Number 返回 ToPrimitive(x) == y 的结果。
22. 返回假。


有了这个流程，就可以知道上面提到的几个式子成立的原理：

    []==false

任意数组转换为布尔值时都为真，但与布尔值进行`==` 运算操作时，首先会将布尔转换为数字，即 false=>0，接着再与数组进行 `==` 运算。这时，需要进行 `toPrimitive([] Number)` 运算了，返回0，所以式子返回真。

    [1]=='1'

数组与字符串比较，直接转换为 `toPrimitive([1] String) == '1'`，显然为真。


##### 总结

在使用 `==` 进行操作之前，一定要明确两边值类型所带来的结果差异，必要时，直接强转为布尔值进行计算。

##### 测试

[该页面](/example/==.html)展示了比较两个不同类型值得过程中所发生的事情。

#### 参考

- <http://www.adequatelygood.com/Object-to-Primitive-Conversions-in-JavaScript.html>