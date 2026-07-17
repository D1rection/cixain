# SEO 优化：robots.txt、SITE_URL、JSON-LD

## Goal

网站部署在 GitHub Pages + 自定义域名 `blog.cicadae.cloud`，搜索引擎无法搜到。补充基础 SEO 基础设施，让爬虫能发现和收录。

## Requirements

1. 添加 `public/robots.txt`，允许所有爬虫，声明 sitemap 路径
2. 修正构建脚本中的 `SITE_URL` 为 `https://blog.cicadae.cloud`
3. 文章页增加 JSON-LD `Article` 结构化数据

## 涉及文件

- `public/robots.txt` — 新建
- `scripts/build-seo.js` — 修改 SITE_URL
- `scripts/static-renderer.js` — 修改 SITE_URL，增加 JSON-LD

## 验收标准

- [ ] `public/robots.txt` 存在且内容正确，包含 `Sitemap` 声明
- [ ] sitemap.xml 中所有 `<loc>` 使用 `blog.cicadae.cloud` 域名
- [ ] 文章页 HTML 包含 JSON-LD `Article` schema
- [ ] 构建无报错
