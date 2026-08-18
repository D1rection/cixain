# 文章内容页 meta 信息调研

## 一、业界通用 meta 清单（文章页头部）

| 信息 | 惯例 | 说明 |
|------|------|------|
| 发布时间 | 必备 | 所有博客 |
| 更新时间 | 技术博客/教程常见（Hugo `lastmod`、schema.org `dateModified`） | 提示内容新鲜度，易过时内容价值高 |
| 阅读时长/字数 | Medium / Ghost / Hugo 主题标配 | "约 X 分钟 · N 字" |
| 分类 / 标签 | 可点击 chip；标签常在头部或文末 | 导航与关联 |
| 系列/连载位置 | 教程系列显示"第 n 篇/系列名" | 上下文定位 |
| 作者 | 单作者博客常省略 | 作者=站主 |
| 赞数/评论/浏览 | 平台属性 | 静态站无后端不适用 |

## 二、排布惯例

- 标准形态：标题 → 一条 muted 小字 meta 行（`日期 · 阅读时长 · 分类`）；可点击标签以 chip 另起一行或行尾。
- 更新时间显示为"更新于 YYYY-MM-DD"，与发布时间并列。
- SEO：`datePublished / dateModified / wordCount / timeRequired` 为 Article schema 标准字段（本次范围不做 SEO 改动，仅记录）。

## 三、本博客现状与数据层

**现状（BlogPost.jsx 头部）**：标题 + 一条 muted 小字：`toLocaleDateString('zh-CN')` 日期 + `· category`。标签只在文末相关推荐处出现，系列在 TOC 侧边。

**数据层（posts.json 实际字段）**：`slug/title/date/description/category/tags/series/seriesIndex/draft/cover`。
- 无 `updated` → 需 build 注入（frontmatter 可选字段）
- 无阅读时长/字数 → 可计算（本次用户未选）
- 用户已确认新增：**更新时间** + **标签**

**注入点**：`scripts/build-posts.js` posts.push 构造处（619-629 行），现有 `date` 经 `parseDate` 校验；`updated` 同法处理，未写 frontmatter 则为 null。

## 四、方案要点（本次范围）

1. `updated`：frontmatter 可选（`updated: 2026-08-19`），build 注入 posts.json；未写 → null。
2. 渲染语义：`updated` 存在且 ≠ 发布时间 才显示"更新于 …"（不重复、不造假）。
3. 标签：复用现有 `TagChip`（param="tag"），头部 meta 区 chip 排布。
4. 样式：头部内联 style 迁入新建 `src/pages/BlogPost.module.css`（页面级样式收归 CSS Module，符合项目规范）。
5. 不动：阅读时长/系列进度/作者、列表页、SEO schema（超出确认范围）。