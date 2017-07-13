---
layout: post
title:  "hasOwnProperty与in"
date:   2014-09-06
categories: hasownproperty in
---

`hasOwnProperty` 与 `in` 都可以用来判断一个对象的成员是否存在，但有很大的区别，前者不会搜索对象的原型链中的成员，但后者会；前者是 Object 原型中的函数，后者是 Javascript 操作符等。关于第一中区别，可以通过阅读 [ECMAScript](http://www.ecma-international.org/publications/standards/Ecma-262.htm) 规范来了解其细节。



###### hasOwnProperty

[ECMA-262 3rd edition](http://www.ecma-international.org/publications/files/ECMA-ST-ARCH/ECMA-262 %203rd%20edition %20December%201999.pdf) 对 `hasOwnProperty` 的描述非常简单：“返回对象（不包括原型链）中是否有该成员”。该版本针对对象成员定义了四个属性：`ReadOnly`、`DontEnum`、`DontDelete`、`Internal`。

[ECMA-262 5.1rd edition](http://ecma-international.org/ecma-262/5.1/) 重新定义了成员属性，提供了更灵活的访问权限。在该版本中，[对象成员](http://ecma-international.org/ecma-262/5.1/#sec-8.6.1)分为“数据成员(Data Property)”和“存取成员(Accessor Property)”两种。前者包含属性：`Value`、`Writable`、`Enumerable`、`Configurable`，后者包含`Get`、`Set`、`Enumerable`、`Configurable`。对于不同的成员定义方式，其类型自然也不同。

    var o = {
        a:1 //Data Property
        set b(){} //Accessor Property
        get c(){} //Accessor Property
    };
    o.d = 1;//Data Property
    o.__defineSetter('m'  function(m){});//Accessor Property
    o.__defineGetter('n'  function(n){});//Accessor Property
    Object.defineProperty(o 'e' {});//Data Property
    Object.defineProperty(o 'e' {set:function(){}});//Accessor Property
    Object.create(null {f:{}});//Data Property
    Object.create(null {f:{set:function(){}}});//Accessor Property

需要注意的是不能同时定义“value”与“set/get”。


ES5 中的 `hasOwnProperty` 需要访问一个内部方法：`GetOwnProperty`，该方法返回一个新的[属性描述符(Property Descriptor )](http://ecma-international.org/ecma-262/5.1/#sec-8.10)，或者是“数据成员”或者是“存取成员”。对于字符串来说，它有一个自己的 [GetOwnProperty](http://ecma-international.org/ecma-262/5.1/#sec-15.5.5.2)方法，允许以数字作为 property name，代表在指定位置上是否存在字符，该值不超过字符串长度减一。该方法仅返回“数据成员”格式，因为字符串是不可变的。


###### in

`in` 操作符只能用于对象而非简单类型，它调用内部方法 `HasProperty`，该方法递归搜索原型链，直到找到对应的成员。在 ES5 中，该方法还涉及另一个内部方法：`GetOwnProperty`。因此对于字符串，下面的表达式返回真：

    
    2 in new String('abc')



###### 总结

判断一个对象 O 是否携带有成员 P，一般可以：

    undefined === O.P

但对于值为 `undefined` 的成员无效，这时就需要使用 `in` 操作符：
    
    var Class = function(){this.P = undefined;};
    Class.prototype = {Q:undefined;};
    var O = new Class();

    !!O.P;//false
    !!O.Q;//false
    'P' in O;//true
    'Q' in O;//true
    O.hasOwnProperty('P');//true
    O.hasOwnProperty('Q');//false
