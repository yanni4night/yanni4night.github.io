---
layout: post
title: "prettier配合eslint执行自动化代码格式化"
date: 2018-09-21 17:24:25 +0800
categories: js
---
[eslint](https://eslint.org/) 早已取代 [jslint](https://www.jslint.com/) 成为了 JavaScript 标准的风格检查工具，提供了大量规则（rule）。这些规则部分是可以支持 *fixable* 的，也就是说可以自动修复代码。但是现在来看，eslint 提供的修复功能还是太弱。因此 Facebook 开发了 [prettier](https://prettier.io)，一个专门司职代码格式化的工具，它不仅仅支持 JavaScript 语法，甚至还支持 Markdown。因此，把它们配合起来是一种自然而然的想法，首先我们有一个 eslint-config 定义，我们希望经过 format 之后的代码能100%通过 lint 校验。我们也希望在 git hook 中能自动 format 代码。

在实际应用中，让 prettier 完美配合 eslint 并不容易。根本原因在于 prettier 格式化代码的一些行为是不可配置的，而这些配置极有可能与 eslint 配置是冲突的。

例如下面的代码：

```js
a === 1 || b === 2 || c ===3
```

在 eslint 中，我们经常配置在折行时把符号写在前边：

```js
a === 1
|| b === 2
|| c ===3
```

但 prettier 则强行写在后面：

```js
a === 1 ||
b === 2 ||
c ===3
```

prettier 提供了与 eslint 配合使用的[官方方法](https://prettier.io/docs/en/eslint.html)。但这种方式的本质是使用 eslint-config-prettier 来抹平 prettier 与 eslint 之间不可调和的冲突。一旦我们定义的私有 eslint-config 与 eslint-config-prettier 有影响格式化结果的冲突，那么 lint 必然失败。不过这种方式的一大好处是仅仅对接 eslint 就能完成 lint 与 fix 的操作，集成性很强。

理解这种现象很容易，eslint 的 rules 是没有顺序的，因此在 fix 阶段，极有可能 prettier 的 rule 执行在最后阶段，结果显然与我们定义的最终 eslint 配置是冲突的。

---

相比于引用一系列 eslint-config，并维护它们的顺序，我们索性只维护我们自己的一份 eslint-config，反而更清晰。有这一份配置来执行 fix，产出一定可以通过lint。

但我们肯定不想直接抛弃 prettier，那么就把它的执行放在最前面，让它的产出再通过 eslint 即可。

已经存在这种现成的解决方案，就是 [prettier-eslint](https://github.com/prettier/prettier-eslint)。虽然看起来比较畸形，但可能是唯一一种比较能用且清晰的方案了。

但也有缺点，一旦将来某些 prettier 的不可配置的行为也不能被 eslint 所 fix，工作流就 gg 了。整合的过程就是这样，本来是相互分离的两个系统，让它们一起工作，总要失去点什么。

> Code ➡️ prettier ➡️ eslint --fix ➡️ Formatted Code ✨

Q：如果能保证 prettier 提供的 rule 能先行执行呢？