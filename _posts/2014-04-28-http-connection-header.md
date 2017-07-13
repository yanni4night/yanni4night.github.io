---
layout: post
title:  "HTTP协议的Connection头"
date:   2014-04-28
categories: http connection header keep-alive proxy 代理 管道
---

`Connection` 是一种 HTTP 通用头，应用于 HTTP 请求与响应首部之中，几乎广泛地存在于每一个可见的连接之中。最常见的取值为 `close` 与 `keep-alive` ，前者表示请求响应完成之后立即关闭连接，后者表示连接不立即关闭，可以期望继续响应下一个请求。

`close` 很容易理解，关于 `keep-alive` ，我们知道 HTTP 建立在 TCP 传输层协议之上，而 TCP 的建立需要握手，关闭需要发通知，这些步骤都需要时间，带给 HTTP 的就是请求响应时延。

`close` 模式请求3个资源的时间线是这样的：
<pre>
服务器--------------------------------------------
        /   \           /   \            / \
       /     \         /     \          /   \
      /       \       /       \        /     \
浏览器--------------------------------------------
</pre>

那么 `keep-alive` 模式就可能就是这样的：
<pre>
服务器--------------------------------------------
        /   \     /   \     / \
       /     \   /     \   /   \
      /       \ /       \ /     \
浏览器--------------------------------------------
</pre>

这里忽略了软件的数据处理时延，可以明显的看到节省了 TCP 连接建立时间和连接关闭时间所带来的益处。另外，这种方式也可以避免 TCP 多次经历`慢启动`过程，其带来的时间受益并没有在图中表现出来。

这样看来，`keep-alive` 应该一直使用来提高 web 加载性能。


###### 哑代理问题

HTTP 首部可分为[两类](https://tools.ietf.org/html/rfc2616#section-13.5.1)，`hop-by-hop` 和 `end-to-end`：

> - End-to-end headers  which are  transmitted to the ultimate
>   recipient of a request or response. End-to-end headers in
>   responses MUST be stored as part of a cache entry and MUST be
>   transmitted in any response formed from a cache entry.
>
> - Hop-by-hop headers  which are meaningful only for a single
>   transport-level connection  and are not stored by caches or
>   forwarded by proxies.

显然 `hop-by-hop` 是不能缓存不能被代理转发的，下面即 HTTP 1.1 定义的8个 `hop-by-hop` 首部，其它均属于 `end-to-end` 首部。

 - [Connection](https://tools.ietf.org/html/rfc2616#section-14.10)
 - [Keep-Alive](https://tools.ietf.org/html/rfc2068#section-19.7.1.1)
 - [Proxy-Authenticate](https://tools.ietf.org/html/rfc2616#section-14.33)
 - [Proxy-Authorization](https://tools.ietf.org/html/rfc2616#section-14.34)
 - [TE](https://tools.ietf.org/html/rfc2616#section-14.39)
 - [Trailers](https://tools.ietf.org/html/rfc2616#section-14.40)
 - [Transfer-Encoding](https://tools.ietf.org/html/rfc2616#section-14.41)
 - [Upgrade](https://tools.ietf.org/html/rfc2616#section-14.42)

因此理论上 `Connection` 首部是不能被代理、中继等中间 HTTP 节点转发的，另外根据 [RFC2616](https://tools.ietf.org/html/rfc2616) 的定义：

>Connection = "Connection" ":" 1\#(connection-token)
>
>connection-token  = token

`Connection` 列举的所有 HTTP 首部都不能被转发，如一个请求头中如下：

>GET / HTTP/1.1
>
>Accept: */*
>
>Connection:Proxy-Time Non-Header Keep-Alive
>
>Proxy-Time:0810
>
>Keep-Alive: max=5 timeout=120

经过代理后应该被修改为：

>GET / HTTP/1.1
>
>Accept: */*

即移除 `Connection` 首部及其列举的其它首部。但这是理想情况，万维网上还工作着无数称之为`哑代理`的盲中继：它们仅把数据按字节转发，并不理会 HTTP 首部中的意义。在这种情况下，就会出现一些非预期的状况：

<pre class="courier">
    ____       keep-alive      ____      keep-alive       ____
   |    |   =+++++++++++++++- |    |  =+++++++++++++++-  |    |
   |    |      keep-alive     |    |     keep-alive      |    |
   \____/   -+++++++++++++++= \____/  -+++++++++++++++=  \____/

   Browser                     Proxy                     Server
</pre>

如上图，浏览器向服务器发送带有 `Connection:Keep-Alive` 的请求，中间经过一个哑代理，从而导致该首部到达服务器。对于服务器来说，代理与浏览器没有什么分别，它认为浏览器（代理）尝试建立 `Keep-Alive` 连接，便在响应头中发回 `Connection:Keep-Alive` ，并保持连接开启。哑代理将响应首部原封不动的发回给浏览器，并等待服务器关闭连接。浏览器收到响应数据后立即准备进行下一条请求。此时，浏览器和服务器都认为与对方建立了 `Keep-Alive` 连接，但是中间的代理确对此一无所知。因此哑代理不认为这条连接上还会有请求，接下来来自浏览器的任何请求都会被忽略。这样，浏览器和服务器都会在代理处挂起，直到一方超时将连接关闭为止。这一过程不仅浪费服务器资源，也使得浏览器响应缓慢或失败。

###### Proxy-Connection

一个变通的做法即是引入一个叫做 `Proxy-Connection` 的新首部。在浏览器后面紧跟代理的情况下，会以 `Proxy-Connection` 首部取代 `Connection`
 首部发送。如果代理不能理解该首部，会透传给服务器，这不会带来任何副作用，服务器仅会将其忽略；如果这个代理足够聪明（有能力支持这种 `Keep-Alive` 连接），会将 `Proxy-Connection` 首部替换成 `Connection` 发送给服务器，从而达到建立双向 `Keep-Alive` 连接的目的。

我们可以开启 [Fiddler](http://www.telerik.com/fiddler) 并观察 Chrome 或 IE 开发工具中 Network中的请求头，都会有 `Proxy-Connection` 。Firefox好像并没有发送这个首部，Safari可能同时发送了 `Proxy-Connection` 和 `Connection` 首部，[Fiddler](http://www.telerik.com/fiddler) 没有移除 `Connection` 首部但将 `Proxy-Connection` 替换为 `Connection` ，导致出现两个 `Connection` 首部。


显然，在聪明代理和哑代理共存的链路上，上面的提到的挂起的问题仍然存在，`Proxy-Connection`并没有从根本上解决问题。其实 `Proxy-Connection` 也并非是一个标准的协议首部，任何标准或草案中都没有提到它，仅仅是应用广泛罢了。

###### 持久化连接

HTTP 1.1 已经废弃了使用 `Keep-Alive`，而以"持久化连接"的概念取代之。与 HTTP 1.0 不同的是，在 HTTP 1.1 中，持久化连接是默认开启的，除非你手动设置 `Connection:close`。为了避免收到哑代理误转发过来的 `Keep-Alive` ，HTTP 1.1 代理应当拒绝与所有来自  HTTP 1.0 设备建立持久化连接（实际厂商并非如此）。

###### 管道

HTTP 1.1 还提供了在持久化连接基础上的一个性能优化特性：`请求管道`。它可以在一条连接上同时发起多个请求而不必等到前面的请求得到响应，降低网络的环回响应时间，如下图：

<pre>
服务器--------------------------------------------
        /\/\/\/\
       / /\/\/\ \
      / / /\/\ \ \
浏览器--------------------------------------------
</pre>

但使用`请求管道`有一些限制：

 - 连接必须是持久的；
 - 服务器必须按照请求的顺序返回；
 - 浏览器必须能应对部分请求失败的情况，并重试；
 - 不能进行非幂等这类可能带来副作用的请求，如 POST 请求，因为无法安全重试。

一些现代的浏览器支持管道但利用尚不广泛，特别是页面使用较多域名的情况下，管道技术更是难以施展。[SPDY](www.chromium.org/spdy‎) 技术更进一步，做到了跨域的多路复用，理论上可以让web的加载速度有显著提升，期待该技术的普及。

###### 参考

 - <http://homepage.ntlworld.com./jonathan.deboynepollard/FGA/web-proxy-connection-header.html>
 - <https://tools.ietf.org/html/rfc2068#section-19.7.1>
 - <http://www-archive.mozilla.org/projects/netlib/http/pipelining-faq.html>
 - <http://www.guypo.com/technical/http-pipelining-not-so-fast-nor-slow/>
 - <http://www.mnot.net/blog/2011/07/11/what_proxies_must_do>
