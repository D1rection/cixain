# 文章分页

## 目标

首页文章列表每页 10 篇，支持 `?page=N` 导航，SSG 产出 `/page/N/index.html`。

## 具体内容

1. `src/components/Pagination.jsx` + `.module.css` — 页码组件
   - 显示：`< 1 2 3 ... >`，当前页高亮
   - `?page=` URL 参数控制页数

2. 更新 `src/pages/Home.jsx` — 读取 `?page=`，slice posts 数组

3. `scripts/static-renderer.js` — 为每页单独生成路由和数据

## 验收标准

- [ ] 首页默认第一页，显示最新 10 篇文章
- [ ] 底部分页导航 visible
- [ ] `/?page=2` 显示第二页
- [ ] SSG 产出 `dist/page/2/index.html`
- [ ] 侧栏筛选与分页共存
- [ ] 页码不超过总页数时正常显示
