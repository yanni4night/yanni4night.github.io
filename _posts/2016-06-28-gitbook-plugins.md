---
layout: post
title:  "Gitbook 插件的问题"
date:   2016-06-28 16:03:03 +0800
categories: gitbook plugin
---

[Gitbook](https://www.gitbook.com/) 是一个工具，可以将你的 Markdown 文档转换为 HTML、PDF 电子书，也是一个平台，你可以将电子书分享到上面去。不过严格来讲将 Markdown 发布为 HTML 没有任何技术含量，解析 Markdown 格式的工具不计其数。原始的 Markdown 语法非常简陋，在写书的时候，难免会用到一些图表、公式之类的，这种 Markdown 通过扩展也不在话下。

\`\`\`[type]
[content]
\`\`\`

*type* 处是这段代码的解析类型，常用的有各种语言语法以及 *flowchat*、*sequence* 等扩展类型，这些扩展类型都需要引入运行时解析的js脚本。

<!-- more -->

Gitbook 通过注册插件，无需手动引入js：

```js
// book.json
{
    "plugins" : ["katex"]
}
```

然后运行 `gitbook install` 下载插件。

打开浏览器再浏览页面时，gitbook 已经将插件中声明的样式和脚本都注入到了页面当中。

但这有一个很大的问题，可以声明的脚本是个数组，你可以将任意数量的js注入到页面中，于是乎广大插件作者自然而然将依赖库放进去了，包括 jQuery，Raphael，Underscore 等等，你会看到：

```html
<script src="..plugin-a/book/jquery.js"></script>
<script src="..plugin-a/book/plugin-a.js"></script>
<script src="..plugin-b/book/jquery.js"></script>
<script src="..plugin-b/book/plugin-b.js"></script>
...
```

是的，一个以上的插件将 jQuery 注入进去了，而 jQuery 是会向全局作用域暴露 `$` 对象的，后面的会覆盖前面的，这导致很多插件都不能工作了。

目前官网还没有给出解决方案，对于不得不使用的插件，需要手动改造一番，尽量少向全局暴露对象。

 - [js-sequence-diagram-full](https://plugins.gitbook.com/plugin/js-sequence-diagram-full)
 - [mathjax-full](https://plugins.gitbook.com/plugin/mathjax-full)
 - [mermaid-full ](https://plugins.gitbook.com/plugin/mermaid-full)
 - [flowchart-full](https://plugins.gitbook.com/plugin/flowchart-full)
