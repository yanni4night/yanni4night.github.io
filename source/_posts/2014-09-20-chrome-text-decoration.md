---
layout: post
title:  "Chrome 31~36 的 text-decoration bug"
date:   2014-09-20
categories: css
---


CSS3 对 `text-decoration` 进行了扩展，新的语法为：


    text-decoration: text-decoration-style text-decoration-color text-decoration-line;

目前只有 blink 内核对其进行了支持，但很不完善，或者说是一个bug。描述为：无法设置新的格式，但是却可以获取。例如：


    <p id="p" style="text-decoration:underline"></p>
    <script>
        var $p = document.querySelector('#p');
        console.log($p.style.textDecoration);//underline solid rgba(0,0,0)
        $p.style.textDecoration = "overline solid dashed #fff";
        console.log($p.style.textDecoration);//underline solid rgba(0,0,0)
    </script>

该问题从Chrome 31开始出现，我提了 [bug](http://code.google.com/p/chromium/issues/detail?id=342126) 给 chromium ，在后来的Chrome 37 中修复了一部分，不再返回 `text-decoration-color` 和 `text-decoration-line`，同时仍然无法设置。

这个 bug ，[jQuery](http://www.jquery.com/) 拒绝修复，理由是 1.x 与 2.x 都仅保证支持 Chrome 的最近两个版本，同时这也不是个严重的问题，当前，Chrome 39 已经发布了。
