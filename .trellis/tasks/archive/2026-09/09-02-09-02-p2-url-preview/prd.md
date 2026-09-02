# 修复图片预览历史污染与 URL 301

## Goal

修复图片预览打开时污染浏览器历史，以及统一 Sitemap 和站内链接的规范尾斜杠，消除额外 301。

## Requirements

- TBD

## Acceptance Criteria

- [ ] TBD

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
# P2：图片预览历史与 URL 规范化

## 背景

站点图片预览打开时会写入一条额外的浏览器历史记录；静态主机对目录页要求尾斜杠，而 Sitemap 与站内路由链接仍输出无尾斜杠地址，访问时会额外经历一次 301。

## 目标

1. 图片预览不新增浏览器历史条目，关闭预览不改变正常页面后退行为。
2. 所有站内页面 URL、Sitemap、Feed/SEO 生成的页面 URL 直接使用带尾斜杠的规范地址；根路径和静态资源路径保持现状。

## 约束

- 保持 SSG 与开发环境的 wouter 路由兼容性。
- 不修改用户当前未提交的 Obsidian、内容和生成文件变更。
- 不为分页查询参数生成新的 `/page/N` 路由。

## 验收标准

- 图片预览打开/关闭不会调用 `history.pushState`，页面历史长度不增加；浏览器后退仍能正常离开当前页面。
- 文章、分类、标签、系列、归档、关于、分页、搜索、目录及文章互链的 href/navigate 地址均以 `/` 结尾（根路径除外）。
- `dist/sitemap.xml` 中所有页面 loc（根路径除外）带尾斜杠；Feed、IndexNow/Baidu URL、canonical 与 JSON-LD 页面 URL 一致。
- 构建成功，生成页面能被 wouter 在带尾斜杠地址下正确匹配。
