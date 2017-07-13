---
layout: post
title:  "JavaScript中识别native方法"
date:   2014-04-21
categories: native built-in host-method
---

Js中一些本地(native/built-in)对象和方法是可以重写的，比如在针对低版本浏览器的编程中，我们使用：

    Array.prototype.forEach = function(item index arr){
        ...
    };

来对ES5中才定义的方法增加polyfill。这样可能会带来的一些潜在的隐患问题暂且不表，但我们可以像在现代浏览器中一样安全地使用`forEach`方法了（只要你实现地足够稳健）。

当在陌生的或不可控的环境中运行JavaScript代码时，你可能不相信可能被 'polyfill' 过的方法，比如`Array.prototype.every`，`Array.prototype.map` 或 `window.Promise`。这个时候，你需要识别你要使用的方法是一个 JavaScript 宿主环境的本地方法还是一个已经由别人 'polyfill' 过的方法。

不过似乎没有任何标准或草案规定自定义方法和 native 方法应该在行为上表现出任何不同。但可以想象，JavaScript 引擎一般由C++语言编写，似乎 native 方法无法打印出其源代码。

默认情形下，将一个函数对象转成String类型即可输出其源代码，同样将方法名作为参数传入`RegExp.prototype.test`也会先转成String，_John Resig_ 写的[js简单继承](http://ejohn.org/blog/simple-javascript-inheritance/)实现中即使用这种方式来识别`_super`单词的。因此对于自定义方法，会输出源码，那么对于 native 方法，目前主流浏览器很一致性地输出类似`function func_name() { [native code] }`的字符串，甚至[nodejs](http://nodejs.org/)也同样，具体回车换行各种环境实现有略微差异，Javascript 实现的 `DOM` 选择器[sizzle](http://sizzlejs.com/)总结了一个通用的正则表达式：

    /^[^{]+\{\s*\[native \w/
    
。通过对方法源码进行正则匹配来识别是本地方法与否。

这种通过源码进行识别的方式有一个问题，可以查看Ecma 262对于`Funtion.prototype.toString`的定义：

> An implementation-dependent representation of the function is returned. This representation has the syntax of a FunctionDeclaration. Note in particular that the use and placement of white space  line terminators  and semicolons within the representation String is implementation-dependent.

也就是说并未针对native方法做了特殊规定，甚至没有规定方法默认应该输出为其源码。在将来的实现中，对于native方法的默认字符串表示可能出现变化，特别是Google的[V8](https://code.google.com/p/v8/)引擎中越来越多地直接使用JavaScript语言本身来编写。

另一方面，这种方式强依赖于`toString`方法的默认行为，因此重写`toString`可以达到欺骗的效果，如：

    var s = Array.prototype.every = function(){
        return !!'this is a fake forEach!';
        };

    s.toString = function(){
        return 'function every(){[native code]}';
    };
    
    //true but it shouldn't
    /^[^{]+\{\s*\[native \w/.test(s);

一个自定义方法通过了检测。虽然这是一个极端的例子，但对于未有明确标准定义的，特别是将来有可能发生行为改变的内容，最好的使用方式就是不依赖于这种非标准的，不稳定的特性。

[这里](http://perfectionkills.com/detecting-built-in-host-methods/)有一篇比较老的文章，其内容揭示了确实有老版本的Safari浏览器无法通过上面的正则表达式检测。
