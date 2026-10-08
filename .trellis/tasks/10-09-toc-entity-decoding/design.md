# 设计：解码目录显示文字，保留章节链接

## 原因

Markdown 的 `&` 被合法序列化为 HTML 实体 `&#x26;`。普通目录与历史目录提取文字时都只去标签，没有解码，随后 React 把实体作为纯文本显示。正文按 HTML 渲染，因此正常。证据见 `research/root-cause.md`。

## 方案

新增 `src/utils/headingText.js`，导出纯函数 `decodeHeadingEntities(text)`。输入是已去除真实标签的文字，只执行一次 HTML 实体解码，不访问 DOM、不递归解码、不处理 slug。

使用依赖树中已有的 `entities@6.0.1`，实施时声明为固定版本直接依赖并更新锁文件。通过 `entities/decode` 的 `decodeHTML` 处理完整字符引用与非法码点，避免手写有限替换表。已核对本地安装包的版本、exports、README 和源码，并验证输入输出。Context7 当前不可用；实施时已成功核查官方仓库 https://github.com/fb55/entities 的解码说明，并对照本地 6.0.1 的 exports 与源码确认入口。

## 普通正文目录

在 `src/hooks/useHeadingAnchors.js` 分离两个值：

- `legacyText`：保持现有 `inner.replace(TAG_RE, '').trim()` 的结果，只供无预置 ID 时的 slug 回退。
- `text`：真实标签剥离后的文字经过共享函数解码一次，再 trim，写入 toc。

已有 ID 原样复用，idCount 和返回 HTML 逻辑不变。`BlogPost`、`FragmentPage` 已共用该 hook，无需分别修改。`TableOfContents` 继续使用 `{item.text}`。

不修改 `scripts/build-posts.js` 的 `rehypeHeadingAnchors` 或 `headingSlug.js`。实际标题的 ID 为 `42-necessary-conditions-amp-sucient-conditions`，其中的 `amp` 也必须保留；显示文字不能成为新的 slug 输入。

## 历史比较目录与缓存

在 `scripts/build-history.js` 中先去真实标签，再用同一函数解码，最后保持原有空白折叠与 trim。`revision-heading-N`、标题层级范围和比较 HTML 对应关系不变。

给本脚本的 `COMPILER_VERSION` 加专属 `toc-text-1` 后缀。generation 已包含此值，重新构建即产生新资源地址；无需改 JSON schema 或全站 `CONTENT_COMPILER_VERSION`。同次发布更新比较 JSON、页面 revisionHistory 指针和客户端资源。

## 顺序约束

必须先去标签，再解码一次，最后应用调用处原有显示空白规则，并以 React 文本节点输出。

- 不能先解码再去标签：`&lt;img ...&gt;` 是作者可见文字，会被标签正则误删。
- 不能循环解码：`&amp;#x26;` 应显示为字面量 `&#x26;`。
- 不能让解码影响无 ID 时的回退 slug。

## 取舍

| 选项 | 决定 |
| --- | --- |
| 共享纯函数与标准解码库 | 采用；Node、SSR、浏览器语义一致 |
| 只替换 `&#x26;` 或少量实体 | 不采用；遗漏合法实体，易重复解码 |
| DOMParser/textarea | 不采用；构建与 SSR 还需另一路实现 |
| 目录直接渲染 HTML | 不采用；破坏纯文本契约 |
| 修改正文序列化规则 | 不采用；正文转义合法，还可能改变锚点 |

## 改动范围

- 新增 `src/utils/headingText.js`。
- 修改 `src/hooks/useHeadingAnchors.js`、`scripts/build-history.js`。
- 修改 `package.json`、`package-lock.json` 声明直接依赖。
- 新增 `tests/content/toc-text.test.mjs`，扩展 `tests/revisions/heading-links.test.mjs`。
- 实施完成后更新 frontend 的 `hook-guidelines.md`、`content-pipeline.md`：记录显示文字与锚点分离、单次解码、历史资源版本规则。

## 回滚

一起还原上述代码、依赖和历史构建版本，重新构建整套静态产物。不修改作者内容或外部章节链接。
