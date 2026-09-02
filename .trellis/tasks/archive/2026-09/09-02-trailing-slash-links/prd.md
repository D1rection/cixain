# 统一 Sitemap 与站内链接尾斜杠

## Goal

Sitemap、SEO 元数据、站内导航和文章互链直接使用静态主机规范尾斜杠 URL，避免额外 301。

## Requirements

- TBD

## Acceptance Criteria

- [ ] TBD

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
# P2：Sitemap 与站内链接使用规范尾斜杠

## 需求

GitHub Pages 目录型页面的规范地址带尾斜杠。所有客户端站内路由链接和构建期 SEO 输出应直接写入该地址，避免无斜杠地址先被 301 到目录地址。

## 验收标准

- 文章、分类、标签、系列、归档、关于、分页、搜索和目录链接带尾斜杠；锚点写成 `/path/#anchor`。
- `build-seo.js` 生成的 Sitemap 页面 loc、Feed 文章 link/id、IndexNow/Baidu URL 带尾斜杠。
- SSR 的 canonical 与 JSON-LD 保持同一规范地址，根路径仍为站点根地址。
- 生成构建产物后不存在页面 URL 的无斜杠版本。
