---
layout: post
title:  "一种特殊的Sublime插件"
date:   2014-09-13
categories: sublime plugin
---


昨天 [GitHub](https://github.com/) 上捷克共和国一哥们提出几个 issues，讲我的某个石器时代土著插件不支持 [Sublime](http://www.sublime.com/) `Text Command` 并且 `Context Menu` 缺失。其实这两个功能入口仅需要编辑两个配置文件就可以了，但前提是命令数量是有限的，这样才可以直接写死配置文件。

只是这个插件提供的主要功能即是无限扩展命令完成各种插入操作，默认提供了4种常见插入，此外可以无限配置插入种类，如果全部都要配置快捷键，确实不合理。

`Sublime` 插件配置文件分为几种：

 + sublime-menu，右键菜单和主菜单
 + sublime-commands，文本命令
 + sublime-keymap，快捷键定义
 + sublime-settings，插件主要配置文件

前三种格式全为数组，最后一个为对象，也只有最后一个 `Sublime` 单独提供了 API 供读写：

    
    sublime.load_settings()
    sublime.save_settings()

一般地，我们只需要读取就行了。

`Text Command` 和 `Context Menu` 需要修改 `menu` 和 `commands` 配置文件，因为它们是数组格式，不能通过上面的 API 读写，所以不得不使用 python 的原生API进行写入操作。在每次插件加载时，动态更新这两个文件，编辑器本身也能立即得到通知。

`settings` 配置文件被修改时理应重新进行一次上面的操作，但是 `Sublime` API 的 `Settings.add_on_change` 似乎不怎么起作用，因此不得不强制要求编辑器重启来刷新设置。


###### 引用
- <http://www.sublimetext.com/docs/2/api_reference.html>
