---
layout: post
title:  "数学方法解释 dpr/scale/rem 三者的关系"
date:   2015-12-30 16:59:04 +0800
categories: dpr scale rem viewport
---

开发过移动端页面的同学一定听过 `dpr`、`scale`、`rem` 三个概念。最起码，也会用过 `scale`，如
    
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

因为如果你不设置这一行，几乎所有的移动端浏览器都会把宽度设置为 `980px`，页面上的文字变得太小而难以阅读。

那么，这三者究竟有着怎样的关系呢？

首先从需求讲起。

移动端设备的屏幕尺寸千差万别，即便设计师能够提供每一种尺寸下的 UE 图，工程师也无法做到针对每种场景的适配。一般地，作为近似，在技术上可以使用媒体查询（media query）的方式将屏幕尺寸划分为几个等级，不同等级下使用不用的CSS样式。

但这显然不够精确，在不同设备上很难做到体验一致，不但代码难以维护，同时存在着被设计师吐槽的风险。

如何在不同的屏幕上完美还原设计图，同时兼顾有限的人力与时间？

由此我们可以提出需求：
 1. 设计师只输出一套基准尺寸的 UE 图；
 2. 通过页面缩放还原 UE 图的设计比例

这有两种方案：
 1. 使用 rem 为单位设置各个元素的尺寸；
 2. 设定一个固定的页面宽度，所有元素可以使用 px 设定尺寸，然后缩放整个页面

我们分开来讲讲这两种方案。

## 第一种方案，rem

我们经常看到业界的大致方案是：

>将 `scale` 设置为 `1 / dpr`，`<html>` 的 `font-size` 计算为 `screen.width * dpr / >10`，然后在以 `less` 将UE图上得到的尺寸透明转换为对应的 `rem` 值。

由于 `rem` 是比例值，因此能做到最终每个元素的尺寸相对于 UE 图的比例都是一致的。

那么，问题是，上面的公式是怎么得到的？

### 分析

我们来用最基本的数据算式推导一下。

设基准 UE 的图宽为 `ue_w`，`<html>` 的 `font-size` 值为 `ue_fs px`。

在 PSD 上量得一个元素的宽度为 `psd_w px`，等于 `psd_rem`，即：

    psd_rem * ue_fs = psd_w -----------(1)

在一个宽度为 `foo_w` 的设备上，该元素应该给定的宽度为 `x_w px`。

根据 `rem` 单位的意义可知：

    foo_rem * foo_fs / foo_w = psd_rem * ue_fs / ue_w -----------(2)

即：

    foo_rem = psd_rem * (ue_fs / foo_fs) * (foo_w / ue_w) -----------(3)

其中 `psd_rem`、`ue_fs`、`foo_w`、`ue_w` 皆为已知，而 `foo_fs` 可给定一个具体值，相当于已知。

```css
.px2rem(@px){
    @px * (foo_w) / (foo_fs * ue_w) rem
}
```

例如，以iPhone6的尺寸为基准，即：

    ue_fs = 75px（任取值）
    ue_w = 375px

一个宽度为屏幕宽度一般的元素，即：

    psd_rem = 375px / 2 / 75px = 2.5rem

在一台 iPhone6 plus 上，则：
    
    foo_w = 414px
    foo_fs = 69px（任取值）

代入(3)，得
    
    foo_rem = 2.5 * (75 / 69) * (414 / 375) = 3rem = 3 * 69px = 414px / 2

刚好也为屏幕的一半。因此，上面的 `LESS` 实际内容是：

```css
.px2rem(@px){
    @px * 0.016 rem
}
```

可见，实现与 UE 图等比例的效果，只要定一个基准的 `ue_w` 和一个基准的 `ue_fs`，并任取一个当前设备的 `foo_fs` 就可以了，跟什么 `dpr`、`scale` 根本没有关系。

### 事实

那么如何根据屏幕宽度取一个合适的 `foo_fs` 呢？

再来看上面的(3)式，为了更精确的还原UE图，我们一定希望 `foo_rem` 和 `psd_rem` 都是有限小数，那么：

    (ue_fs / foo_fs) * (foo_w / ue_w)

就也一定是有限小数。分解：

    ue_fs / ue_w 

和：

    foo_fs / foo_w

最好都是有限小数。因此，只要取屏幕宽度的___约数___做 `foo_fs` 就可以了，如 iPhone6 上的 75px，iPhone6 plus 上的 69px 等等。


我们知道，在 `dpr` 大于1的设备上，是画不出来真正 1px 的，除非将 `scale` 设置成 `1 / dpr`。这样，`foo_w` 也会成倍增加：

    foo_w = screen.width * dpr

因此为了支持1物理像素，`scale` 必须设置成 `1 / dpr`，`foo_fs` 取 `screen.width * dpr` 的约数。

`CSS3` 中新增了 `vw` 和 `vh` 两个单位，分别代表可见区域宽高的百分之一，目前浏览器支持程度还不好：

![caniuse](/images/scale/caniuse.png)

为了向后兼容，我们取 `foo_w` 的十分之一（百分之一会出小数）作为 `foo_fs`：

    foo_fs = foo_w / 10 = screen.width * dpr / 10 -----------(4)

这样，`dpr` 为2时，一个宽度为屏幕一半的元素尺寸为 `5rem`，或 `50vw`，仅数量级不同。

这就是为什么业界以(4)式计算 `foo_fs` 的缘由了。

`rem` 的方案就讲到这里，已经用数学算式推导出了 `foo_fs` 的计算公式(4)。

核心代码参考：
```javascript
var dpr = window.devicePixelRatio;
var meta = '<meta name="viewport" content="width=' + baseW + ", initial-scale=" + scale + ", maximum-scale=" + scale + ", minimum-scale=" + scale + ', user-scalable=no"/>';
document.write(meta);
var style = '<style tyle="text/css">html{font-size:' + (screen * dpr / 10) + 'px !important}</style>';
document.write(style);
```

## 第二种方案，scale

相比于第一种，第二种方案显得简单粗暴：

 >设置一个基准的尺寸，页面上所有元素都按照此基准布局。然后将页面缩放到设备的真实尺寸上去。

比如设定基准为 400px，而真实设备尺寸为 500px，则 `scale` 必须为 `500 / 400 = 1.25`。核心代码参考：

```javascript
var baseW = 400
var scale = screen.width / baseW;
var meta = '<meta name="viewport" content="width=' + baseW + ", initial-scale=" + scale + ", maximum-scale=" + scale + ", minimum-scale=" + scale + ', user-scalable=no"/>';
document.write(meta);
```

同时还必须要设置HTML的宽度:

```css
html {
    width: 400px !important；
}
```

不必再去计算 `foo_rem`、`foo_fs` 等参数。由于 `scale` 并非等于 `1 / dpr`，因此1物理像素也就没法实现了。同时，`vw`、`vh` 的兼容也没有体现。好在它不需要转换 px 为 rem。

## 对比

比较上述两种方案：

|方案|等比布局|1物理像素|兼容vw/vh|绝对定位|UE尺寸|高清图|
|----|----|----|----|----|----|----|
|第一种|✔|✔|✔|✔|LESS|✔|
|第二种|✔|✘|✘|✔|✔|有误差|

因此两种方案的使用场景是：
 1. 如果必须实现1物理像素，或者需要精确的高清图片，或者对 `vw/vh` 向后兼容，则使用方案一，代表有[淘宝](https://m.taobao.com/),，缺点是需要单位换算，也存在一定的误差；
 2. 预处理，或者需要精确的像素控制，则使用方案二开发会比较方便，代表有[百度H5](http://h5.baidu.com/)，缺点是不能实现1物理像素，也不能实现精确的高清图片

## 回归

上述两个方案比较让人不爽的是都使用了 JavaScript 脚本来动态设置 `scale` 的大小。在苹果公司的原始设计中， `viewport` 是这样使用的么？

参见 [Safari HTML Reference](https://developer.apple.com/library/iad/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html#//apple_ref/doc/uid/TP40008193-SW6)，`viewport` 允许开发者设置 width 来调整适配的目标设备宽度，但最终`document.documentElement.clientWidth`的值为

    document.documentElement.clientWidth === Math.max(screen.width / scale, width)

在前面两个方案中，width 等于 `screen.width`，`scale` 小于1，因此

    document.documentElement.clientWidth === screen.width / scale === screen.width * dpr

如果 `scale` 写死为1，自定义的 width 不能小于 `screen.width`。但一旦 width 大于 `screen.width`，就会出现滚动条，这时，JavaScript 动态计算的 `scale` 上场了。

因此，按照苹果公司的设计初衷，没办法不使用 JavaScript 实现完美的 UE 还原。使用一份 UE 图，无法做到多个屏幕尺寸上呈现一致的效果。

## 横屏

移动端开发经常缺失的一个环节是，设计师很少提供横屏版的 UE。当手机屏幕横过来怎么办？

可以监听 `resize`、`pageshow` 等事件，事件触发后，重新计算 `scale`、`foo_fs` 等值。这样能保证页面元素的比例仍与 UE 相当。

有没有问题？

水平方向上好像没什么问题。垂直方向呢？

当整体页面按比例放大后，页面高度必然也会等比放大，而在横屏模式下，屏幕垂直高度又很小，从而导致大部分内容都被推出了首屏，体验和视觉上效果都不好。

因此，元素的高度一般不是用 rem 而使用 px，除非元素尺寸与屏幕尺寸强相关。

这是不是意味着所谓的完美还原是不切实际的？对于那种划页 H5， rem 的高度仍然试用，但对于普通的文本内容则不合适了。

依据具体需求采取不同的方案。

## 总结

对于普通的需求，`width=device-width` 和 `scale=1` 就够了，虽然不能在不同的设备上展示同样的效果，但是够用。

对展现要求稍高，则使用 JavaScript 动态计算 `scale` 和 `foo_fs`。