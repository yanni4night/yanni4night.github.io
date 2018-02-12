---
layout: post
title:  "Vue.js 中的 DOM Diff 算法"
date:   2018-02-12 14:41:01 +0800
categories: js
---

上一篇我们熟悉了一下 *Inferno.js* 的 DOM Diff 算法。今天我们来看 [Vue.js](https://vuejs.org/) 框架的 DOM Diff 算法。

*Vue.js* 的作者没有编写自己的算法，而是使用了 [Snabbdom](https://github.com/snabbdom/snabbdom)，并做了适当的修改。

DOM Diff 的关键算法在 <https://github.com/snabbdom/snabbdom/blob/v0.7.1/src/snabbdom.ts#L179>。

同样，我们依然假设有原始的 DOM 集合A为 “*dfibge*”，更新后的集合B为 “*igfheb*”。

创建4个指针 *oldStartIdx*、*oldEndIdx*、*newStartIdx*、*newEndIdx*，初始分别指向A的起始点、结束点和B的起始点、结束点。显然：

```js
oldStartIdx=0
oldEndIdx=5
newStartIdx=0
newEndIdx=5
```

第一步，比较 A[oldStartIdx] 和 B[newStartIdx]，如果相同，则 oldStartIdx++、newStartIdx++。
第二步，比较 A[oldEndIdx] 和 B[newEndIdx]，如果相同，则 oldEndIdx++、newEndIdx++。

在本例中，以上两步全部不满足，跳过。

第三步，比较 A[oldStartVnode] 和 B[newEndVnode]，如果相同，则节点发生了右移。
第四步，比较 A[oldEndIdx] 和 B[newStartIdx]，如果相同，则节点发生了左移。

在本例中，以上两步全部不满足，跳过。

第五步，在A中搜索 B[newStartIdx]，即 *i*，找到则把A中的 *i* 移到 A[oldStartVnode] 前面并 newStartIdx++、oldStartVnode++，否则则创建它。

在本例中，A变成 *idfbge*。

返回第一步。

---

可以看到这个算法类似于优化后的插入排序。按照此算法，A的变换路径为：

```
A:dfibge
B:igfheb

=>

A:idfbge
B:igfheb
  ^

=>

A:igdfbe
B:igfheb
   ^

=>

A:igfdbe
B:igfheb
    ^

=>

A:igfhdbe
B:igfheb
     ^

=>

A:igfhedb
B:igfheb
      ^

=>

A:igfhebd
B:igfheb
       ^
=>

A:igfheb
B:igfheb
       ^
```

用一句话概括此算法的核心就是：依次遍历B集合，在A集合中找到对应项，放到与在B集合中相同的位置上。只不过 *Snabbdom* 使用了双向同时遍历来进行优化。

事实上，React 的 DOM Diff 算法与此也是非常类似的。