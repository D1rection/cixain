# 修复 /about SPA 导航内容空白

## 问题
SSG 加载 `/about` 时 `__BLOG_DATA__` 包含 `pageContent`，显示正常。但 SPA 导航（从首页点"关于"链接）时，`__BLOG_DATA__` 仍是首页数据，`pageContent` 为空，显示"介绍内容待补充"。

## 方案
`About.jsx` 中增加 fallback：当 `pageContent` 为空时，自动 fetch `/content/pages/pages.json` 获取内容。

## 涉及文件
- `src/pages/About.jsx`

## 验收标准
- [ ] SSG 直访 `/about` 正常显示
- [ ] 首页点击"关于"链接，内容正常加载（无需手动刷新）
- [ ] 无 hydration mismatch 警告
