# PRD: 归档页面

## 问题

博客缺少一个按时间线浏览全部文章的入口，目前只有首页（带分页）和分类/标签筛选。读者想快速扫一眼所有文章没有好方式，自己也无法看到全站产出概览。

## 设计

### 路由

`/archive`

### 视觉风格

贴合博客主题：
- 标题「归档」使用 `--font-pixel` 像素字体、小号大写、`--color-muted`
- 年份用粗体 + 底部细线分隔（`border-bottom: 1px solid var(--color-border)`）
- 月份用小号 `--font-pixel` 字体、`--color-muted`
- 文章行：`▸ MM/DD  标题`
  - `▸` 和日期使用 `--color-muted`
  - 日期用 pixel font 小字
  - 标题使用 `--color-text`，hover 变 `--color-accent`
  - 点击跳转 `/blog/:slug`
- 空状态：`暂无文章`

### 布局

```
                     归档
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2026
━━━━━━━━━━━━━━
2月

▸ 02/06  C2 Triangle rasterization
▸ 01/13  C1 Bresenham's line drawing
```

- 页面宽 `max-width: 680px`，居中（跟文章内容区一致）
- 年份分组，posts 按 `date` 倒序
- 年份之间保持分隔线，年份之间留空

### 数据

复用 `useBlogData().posts`，在客户端按月分组渲染。不需要额外数据加载。

### 改动范围

| 文件 | 改动 |
|------|------|
| `src/pages/Archive.jsx` | 新页面组件 |
| `src/pages/Archive.module.css` | 样式 |
| `src/App.jsx` | 加 `/archive` 路由 |
| `src/components/NavBar.jsx` | 导航栏加「归档」链接（放在首页/关于之间） |
| `scripts/static-renderer.js` | 加 `/archive` SSG 路由，传入 `posts` |
| `scripts/build-seo.js` | 加 `sitemap.xml` 条目 |
| `.trellis/spec/frontend/ssg-pipeline.md` | 更新 SSG 路由表 |

### 不做的事

- 不渲染描述和标签（保持紧凑，归档就是用来快速扫的）
- 不做分页（文章量小，一次性展示所有年份）
- 不加交互（年份折叠等），以后再说
