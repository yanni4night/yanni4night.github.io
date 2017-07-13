---
layout: post
title: "如何定义 redux 的 action"
date: 2016-03-13 23:02:38 +0800
categories: redux action
---

虽然 redux 的模型非常简单，但如何对其理解不深，在实际的业务研发中很容易迷失，比如会纠结该如何定义枚举的 `Action Type`。

<!-- more -->

传统的不加任何设计思想的应用经常是这样的：

```javascript
var App = {
    $container: $('#container').html(),
    cache: [],
    isLoading: false,
    init: function (opt) {
        this.opt = opt;
    },
    render: function () {
        this.$container.html({data: this.cache.slice(0, 5), isLoading: isLoading}});
    }
};
```

也就是说，我们经常会把应用的状态属性和显示的数据混淆在一起，数据只有一份，但视图在不同的位置可能是各种各样的，这需要我们维护多份视图数据。

在 Redux 中，我们只需要在 store(state) 中定义最原始的状态数据即可，_对该数据任何一部分的改变即可定义为一个Action__，而将状态数据转化成视图数据的逻辑可以定义在 `mapStateToProps` 函数中，这是一个 [redux-react](https://github.com/reactjs/react-redux) 中的函数。总之，视图数据应该和状态数据保持分离，并维持状态数据的简洁性，从而使得 Action 的定义更清晰。