# Design：算法题帖呈现

## 数据流

```
frontmatter 平铺 meta（source / difficulty / url，全部可选）
  → posts.json 映射加 3 行透传
  → BlogPost 检测到任一字段 → 顶部渲染 <ProblemMeta/> 信息条
题干 = > [!fold] callout（markdown）→ rehypeCallout fold 分支 → <details>（默认收起）
```

## 组件

- `src/components/ProblemMeta.jsx` + `ProblemMeta.module.css`：一行信息条——来源徽章（accent 底）、难度（LC 三档色标）、`原题 ↗` 链接（新窗口）。任一字段存在即渲染；全缺返回 null。
- 渲染位：BlogPost content 容器内 SegmentsRenderer 之前。

## 管线（scripts/build-posts.js）

- `rehypeCallout` 增加 `fold` 分支（唯一新代码）：
  - 剥离 `[!fold]` 前缀 → summary = 首个 `<br>` 前文字（空则「题目描述」）
  - blockquote → `details[class="fold"]`（不加 `callout` 类，避免与既有 callout 样式打架），其余子节点移入
  - KaTeX 在 rehypeCallout 之后运行，details 内公式正常
- posts.json 映射透传 `source`/`difficulty`/`url`（`|| null`）。

## 样式

- `PostContent.module.css`：`.content details`/`summary`（卡片底色、边框、▸ 旋转指示，无 JS）。
- `ProblemMeta.module.css`：信息条（细边框 + 内边距，字号 0.9rem，CSS 变量）。

## 模板与演示

- `Templates/problem-post.md`：LC 完整示例 + 约定表 + fold 写作细节（含 CSP 差异：输入输出/限制写进题干或折叠标题）。
- 演示文 `content/posts/2026-08-26-001.md`（draft）：平铺 meta + fold 题干（含 $2^x$ 公式、示例、提示）+ 思路/解法（CodeCompare）/复杂度/易错点 + AG2 双链。

## 兼容性

- 旧文章无 `source/difficulty/url` → 不渲染信息条；callout 全走原路径（fold 分支是新类型，不冲突）。
- Dev 与 SSG 共用同一构建产物。