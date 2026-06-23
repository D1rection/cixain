# 文章详情页

## 目标

实现文章详情页：渲染文章 HTML、代码高亮展示、react:xxx 交互组件注入。

## 具体内容

1. `src/components/PostContent.jsx` + `PostContent.module.css`
   - 接收 HTML 字符串，用 dangerouslySetInnerHTML 渲染
   - 基础文章排版样式（标题层级、段落、引用、代码块等）
2. `src/components/InteractiveWrapper.jsx`
   - useEffect 中扫描 [data-interactive] 元素
   - 为每个占位符用 createRoot 挂载组件（先渲染占位文本表示组件已加载）
3. 更新 `src/pages/BlogPost.jsx`
   - 读取 slug 参数
   - 从 posts.json 查找文章元数据
   - fetch 加载 content/posts/[slug].html
   - 渲染 PostContent + InteractiveWrapper
   - 404 处理（slug 不存在时显示文章未找到）

## 验收标准

- [ ] /blog/hello-world 显示文章内容和代码高亮
- [ ] data-interactive 占位符被 InteractiveWrapper 扫描到
- [ ] 不存在的 slug 显示"文章未找到"
- [ ] 文章排版可读（标题、代码块、引用有基础样式）

## 不包含

- 页面预渲染
- react:xxx 真实组件（只显示占位文本）
