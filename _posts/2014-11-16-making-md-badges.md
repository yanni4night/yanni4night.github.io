---
layout: post
title: "Markdown嵌入徽标"
date: 2014-11-16
tags: readme repo badge
---

经常在 [github](https://github.com/) 上看到很多 repo 的 readme 都会展示类似![Bagde Demo](http://img.shields.io/travis/yanni4night/urljoin.svg)这样的东西。它们的学名叫徽标(Badge)，大多是使用 [markdown](http://zh.wikipedia.org/zh/Markdown) 的图片语法嵌入的 [svg](http://www.w3.org/Graphics/SVG/)，可以自动显示当前 repo 的各种状态。下面介绍几种提供徽标的服务。


#### NPM version

显示该repo发布在 NPM 上的版本，链接 <http://img.shields.io/npm/v/{repo}.svg>，如 ![NPM Version](http://img.shields.io/npm/v/urljoin.svg)。

#### NPM Download

显示在 NPM 上的阶段下载数，链接 <http://img.shields.io/npm/dm/{repo}.svg>，如 ![NPM Download](http://img.shields.io/npm/dm/urljoin.svg)。

#### gratipay

需要[登录](https://gratipay.com/)，用于发起捐助。链接 <http://img.shields.io/gittip/{user}.svg>，如 ![Git tip](http://img.shields.io/gittip/yanni4night.svg)。

#### travis

需要[登录](https://travis-ci.org/)并指定 repo ，用于自动显示构建状态。链接 <http://img.shields.io/travis/{user}/{repo}.svg>，如 ![Travis](http://img.shields.io/travis/yanni4night/urljoin.svg)。

#### coveralls

需要[登录](https://coveralls.io/)并指定 repo ，配合测试框架显示覆盖度。链接 <http://img.shields.io/coveralls/{user}/{repo}/master.svg>，如 ![Coveralls](http://img.shields.io/coveralls/yanni4night/urljoin/master.svg)。

#### appveyor

需要[登录](https://ci.appveyor.com/)并指定 repo ，用于在 Windows 环境进行构建。链接 <https://ci.appveyor.com/api/projects/status/{repo-id}?svg=true>，如 ![Appveyor](https://ci.appveyor.com/api/projects/status/ildoo8h6ewphy8we?svg=true)。

#### codeship

类似于 travis ，同样用于自动构建，点此[登录](https://codeship.com/)，如![Build Status](https://codeship.com/projects/79da7240-5481-0132-ea32-42ab35009c21/status)。

<hr>

其实这些服务大多都使用了同一种徽标生成服务：<http://shields.io/>。可以随意创建自己的徽标：![yanni4night.com](http://img.shields.io/badge/yanni4night.com-ONLINE-brightgreen.svg)。

<http://yanni4night.github.io/badge.html> 可快速生成所需徽标。