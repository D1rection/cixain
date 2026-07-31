# 文章底部模块 — 技术设计

## 1. 组件结构

新建一个组件 `PostEnd.jsx`（含 `PostEnd.module.css`），在 `BlogPost.jsx` 的文章内容之后渲染：

```
<article>
  <ReadingProgress />
  <标题区 />
  <TableOfContents />
  <div ref={contentRef} className={styles.content}>  ← 正文
    <SegmentsRenderer />
  </div>
  <PostEnd post={meta} posts={posts} />              ← 新增
</article>
```

`PostEnd` 内部三个子区块（同一组件内，不拆文件）：

```
<div class="end">
  <PrevNext />        ← 上一篇/下一篇（有数据才渲染）
  <RelatedPosts />    ← 相关推荐（有数据才渲染）
  <Copyright />       ← 版权声明（恒渲染）
</div>
```

## 2. 数据计算

全部在 `PostEnd.jsx` 内用 `useMemo` 计算，输入 `meta`（当前文章）+ `posts`（全部文章，已按 date 降序）。

### 2.1 上一篇/下一篇

posts 已按 `date 降序` 排序（`build-posts.js` 排序后写入 posts.json，首页/归档共用同一顺序）。取当前文章在数组中的 index：

```javascript
const idx = posts.findIndex(p => p.slug === meta.slug)
const next = idx > 0 ? posts[idx - 1] : null      // 下一篇（更新的）
const prev = idx < posts.length - 1 ? posts[idx + 1] : null  // 上一篇（更旧的）
```

注意：posts 中可能含 draft（dev 模式），生产构建已过滤；dev 下无影响。

### 2.2 相关推荐（tag 重叠）

```javascript
const related = useMemo(() => {
  const curTags = new Set(meta.tags || [])
  if (curTags.size === 0) return []
  return posts
    .filter(p => p.slug !== meta.slug)
    .map(p => ({ post: p, score: (p.tags || []).filter(t => curTags.has(t)).length }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.post.date) - new Date(a.post.date))
    .slice(0, 3)
    .map(x => x.post)
}, [meta, posts])
```

- 分数 = 共同 tag 数量
- 同分按日期新→旧
- 取前 3
- 空数组 → 整个模块不渲染

## 3. 布局与间距

### 3.1 留白调整

`PostContent.module.css:3`：
```css
padding: 24px 0 70vh;   →   padding: 24px 0 0;
```

新增模块自带上下间距（`margin: 48px auto 0`），正文结束即接模块，不再有 70vh 空白。

### 3.2 容器

```css
.end {
  max-width: 680px;
  margin: 48px auto 0;
  padding: 0 16px;
}
```

与正文宽度一致（正文容器 max-width 680 + 16px padding，见 BlogPost.jsx 标题区和 TableOfContents.css 的 .toc 移动端）。

### 3.3 分区

| 区块 | 结构 | 关键样式 |
|------|------|----------|
| PrevNext | 两栏 flex（左 上一篇 / 右 下一篇）| 上边框 2px，标签小字 muted + 标题 0.95rem |
| RelatedPosts | 标题「相关推荐」+ 卡片列表 | 卡片：2px border + `3px 3px 0` 硬阴影（复用 TagChip 设计语言），hover 阴影收拢 |
| Copyright | 单行小字 | font-size 0.8rem，muted，居中或左对齐 |

### 3.4 风格对齐（现有设计语言）

- 硬阴影：`box-shadow: 3px 3px 0 var(--color-text)`（TagChip 同款）
- hover：`box-shadow: 1px 1px 0; transform: translate(2px, 2px)`
- 边框色：`var(--color-border)`；文字：`var(--color-muted)` / `var(--color-text)`；强调：`var(--color-accent)`
- 版权文案：`© 2026 Cicada · CC BY-NC-SA 4.0`（与 Footer 一致，Footer.jsx 已有同款链接）

## 4. 移动端

- 容器无固定宽度依赖，max-width 680 自适应
- PrevNext 两栏在窄屏保持并排（单行文字短，无需换行）；若溢出可加 `flex-wrap: wrap`
- 相关推荐卡片列表纵向堆叠

## 5. 不涉及

- 不改动 build 脚本（posts.json 已有全部所需字段）
- 不改动静态渲染（组件在客户端渲染，SSG 输出为空但 SPA hydrate 后出现；BlogPost 其他动态组件如 ReadingProgress 同样处理）

## 6. 变更文件

| 文件 | 改动 |
|------|------|
| `src/components/PostEnd.jsx` | 新建 |
| `src/components/PostEnd.module.css` | 新建 |
| `src/pages/BlogPost.jsx` | 引入并渲染 PostEnd |
| `src/components/PostContent.module.css` | 70vh → 0 |
