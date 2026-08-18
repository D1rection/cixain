# Design — 文章头部 meta 区

## 1. 数据流

```
markdown 文件（笔记）
   ↓ build-posts.js: spawnSync(`git log -1 --format=%cI -- <file>`)
updated = 该文件最后提交时间(ISO+时区) | null（无历史）
   ↓ 归一化 YYYY-MM-DD（Date 本地化）
posts.json: { ..., date, updated }
   ↓ useBlogData → BlogPost.jsx meta
渲染：updated && updatedDate !== publishedDate → "更新于 …"
```

**来源：仅 git（用户已确认）**。理由：
- mtime 在 CI（Vercel 拉取）会被重置，不可靠
- frontmatter 需要手工维护，用户选择不引入
- git 提交时间 = "笔记文件最后真正变更入库"的语义，实测 10 篇全部可得

注入实现（build-posts.js posts.push 前）：

```js
const { spawnSync } = require('node:child_process')  // ESM: import { spawnSync } from 'node:child_process'
function gitCommitDate(file) {
  const r = spawnSync('git', ['log', '-1', '--format=%cI', '--', file], { encoding: 'utf8' })
  const out = (r.stdout || '').trim()
  if (!out) return null
  // 归一化为 YYYY-MM-DD（本地时区日期）
  return new Date(out).toLocaleDateString('en-CA')  // 2026-08-18
}
```

无依赖、每次构建 10 次 shell 调用（量级无压力）。未提交新文件 → stdout 空 → null → 不显示。

## 2. 头部结构（BlogPost.jsx 改造）

```jsx
<article>
  <ReadingProgress />
  <header className={styles.header}>               {/* 原内联 div *}}
    <h1>{meta.title}</h1>
    <p className={styles.metaLine}>                 {/* 日期 · 更新于 · 分类 */}
      <time>{toLocaleDateString('zh-CN', {…})}</time>
      {showUpdated && ` · 更新于 ${formatUpdated}`}
      {meta.category && ` · ${meta.category}`}
    </p>
    {tags.length > 0 && (
      <div className={styles.tagRow}>
        {tags.map(t => <TagChip key={t} label={t} param="tag" />)}
      </div>
    )}
  </header>
  <TableOfContents … />
  <div ref={contentRef} className={styles.content}>…</div>
  <PostEnd … />
</article>
```

用语义化 `<header>`（质量指南要求语义化 HTML）。

## 3. BlogPost.module.css（新增）

| 类 | 规则 | 说明 |
|----|------|------|
| `.header` | `max-width: 680px; margin: 0 auto; padding: 32px 16px 0;` | 原内联容器 |
| `.metaLine` | `color: var(--color-muted); margin-top: 8px; font-size: 0.9rem;` | 保持 muted 小字 |
| `.tagRow` | `display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;` | chip 排布，节奏 0.5× 附近 |
| `.title` | 继承 h1 全局 | — |

不新增全局样式；`fmt`：日期保持现有 `toLocaleDateString('zh-CN')` 输出（如 2026/8/18）。

## 4. 边界与兼容

- `updated` git 无历史 → null → 不渲染（AC：未提交文件不显示）。
- `updated` 与 date 同日 → 不显示（避免"更新于 2026/8/18"与日期重复）。
- tags 为空数组 → 不渲染 tagRow（保持头部简洁）。
- 其他消费方（PostCard/PostEnd/列表页）不受影响：新增字段只读新值。
- dev 与 prod 同走 build-posts.js，行为一致。

## 5. 桌面/移动兼容（新增验收维度）

- **meta 行**：容器 `width: 100%` + `flex-wrap`/自然换行；"日期 · 更新于 X · 分类"三段用 `gap` 分隔而非硬空格，窄屏自动换行不溢出。
- **标签行**：`display: flex; flex-wrap: wrap; gap: 8px`——chip 超宽自动折行，375px 下不横向溢出。
- 验证：375px / 768px / 1440px 三档视口 + 亮/暗双主题计算样式与目测。

## 6. 风险

| 风险 | 缓解 |
|------|------|
| git 输出时区/格式差异 | `%cI` 固定 ISO 8601；Date 解析后统一本地日期 |
| CI 无 git 历史或 shallow clone | `spawnSync` 失败/stdout 空 → null，不显示（优雅降级） |
| 内联→module 迁移破坏布局 | 参数逐一迁移，dev 截图对比头部 |
| 时间库无 | 纯 Date API，无新依赖 |