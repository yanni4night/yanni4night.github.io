---
layout: post
title:  "Error in JavaScript"
date:   2014-09-07
categories: error exception throw try catch 异常
---


类似于 [Java](http://zh.wikipedia.org/wiki/Java) 语言中将异常（Exception）分为 `CheckedException` 和 `RuntimeException`一样，[ECMA262](http://www.ecma-international.org/publications/standards/Ecma-262.htm) 定义 [Error](http://www.ecma-international.org/ecma-262/5.1/#sec-16) 分为“早期错误（early error）”与“运行时错误（runtime error）”。

“早期错误”意即能够在程序进行任意构造求值操作之前检测到并报出的错误，包含下面几类：

 1. 语法错误；
 2. 对同一个属性定义多个 setter 或多个 getter；
 3. 对同一个属性同时定义 value 和 setter/getter；
 4. 正则表达式语法错误；
 5. [严格模式](http://www.ecma-international.org/ecma-262/5.1/#sec-10.1.1)中有 重复的属性赋值；
 6. [严格模式](http://www.ecma-international.org/ecma-262/5.1/#sec-10.1.1)中使用 [wi th](http://www.ecma-international.org/ecma-262/5.1/#sec-12.10) 关键字；
 7. 独立[严格模式](http://www.ecma-international.org/ecma-262/5.1/#sec-10.1.1)下的 函数定义中具有重复的参数定义；
 8. `return`，`break` 和 `continue` 的不合适使用；
 9. 向非引用赋值

 除了这些错误以外都属于运行时错误，不同的错误类型将会对程序带来一定的影响，例如：

    
    <script>var i =0  j = 0;</script>
    <script>
        ++i;
        syntax error
    </script>
    <script>
        ++j;
        throw new Error('runtime error');
    </script>
    <script>
        console.log(i + '/' + j);//0/1
    </script>

内建的 Error 包含下面几种类型：

 - EvalError
 - InternalError
 - RangeError
 - ReferenceError
 - SyntaxError
 - TypeError
 - URIError

###### 参考

 - <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error>
 - <http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx>