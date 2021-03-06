---
layout: post
title: "理想与现实，黑与白，总结半年来React-Native的深度应用经验"
date: 2017-07-13 15:17:01 +0800
categories: react-native
---

自从去年11月中旬在公司内部转岗后，我就一直从事着React-Native业务研发工作，算起来也有大半年了，在这项技术的应用、运维上也算是有了点经验。

往往在产品上应用一项新技术的KickOff上，都必然要涉及该项技术的明显领先优势，React-Native 给人的一贯明显优势无非是：
 1. **开发效率提升**；
 2. **与Native一致的用户体验**；
 3. **无需发版，随时上线**

 那么如果工程做得好的话，也要必然提到它的劣势——*不够稳定*。

我以前向来是个React-Native黑，我不认为它的稳定性足以支撑一项C端产品，更何况是亿级用户产品。

因此，当初做React-Native算是有些被迫的，毕竟万事俱备只欠开发，毕竟要用事实说话，毕竟挣钱吃饭重要。

---

初期的开发工作可谓极其艰苦，不但没有开发经验，而且基础调试设施不完善，效率很低，更何况连实体测试机都不够。但最终总算是上线了。

另我十分惊讶的是，不稳定性带来的客户端Crash比预想中的要低得多得多。在平台的横向比较上，Android要比iOS的奔溃率高，但还不算很离奇，勉强可以忍受。

我从来不会想到这么一个残缺不堪的东西竟然真的没有掉链子，由此我反思了一下，想起了我党在40年前的那句话：

***实践是检验真理的唯一标准***

![实践是检验真理的唯一标准](/images/rn/reality.jpg)

是的，不能因为外界的评论甚至是自己的无知，就对新事物抱有成见。除非自己亲自实践，否则无权瞎BB。

经过这么一来，我对手头上的这个项目信心大增，业务的迭代速度即将迎来一次飞跃。

然，下面才是冷静之后的现实，更说明了海量事实的总体分布就像那宇宙微波背景辐射一样的均匀各项同性。

![宇宙微波背景辐射](/images/rn/bg.jpg)

### 线上追踪问题困难

React 异步渲染的性质，导致了在渲染视图中出现crash，崩溃堆栈是不会追溯到你的业务代码中的。

![crash stack](/images/rn/stack.png)

在这种情形下，代码被压缩根本就不是问题，问题是你完全不知道哪里出了故障，只能靠猜。

>年初我就强行猜了一次，幸运地解决了一个bug。

然后如果说线上问题毕竟不在现场，不好追踪的话，那么如果同样的问题发生在了调试阶段，你能看到的只是样式错乱的页面，也不会报给你任何错误信息，就很难让人接受了。

因此，【**猜**】是开发React-Native的一项重要技能。

![石头剪子布](/images/rn/guess.gif)

### Android 无头问题居多

这依然算是固有的稳定性问题。此类问题有两个特点：

1. 偶发不可复现；
2. 逻辑上不可能

不可复现的原因很繁杂，可能与设备型号、操作系统版本、软件版本、当前运存容量、用户操作路径都有关系。还有就是一些原则上根本不可能发生的错误。

这些问题由于迟迟无法解决，长时间耽误了我们全量的进程。最后属于不了了之，算是向bug妥协了。

### 性能差

相信我，KickOff 中“与Native具有相同或相近的性能”的说辞是不成立的，特别是在Android上。

为了提升性能，我们不得不把能耗高的部分交给Native去实现，但这样显然又减弱了效率的优势。

### 兼容客户端版本

如果说Web可以不考虑浏览器环境，做到始终如一的版本发布，没人会有异议，但React-Native不行。

React-Native是运行在客户端上的，它的行为和格调都必须与当前客户端的环境相匹配。

这意味着，一套React-Native代码必须考虑到多个客户端环境。特别是在视觉大改版的情况下，React-Native融入两套视觉代码，是什么感觉你造吗？

根据版本号的if-else逻辑目前已充斥相当一部分逻辑代码中，代码越来越不够优雅。

### 文本渲染不准确

我们已经有充分的证据证明React-Native在渲染文本特别是多行文本时存在明显的bug。这导致我们不能按照设计的预期严格的排版。

此问题很深奥，而且以目前的能力来看，基本无解。

### 坑多多

这些坑不一定是不可解决的，其实大部分我们都可以通过规避来解决，但问题是如果不进行全网搜索，你很难提前预知风险，也就严重影响了效率，往往一个奇葩的问题能耽误你一天的时间。

<https://github.com/super-fe/superfe-rn-troubleshooting/issues>

---

总结来看，应用React-Native技术带来的收益并非是特别明显的，在我看来，它最大的贡献是把一拨做业务的人悄无声息地分成了两拨，显然迭代效率就上来了。

客观上，你不能无视上面提到的各种问题，但这些问题说严重就严重，说不严重也不严重，总体看来是可勉强接受的，相对于传统的客户端开发方式，依然是*各向同性的*。

从最初的腹黑到今天的淡然面对，深深感到世界系统的复杂性以及熵增的强大扭矩，革命性没那么容易，起码React-Native不是。