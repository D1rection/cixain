# PRD: RSS feed 混合内容策略

## 背景

`dist/feed.xml` 现为「全文章完整正文」的 Atom feed：3.03MB（gzip 167KB）。实测摘要情况：

- 12 篇文章 description 字段全覆盖（可直接作摘要，无需正文截断）
- 12/12 篇文章 `updated != date`（均有 git 更新记录），但 feed 的 `<updated>` 用的是 `p.date`（`build-seo.js` 第 86 行）——订阅器无法检测「文章已更新」
- 条目无缩略图（`media:content`），订阅器列表无封面
- 已有基础：Atom 1.0、`rel="self"`、category、draft 过滤、date 降序、20 条上限

## 目标（方案 A：混合内容）

- **最近 3 篇全文**（订阅器内直接读新文），**更早文章改为 `description` 摘要**（引流回站 + 控制体积）
- 修复 `<updated>`：取 `p.updated || p.date`，订阅器能正确增量检测
- 每条补 `media:content` 缩略图（og 图或 cover）
- 其余行为不变：Atom 1.0 / rel=self / category / draft 过滤 / date 降序 / 20 条上限 / public + dist 双目录输出 / IndexNow / 百度推送

## 验收标准

可测量项（重建后）：

- `feed.xml` gzip 体积 ≤ 70KB（现状 167KB，降 ≥55%；实测 FEED_FULL=3 为 67.5KB，全文篇数增多会线性抬升）
- 前 3 个 entry 含 `<content type="html">`，第 4 条起不含（content 数量 == 3）
- 每个 entry 的 `<updated>` 等于该文 `updated`（或 `date`），不再是发布日期
- 每个 entry 含 `<media:content .../>`，其 url 指向存在的 og/cover 图（`dist/og/{slug}.png` 存在）
- entry 排序（date desc）、条数（20 上限）、draft 过滤不变；`public/feed.xml` 与 `dist/feed.xml` 均更新

可行为项：

- 用 python/浏览器 XML 解析 feed 无语法错误（命名空间 xmlns:media 正确）
- `npm run dev` 下 `public/feed.xml` 同步新结构