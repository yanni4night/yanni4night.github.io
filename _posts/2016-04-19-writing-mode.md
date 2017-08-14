---
layout: post
title: "从 margin-bottom 到 writing-mode"
date: 2016-04-19 22:48:45 +0800
categories: css
---

一个有趣的事实是，不论 _margin_ 还是 _padding_，都可以设置百分比值：

```css
.content {
    margin: 5%;
    padding: 10%;
}
```

直观上来讲，_margin-left_、_margin-right_、_padding-left_、_padding-right_ 是相对于[包含框](https://drafts.csswg.org/css-box/#containing-block)的宽度，而 _margin-top_、_margin-bottom_、_padding-top_、_padding-bottom_ 相对于包含框的高度。然而根据 CSS 规范，这8个值***一般***都是相对于包含框的宽度，究其原因还是排版的习惯需要所致。

<!-- more -->

世界上大部分的现代语言书写习惯，或者从左到右，或者从右到左，都是横排，因此一般宽度受限，向下无限延伸，高度不定，因此相对于高度计算边距值意义不大。

古代汉语文字有着垂直从右到左书写的习惯，比如千家万户门前的对联，比如书法：

![书法](/images/writing-mode/calligraphy.jpg)

为了实现这种排版，我们通过设置 _writing-mode_ 和 _direction_ 实现：

```css
.content {
    writing-mode: vertical-lr;
    direction: rtl;
}
```

这种设置除了影响文字的排列外，也相应影响了 _padding_ 和 _margin_ 在百分比取值下的参照物：即相对于包含框的高度而非宽度。

值得一提的是，另一个常见 CSS 特性的行为也会因此被改变：外边距合并。通常情况下，发生外边距合并的是两个相邻块级元素的垂直外边距，在垂直文字布局情形下，发生合并的是水平外边距。

CSS 排版布局中在具有不对称行为时，一定也存在着某种默认的行为设置。比如使用 `margin:auto` 能使水平居中而非垂直居中。