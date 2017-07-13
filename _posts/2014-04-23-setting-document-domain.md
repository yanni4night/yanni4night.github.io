---
layout: post
title: "浅谈document.domain"
date: 2014-04-23
categories: document domain 跨域
---

在需要主子域跨域技术的应用场景中，父 frame 和子 frame 设置相同的 `document.domain` 是一种特别常用的方式，我们可以看见[腾讯](http://www.qq.com)公司的页面中很多都会有一句：

    document.domain = "qq.com";

`qq.com` 域页面的登录行为很多都是依赖这种方式与iframe结合来实现的。


事实上，W3C 的 [DOM 2 HTML标准](http://www.w3.org/TR/2003/REC-DOM-Level-2-HTML-20030109/html.html#ID-2250147)将 `document.domain`定义为只读的：

>domain of type DOMString  readonly
>The domain name of the server that served the document  or null if the server cannot be identified by a domain name.

但[HTML5 草案](http://www.whatwg.org/specs/web-apps/current-work/multipage/origin-0.html#relaxing-the-same-origin-restriction) 中有关于对 `document.domain`赋值的内容。

在 [Webkit](http://www.webkit.org) 的 [Document.idl](https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/core/dom/Document.idl) 源码中对 `domain` 有这样的定义：

    #if defined(LANGUAGE_JAVASCRIPT) && LANGUAGE_JAVASCRIPT
        [TreatNullAs=NullString  SetterRaisesException] attribute DOMString domain;
    #else
        readonly attribute DOMString domain;
    #endif

这也说明了 `domain` 设置为“writable” 仅用于页面脚本：即允许主子域脚本进行通信，但不涉及 `localStorage` 、`indexedDB` 和 `XMLHttpRequest` 的共享。目前市场上主流浏览器都支持 `domain`可写，可以满足几乎所有主子域脚本通信需求，但在特殊情况下也有些许不同。

所有浏览器都不支持设置 `domain` 为当前域子域或不完整的超域，比如当前域为 “abc.google.com”  那么设置 `domain` 为 “www.abc.google.com” 或"ogle.com" 都是不允许的。现在测试各个浏览器在 host 为以下情形下设置不同domain的反应：

 - 为IP地址
 - 单节域名
 - 多节域名

测试 host 为 “google”、“www.google.com”、“10.11.202.231”。由子域名向父域名测试，因此前面的测试不会对后面的测试造成干扰。


|UA/host|google|www.google.com|10.11.202.231|
|---|:---|:---:|---:|
|Firefox(Mac/Windows/Android)|![s.ff](/images/domain/s.ff.jpg)|![m.ff](/images/domain/m.ff.jpg)|![ip.ff](/images/domain/ip.ff.jpg)|
|Safari(iOS/Mac/Windows)|![s.safari](/images/domain/s.ie8.jpg)|![m.safari](/images/domain/m.ie6.jpg)|![ip.safari](/images/domain/ip.safari.jpg)|
|IE6~7|![s.ie67](/images/domain/s.ie8.jpg)|![m.ie67](/images/domain/m.ie6.jpg)|![ip.ie67](/images/domain/ip.ie6.jpg)|
|Chrome(Mac Windows)/IE8~10/Opera(presto内核 Mac/Windows)|![s.chrome-ie810-opera](/images/domain/s.ie8.jpg)|![m.chrome-ie810-opera](/images/domain/m.ie6.jpg)|![ip.chrome-ie810-opera](/images/domain/ip.ie8.jpg)|
|IE(WP8)|无法打开|![m.chrome-ie810-opera](/images/domain/m.ie6.jpg)|![ip.chrome-ie810-opera](/images/domain/ip.ie8.jpg)|

由上表可得出以下结论：
 - Firefox 可以接受带 port 的父域名，但是任意 port 都会被忽略，其它浏览器则会报错；
 - 对于 IP 地址，IE6、IE7 和 Safari 简单地将其当做为域名；
 - 仅 Safari 允许将 `domain` 设置为最后一节域名。

 Safari 以及 国内几乎所有带 [webkit](http://www.webkit.org) 内核的浏览器 使用了一种相对简单的方式，即在字符串层面上新的 `domain` 是当前 `domain` 的“父域名”即可，可以从 [webkit](http://www.webkit.org) 中 `Document.cpp` 文件的源代码中看出：
    

    void Document::setDomain(const String& newDomain  ExceptionCode& ec)
    {
    if (SchemeRegistry::isDomainRelaxationForbiddenForURLScheme(securityOrigin()->protocol()))     {
            ec = SECURITY_ERR;
            return;
        }
    
        // Both NS and IE specify that changing the domain is only allowed when
        // the new domain is a suffix of the old domain.
    
        // FIXME: We should add logging indicating why a domain was not allowed.
    
        // If the new domain is the same as the old domain  still call
        // securityOrigin()->setDomainForDOM. This will change the
        // security check behavior. For example  if a page loaded on port 8000
        // assigns its current domain using document.domain  the page will
        // allow other pages loaded on different ports in the same domain that
        // have also assigned to access this page.
        if (equalIgnoringCase(domain()  newDomain)) {
            securityOrigin()->setDomainFromDOM(newDomain);
            return;
        }
    
        int oldLength = domain().length();
        int newLength = newDomain.length();
        // e.g. newDomain = webkit.org (10) and domain() = www.webkit.org (14)
        if (newLength >= oldLength) {
            ec = SECURITY_ERR;
            return;
        }
    
        String test = domain();
        // Check that it's a subdomain  not e.g. "ebkit.org"
        if (test[oldLength - newLength - 1] != '.') {
            ec = SECURITY_ERR;
            return;
        }
    
        // Now test is "webkit.org" from domain()
        // and we check that it's the same thing as newDomain
        test.remove(0  oldLength - newLength);
        if (test != newDomain) {
            ec = SECURITY_ERR;
            return;
        }
    
        securityOrigin()->setDomainFromDOM(newDomain);
    }
    

因此即使是IP地址或是最后一节 `domain` 也会被允许设置。`Internet Explorer` 不开源，但可以猜测其对多节域名进行了最后一节域名限制，在 `IE8+` 上增加了IP地址限制。`Firefox` 在3.0版本增加了此限制。对于单节域名如 `http://hello/`，所有浏览器都一致性地允许设置，当然，这相当于设置 `domain` 为自身。

Firefox浏览器忽略 `port` 的行为初衷不得而知，但可以测试该特性是在`3.0`版本上增加的。

值得一提的是，[chromium](http://www.chromium.org/Home) 项目对 [webkit](http://www.webkit.org) 进行了一些修改，从而带来了一些新的特性，观察 [Document.cpp](https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/core/dom/Document.cpp) 文件的源代码：

    void Document::setDomain(const String& newDomain  ExceptionState& exceptionState)
    {
        if (isSandboxed(SandboxDocumentDomain)) {
            exceptionState.throwSecurityError("Assignment is forbidden for sandboxed iframes.");
            return;
        }
    
    if (SchemeRegistry::isDomainRelaxationForbiddenForURLScheme(securityOrigin()->protocol()))     {
        exceptionState.throwSecurityError("Assignment is forbidden for the '" + securityOrigin()->    protocol() + "' scheme.");
            return;
        }
    
        if (newDomain.isEmpty()) {
            exceptionState.throwSecurityError("'" + newDomain + "' is an empty domain.");
            return;
        }
    
    OriginAccessEntry::IPAddressSetting ipAddressSetting = settings() && settings()->treatIPAddressAsDomain() ? OriginAccessEntry::TreatIPAddressAsDomain :     OriginAccessEntry::TreatIPAddressAsIPAddress;
    OriginAccessEntry accessEntry(securityOrigin()->protocol()  newDomain      OriginAccessEntry::AllowSubdomains  ipAddressSetting);
        OriginAccessEntry::MatchResult result = accessEntry.matchesOrigin(*securityOrigin());
        if (result == OriginAccessEntry::DoesNotMatchOrigin) {
        exceptionState.throwSecurityError("'" + newDomain + "' is not a suffix of '" + domain() + "'.    ");
            return;
        }
    
        if (result == OriginAccessEntry::MatchesOriginButIsPublicSuffix) {
            exceptionState.throwSecurityError("'" + newDomain + "' is a top-level domain.");
            return;
        }
    
        securityOrigin()->setDomainFromDOM(newDomain);
        if (m_frame)
            m_frame->script().updateSecurityOrigin(securityOrigin());
    }


可见除了支持HTML5的 [sandbox](http://www.whatwg.org/specs/web-apps/current-work/multipage/the-iframe-element.html#attr-iframe-sandbox) 之外，还增加了IP地址检测，因此 `Chrome` 才不会像Safari那样允许IP地址的一段设置为 `domain`。特别地，`Chrome` 还进行了顶级域名检测， [chromium](http://www.chromium.org/Home) 项目会生成一个 [effective_tld_names.gperf](https://code.google.com/p/chromium/codesearch#chromium/src/net/base/registry_controlled_domains/effective_tld_names.gperf) 文件，提供了很多域名列表，末尾标记不为0的域名将不能设置为 `document.domain`。比如，一个域名为www.english.uk的页面，在 `Chrome` 下将不能设置 `document.domain` 为 `english.uk`，因为 `english.uk` 被认为是`顶级域名`从而报错：

>SecurityError: Failed to set the 'domain' property on 'Document': 'english.uk' is a top-level domain.

这部分逻辑的一些代码来自 [Mozilla](http://www.mozilla.org) ，因此`Firefox` (3.0+)也具有同样的特性。

截止今天(2014-04-24)，这个列表至少包含472个顶级域名，包括孟加拉国、文莱、库克群岛、塞浦路斯、厄立特里亚、埃塞俄比亚、斐济、马尔维纳斯群岛、关岛、以色列、牙买加、肯尼亚、柬埔寨、科威特、缅甸、莫桑比克、尼加拉瓜、尼泊尔、新西兰、巴布亚新几内亚、土耳其、英国、也门、南非、赞比亚、津巴布韦等国家和地区的顶级域名。想必这些国家的网站在设置 `document.domain` 时会遇到一些困难了:)。



在对IE浏览器进行测试时，也发现了一些奇怪的事情。实验“aa.bb.cc.dd”域名，发现在 `IE8+` 下将不能设置 `document.domain` 为“cc.dd”。经过反复测试发现 `IE8+`在多节域名下允许设置 的双节域名中，两节单词中要至少有一个大于2个字母，换言之，下列域名都是不允许的：
 
 - sa.cn
 - o.jp
 - x.m

但下列是允许的：

 - sax.cn
 - o.com
 - xxx.k

暂不知微软用意为何，但可以联想到，新浪微博的短域名 `t.cn`在有下一级域名的情形下，将不能设置 `document.domain`为 `t.cn`。


即便拥有上面的诸多问题，不过都属于特例，除了 `IE8+` 的短域名问题，其它基本都不会在日常的开发中遇到。

###### 参考
 1. <http://javascript.info/tutorial/same-origin-security-policy>
 2. <http://msdn.microsoft.com/en-us/library/ie/ms533740(v=vs.85).aspx>
 3. <https://developer.mozilla.org/en-US/docs/Web/API/document.domain>
