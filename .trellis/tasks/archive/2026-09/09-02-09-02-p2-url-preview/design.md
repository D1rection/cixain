# 技术设计

## 图片预览

移除预览挂载 effect 中的 `history.pushState`，保留 `popstate` 监听作为浏览器后退关闭预览的入口。由于后退本身会改变路由，组件只负责清理覆盖层，不制造额外历史状态。

## URL 规范化

新增轻量 URL 工具函数，将页面路由路径统一规范为尾斜杠（保留查询串和 hash）。组件中的 wouter `Link`/`navigate` 和 Markdown 互链统一调用该函数或使用带斜杠模板。构建脚本使用同一规则生成 Sitemap、Feed、IndexNow/Baidu URL；静态渲染器继续以带斜杠地址写 canonical/JSON-LD。

## 兼容性

wouter 的路由匹配允许可选尾斜杠，因此开发环境和直接输入无斜杠地址仍可渲染；新生成的链接全部指向规范地址。
