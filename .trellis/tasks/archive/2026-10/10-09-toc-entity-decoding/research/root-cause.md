# 原因与本地验证

日期：2026-10-09。只读调查与内存中原型，没有修改应用代码。

## 实际复现

`content/posts/2026-10-09-001.md:178` 原文：

```text
### 4.2 Necessary conditions & Suﬃcient conditions
```

真实 compileMD 输出：

```html
<h3 id="42-necessary-conditions-amp-sucient-conditions">4.2 Necessary conditions &#x26; Suﬃcient conditions</h3>
```

React SSR Probe 调用真实 useHeadingAnchors 后，toc.text 仍含 `&#x26;`。React 文本节点输出：

```html
<a>4.2 Necessary conditions &amp;#x26; Suﬃcient conditions</a>
```

因此目录显示实体字面量。正文正常解释 HTML 的 &#x26;。

## 代码定位

- src/hooks/useHeadingAnchors.js:20 只去标签。
- src/components/TableOfContents.jsx:92 用 React 文本显示 item.text。
- scripts/build-history.js:140 历史目录同样遗漏解码。
- scripts/build-posts.js:650-667 既有 ID 保留转义语义，不应改动。
- src/pages/BlogPost.jsx:66-73 最新目录来自 hook，比较目录来自 JSON。
- FragmentPage 复用同一 hook。
- scripts/build-history.js:221-228 generation 包含 COMPILER_VERSION。

## 解码原型

package-lock 与已安装 entities/package.json 确认间接依赖 6.0.1。已读其 README、exports 和源码：提供 ESM 的 entities/decode 与 decodeHTML。实施时须声明直接依赖。

| 输入 | 一次 decodeHTML 输出 |
| --- | --- |
| `A &#x26; B / A &#38; B / A &amp; B` | `A & B` |
| `A &lt; B` | `A < B` |
| `&quot; &apos; &nbsp; &copy;` | 双引号、单引号、NBSP、© |
| `&amp;#x26;` | `字面量 &#x26;` |
| `&#x1F600;` | 😀 |
| `&#x110000;` | U+FFFD，无异常 |
| `&unknown;` | 原样保留 |
| `&#x3C;img src=x onerror=alert(1)&#x3E;` | `普通字符串 <img src=x onerror=alert(1)>，必须仍用 React 文本显示` |

没有可调用的 Context7 工具。官方仓库 https://github.com/fb55/entities/tree/v6.0.1 请求失败，不宣称完成在线官方文档核查。接口证据来自本地实际版本。

## 工作流记录

已读 .trellis/workflow.md，Codex 默认 inline，本轮不派发代理。项目、用户 .agents/.codex 技能目录未找到 trellis-brainstorm，依据现有工作流完成规划文档。用户尚未授权实施，任务保持 planning。
