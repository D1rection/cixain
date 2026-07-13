# 自定义域名 blog.cicadae.cloud

## Goal

将 GitHub Pages 从 `d1rection.github.io/cixain/` 迁移到 `blog.cicadae.cloud`。

## Requirements

- 修改 deploy.yml 的 VITE_BASE_URL 为 `/`
- 修改 deploy.yml 的 SITE_URL 为 `https://blog.cicadae.cloud`
- 旧链接自动 301 跳转到新域名

## Acceptance Criteria

- [ ] 访问 blog.cicadae.cloud 正常加载
- [ ] 资源路径正确（/assets/xxx.js）
- [ ] OG meta URL 为新域名
- [ ] sitemap/RSS URL 为新域名
