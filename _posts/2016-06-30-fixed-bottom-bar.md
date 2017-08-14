---
layout: post
title:  "再谈移动 Web 上的吸底布局"
date:   2016-06-30 12:20:39 +0800
categories: css
---

吸底布局也就是固定在页面底部，无论页面本身滚动到哪了。其最佳实现方式是使用 *position:fixed*，然而对于移动端来讲坑要多得多。

如果仅仅是吸顶的话，也就是对 fixed 的支持，也存在悲惨的过去，比如 Android 2.x 只有在特定的 viewport 设置下才会生效，iOS 在 8 以前要么不支持要么带有明显的漂移 bug。现在好多了，较新的版本都能很好地支持。

<!-- more -->

但对吸底来讲还不一样，就是因为 **软键盘是从底部弹起的**。

软键盘弹起后，吸底的元素应该具有怎样的行为呢，这没有规范说明，于是 iOS 与 Android，Android 的不同版本之间，都各行其是。分歧在于，软键盘并非当前软件的一部分，如果它弹起了，页面的 *window* 大小到底变没变呢？

比较一致的是，两个平台上 *resize* 事件都没有被触发。但在部分 Android 机型上，如果页面的内容不能填充屏幕的高度，则页面确实会缩短，即 *document.body.scrollHeight* 会变小。其它 Android 和 iOS 则不会改变。

iOS 在软键盘弹起后非常一致地都将吸底的元素留在原处，并没上浮到键盘上面，而一些 Android 则会上浮。

两种策略很难说谁对谁错，iOS 可能有充足的理由不上浮：
 - window 大小并没有变；
 - 上浮可能导致内容区被遮挡

但很多人的第一印象是应该要上浮，就像部分 Android 做的那样。在 window 尺寸未变时，这反倒成了一种奇怪的行为，毕竟 fixed 不代表 *always-visible*。

如果不依赖 fixed，使用 JavaScript 动态计算的话，需要知道软键盘的高度，在 iOS 上一些客户端的内嵌 Webview 中，这是可能的，因为键盘弹起后 *window.innerHeight* 这个值变化了，等于真正可视区域的高度。于是我们可以这样做：

```css
    .bottom{
            height: 40px;
            background-color: red;
            width: 100%;
            position: fixed;
            bottom: 0;
            left: 0;
            transition: all .3s;
        }
```

```js
function fix() {
    var t = Math.min(document.body.clientHeight, document.body.scrollHeight) - document.body.scrollTop - window.innerHeight;

    $('.bottom').css({
        'position': 'absolute',
        'bottom': t
    });
}
```

fixed 已经被 absolute 代替，动态计算 *.bottom* 元素相对于 body 的距离。注意当内容不足时，body 的高度要小于屏幕的高度。

效果看下面的影片：

<video src="/images/fixed/fixed.mp4" controls="controls" preload="preload" width="360" height="640"></video>

不过这不但仅适用于 iOS，也仅在部分客户端上有效，Safari 是无效的。关于这种对吸顶元素的需求，应该还是避免。