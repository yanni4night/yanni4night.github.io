---
layout: post
title: "Redux 的黑魔法"
date: 2016-03-10 15:45:10 +0800
categories: js
---

相信很多人接触 [Redux](https://github.com/reactjs/redux) 时都会被它奇怪的 API 搞得云里雾里。这里不再冗述 Flux 架构的思想，实现 Flux 的工具有很多，它们只是在实现这种编程模式，并不会有太复杂的逻辑。事实也是这样，Redux 的 API 非常少，但并不一定容易理解。

<!-- more -->

## createStore

`createStore` 没什么好说的，创建 `Store`，但其参数值得一提——一个称为 `reducer` 的函数。reducer 函数接受两个参数，`state` 与 `action`，依据 action 对 state 进行复制更新并返回：

```javascript
const store = createStore((state = {counter: 0}, action) => {
    switch(action.type) {
        case 'add':
            return Object.assign({}, state, {counter: state.counter + 1});
        case 'minus':
            return Object.assign({}, state, {counter: state.counter - 1});
        default:
            return state;
    }
});
```

## combineReducers

辅助函数，分解 reducer 之用。如：

```javascript
// 分解前
const reducer = (state = {counter: 0, status: 'idle'}, action) => {

};
createStore(reducer);
// 分解后
const counter = (state = 0, action) => {};
const status = (state = 'idle', action) => {};
createStore(combineReducers({counter, status}));
```

可见 `combineReducers` 只不过把 state 的各个属性分解开来进行处理，再把处理后的数据合并起来。

## applyMiddleware

一种 _store enhancer_，使用 compose 来强化 createStore 的能力。这一个理解起来非常绕的函数。它允许对 createStore 进行多层包装，并修改了返回的 store 对象，可以在 dispatch 操作前后执行其它逻辑，有点类似 AOP 的感觉。事实上只要包装 dispatch 方法就能实现这些功能，也印证了 [Redux文档](http://cn.redux.js.org/docs/api/applyMiddleware.html) 的这句：

_Middleware only wraps the store’s dispatch function. Technically, anything a middleware can do, you can do manually by wrapping every dispatch call, but it’s easier to manage this in a single place and define action transformations on the scale of the whole project._

## bindActionCreators

辅助函数：

```javascript
function addTodoActionCreator(text){
    return {
        type: "add",
        text: text
    };
}

// 调用 bindActionCreators(addTodoActionCreator, dispatch) 后

function addTodoAction(text){
    dispatch({
        type: "add",
        text: text
    });
}
// 这样可以直接调用addTodoAction来派发 Action。
```

我们也可以实现自己的 `bindActionCreators`：

```javascript
function bindActionCreators (actionCreators, dispatch) {
    if('function' === typeof actionCreators) {
        return function () {
            dispatch(actionCreators.apply(arguments));
        };
    } else {
        let ret = {};
        for (let e in actionCreators) {
            if('function' === typeof actionCreators[e]) {
                ret[e] = bindActionCreators(actionCreators[e], dispatch);
            }
        }
        return ret;
    }
}
```

## compose

辅助函数，用以解构深度嵌套函数，体现了[柯里化](https://zh.wikipedia.org/zh-cn/%E6%9F%AF%E9%87%8C%E5%8C%96)的编程模式，如：

```javascript
 function $1 (func) {
    return function () {
        return func.apply(null, arguments)+ '1'；
    };
}

function $2 (func) {
    return function () {
        return func.apply(null, arguments) + '2';
    };
}

function $3 (num) {
    return num;
}

$1($2($3))(3);// 321

(compose($1, $2, $3))(3)// 321
```

你也可以实现自己的 `compose`：

```javascript
function compose () {
    const args = Array.prototype.slice.call(arguments).reverse();
    let tmp = args[0];
    if (!tmp) {
        return function (a) {
            return a;
        }
    }
    for( let i = 1; i < args.length; ++i){
        tmp = (args[i])(tmp);
    }
    return tmp;
}
```



-------------

除了 `Store` 对象的方法外，这五个 Redux 的核心函数中有三个为辅助函数，执行各种“魔法”操作，如果没有这些预定义的函数，可能会增加冗余代码量，但绝不会影响你实现 Flux。

除了不十分常用并且仍可自实现的 `applyMiddleware` 之外，只有 `createStore` 为刚需函数，因此可见调用 Redux 并不复杂。这可能要联系到 Flux 架构这种单向的数据流转方式，对于解耦业务逻辑十分简单并且凑效。