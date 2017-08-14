---
layout: post
title: "隐藏元素的font-face"
date:  2015-01-19
categories: css
---

`font-face`  用于在 CSS 中设置字体，所以主流浏览器都支持，即便是 IE6，只不过所支持的字体格式不同。[这里](http://www.fontsquirrel.com/tools/webfont-generator)可以支持在不同字体格式之间转换并生成兼容的 CSS 代码。


对于一个隐藏元素应用 `font-face` 样式会立即下载字体文件么？

| UA      | visibility:hidden | display:none |
| ------- | ----------------- | ------------ |
| Chrome  | Y                 | N            |
| Safari  | Y                 | N            |
| Firefox | Y                 | N            |
| IE      | Y                 | Y            |

可见除 `IE` 外都会针对 _display:none_ 的元素进行字体文件的延迟下载，这样就会出现类似 [FOUC](http://www.bluerobot.com/web/css/fouc.asp/) 的行为，文字会以默认的字体渲染，待字体文件下载完成后再重绘。

测试见[这里](/example/fontface.html)。
