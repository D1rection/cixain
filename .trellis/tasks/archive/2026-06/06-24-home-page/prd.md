# 首页文章列表

## 目标

实现首页：PostList 文章列表、PostCard 文章卡片、标签/分类筛选。

## 具体内容

1. `src/components/PostCard.jsx` + `PostCard.module.css`
   - 显示文章 title、date、description、tags、category
   - 点击跳转到 /blog/:slug
2. `src/components/PostList.jsx` + `PostList.module.css`
   - 接收 posts 数组，渲染 PostCard 列表
   - 支持 empty state（无文章时显示提示）
3. 更新 `src/pages/Home.jsx`
   - 读取 posts.json（dev SPA 直接 import）
   - 根据 `?tag=` / `?category=` 查询参数筛选
   - 渲染 PostList
4. TagChip — 标签/分类显示样式

## 验收标准

- [ ] 首页显示文章卡片列表，标题、日期、描述可见
- [ ] `?tag=React` 筛选出带该标签的文章
- [ ] `?category=Tech` 筛选出该分类的文章
- [ ] 无筛选时显示全部文章
- [ ] 按下不存在的标签显示空状态
- [ ] 点击卡片跳转到 /blog/:slug

## 不包含

- 页面预渲染 — 后续 SSG 管线处理
- 样式精细化 — 基础排版即可
