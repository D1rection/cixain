# PRD: RSS/Atom Feed 完善

## 问题

`scripts/build-seo.js` 已经在 build 时生成 `feed.xml`（Atom 格式），但存在三个问题：

1. **只有摘要** — 每篇文章只包含 `<summary>`（即 `posts.json` 中的 `description`），没有正文 HTML。RSS 阅读器读者无法直接阅读全文。
2. **不可发现** — HTML `<head>` 中没有 `<link rel="alternate" type="application/atom+xml">`，RSS 阅读器的自动发现功能无效，用户也找不到订阅入口。
3. **不过滤草稿** — `draft: true` 的文章也会出现在 feed 中。

## 方案

### 改动范围

| 文件 | 改动 |
|------|------|
| `scripts/build-seo.js` | Feed 加入全文 HTML、过滤草稿、按日期倒序、限 20 条、加 `<category>` 标签 |
| `index.html` | `<head>` 加入 feed 自动发现 `<link>` |
| `scripts/static-renderer.js` | `renderMeta()` 输出加入 feed 自动发现 `<link>`，所有 SSG 页面均生效 |
| `src/components/Footer.jsx` | 增加 RSS 图标链接 |

### 详细设计

**`scripts/build-seo.js`**:
- 读取 `content/posts/${slug}.html` 的完整正文，经 `escapeXml()` 转义后放入 `<content type="html">`
- 过滤 `draft: true` 的文章
- 按 `date` 倒序排列，取前 20 条
- 每篇文章加上 `<category term="标签名"/>`
- 保留现有 `<summary>`（文章描述）

**`index.html`**:
- `<head>` 中新增: `<link rel="alternate" type="application/atom+xml" title="Cicada's blog" href="/feed.xml">`

**`scripts/static-renderer.js`**:
- `renderMeta()` 输出中加上同上的 `<link>` 标签

**`src/components/Footer.jsx`**:
- 在版权信息旁增加一个 RSS SVG 图标链接，指向 `/feed.xml`

### 不做的事

- 不使用 CDATA，统一用 XML 实体转义（`escapeXml`），更规范
- 不生成 RSS 2.0 格式，Atom 更现代且能满足所有需求
- 不做多 feed（分类/标签维度的独立 feed），内容量不大暂时不需要
- 不改动 feed 路径（保持 `/feed.xml`）
