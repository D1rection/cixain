# Implement: RSS feed 混合内容策略

改动集中在 `scripts/build-seo.js` 一个文件（lightweight，无 design 单独文件）。

## 改动清单

### 1. 常量

```js
// 最近 N 篇输出全文，更早仅摘要（订阅器内读新文 + 控制 feed 体积）
const FEED_FULL = 3
```

### 2. feed 模板 xmlns

```xml
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
```

### 3. entry 生成（`feedPosts.map` 内）

```js
feedPosts.map((p, i) => {
  const html = readFileSync(join(contentDir, 'posts', `${p.slug}.html`), 'utf-8')
  const tags = ...
  const full = i < FEED_FULL
  // 缩略图：cover 优先（归一为绝对 URL），否则 og 图
  const thumb = /^https?:/.test(p.cover || '') ? p.cover
    : p.cover ? `${SITE_URL}/${p.cover.replace(/^\/+/, '')}`
    : `${SITE_URL}/og/${p.slug}.png`
  return `  <entry>
    <title>...</title>
    <link href="..."/>
    <id>...</id>
    <published>${new Date(p.date).toISOString()}</published>
    <updated>${new Date(p.updated || p.date).toISOString()}</updated>
    <summary>${escapeXml(p.description || '')}</summary>
    <media:content url="${escapeXml(thumb)}" medium="image"/>
${full ? `    <content type="html">${escapeXml(html)}</content>` : ''}
${tags}
  </entry>`
})
```

注意：

- `<content>` 输出顺序在 tags 前、缩进对齐（现有模板 tags 前无缩进，保持原样即可，改动最小）
- escapeXml 同样作用于 media url（`&` 等）
- `p.updated` 为 git 注入的 ISO 时间，`new Date(p.updated || p.date).toISOString()` 兜底

## 验证步骤

1. `npm run build`（vite build 会清 dist，然后 static-renderer + build-seo 重新生成 feed.xml）
2. 断言（node 脚本）：
   - gz(feed.xml) ≤ 60KB
   - `<content type="html">` 出现次数 == 3，且只在前 3 个 entry
   - 每条 `<updated>` == 该文 `p.updated || p.date`（从 content/posts/posts.json 对照）
   - 每条有 `<media:content`
   - `dist/og/{slug}.png` 存在（前 3 条全文文章的图）
   - XML 可解析（python xml.etree 或 xmllint）
3. `public/feed.xml` 与 `dist/feed.xml` 内容一致
4. dev 模式（build-posts --dev 后 public/feed.xml 结构正确）

## 回滚点

- 单文件改动，`git revert` 或手动还原 feed 模板即可
- spec 更新：`.trellis/spec/frontend/ssg-pipeline.md` 的 Feed Generation Rules 表需补「混合策略」行