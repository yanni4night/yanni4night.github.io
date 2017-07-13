---
layout: post
title: "LESS-vs-SASS"
date: 2014-11-11
categories: sass scss less
---

基于[less](http://lesscss.org/) 2.0 与 [sass](http://sass-lang.com/) 3.5.7的官方文档对两者的功能和语法进行一些简单的比较.

###### Variable

两者都支持向_选择器名_、_属性名_、_属性值_和_字符串_中注入变量，并都支持数值变量的计算：

    
    //sass
    $left: left;
    $variable: variable;
    $num3px: 3px;
    $num5: 5;
    
    .#{$variable}{
        margin-#{$left}: $num3px + $num5;
        float: $left;
        content: "#{$variable}";
    }
    //less
    @left:left;
    @variable:variable;
    @num3px: 3px;
    @num5: 5;
    
    .@{variable}{
        margin-@{left}: @num3px + @num5;
        float: @left;
        content: "@{variable}";
    }

但只有sass支持字符串的连接：

    
    $hel:"hel";
    $lo:"lo";
    $hello: $hel + $lp;

在sass中，变量更复杂的[类型](http://sass-lang.com/documentation/file.SASS_REFERENCE.html#data_types)的，同时提供了如 `!default` 和 `!global` 标记。

###### @import

两者的 `@import` 指令都默认引入同类型的.less/.scss 文件，同时也支持嵌套：

    .mark{
        @import "item";
    }

都输出：

    
    .mark .item{}

如果要被引入的是一个 css 文件，sass 不执行任何操作，less 可以根据[指令](http://lesscss.org/features/#import-directives-feature-file-extensions)执行多种操作，例如，可以将 css 当做 less 处理：

    
    @import (less) "common.css";

或者直接引入不执行任何处理操作：

    
    @import (inline) "common.css";

###### @media

两者都支持媒体查询选择器提升：

    
    .wrap{
        @media screen{
            .item{
                color: red;
            }
        }
    }

输出：

    
    @media screen {
        .wrap .item {
            color: red;
        }
    }

###### Extend

两者都支持extend：

    
    //less
    .wrap{
        &:extend(.on);
    }
    .on{font-size:10px;}
    
    //sass
    .wrap{
        @extend .on;
    }
    .on{font-size:10px;}

输出：

    
    .wrap .on{font-size:10px;}


sass 实现了 `!optional` 标记用以屏蔽错误。

###### Mixins

两者都支持mixin：

    
    //less
    .fork(){font-size:20px;}
    .banner{
        .fork;
    }
    
    //sass
    @mixin fork(){font-size:20px;}
    .banner{
        @include fork;
    }

对于 sass，必须使用 `@mixin` 指令定义一个 mixin，个人感觉 less 更方便一些，直接写入选择器名，也不需要 `@include` 指令，特别是 mixin 本身去掉圆括号之后也可以作为一个合法的css选择器。


###### 判断

都支持判断：

    
    //less
    @tick:1;
    & when(@tick<5){
        .tick{
            & when(@tick<5){
                color:red;
            }
            font-size: 10px;
        }
    }
    
    //sass
    $tick:1;
    @if $tick < 5{
        .tick {
            @if $tick < 5{
                color:red;
            }
            font-size: 10px;
        }
    }

###### 循环

less 仰赖判断实现循环：

    //less
    .loop(@counter) when (@counter > 0) {
        .loop((@counter - 1));
        .item-@{counter}{
            left: (10px * @counter);
        }
    }
    
    .loop(5);

sass 实现了 `@for` 指令：

    
    //sass
    @for $counter from 1 through 5{
        .item-#{$counter}{
            left: #{$counter * 10px};
        }
    }

除此之外，sass 还实现了功能强大的 `@each` 和 `@while` 指令，这是 less 做不到的。

#### 总结

less 与 sass 在常规功能上不相上下，less 可能稍稍略逊一点，不过书写上要相对简洁。一些 sass 的实现比如 `@at-root` 个人认为用处不大，使用反倒增加了阅读代码的难度。从环境部署上看，sass 需要 [ruby](https://www.ruby-lang.org/zh_cn/) 环境，而 less 基于 js，相对更容易在多种环境中使用。

CSS 预处理器的使用要以简化书写 CSS 和清晰展示选择符层次为重，从这点上来讲，并不需要太复杂的功能，我比较倾向于使用 less。
