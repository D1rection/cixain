# 个人博客搭建方案

## 技术栈

| 项 | 决定 |
|----|------|
| 构建工具 | Vite |
| UI 框架 | React |
| 路由 | react-router（BrowserRouter + StaticRouter 预渲染） |
| 样式 | CSS Modules |
| 内容格式 | 纯 Markdown（.md） |
| 交互组件 | 代码块标记 `react:ComponentName` |
| 部署 | 自建服务器（Nginx → dist/）→ 后期可迁 GitHub Pages |

---

## 内容模型

### frontmatter

```yaml
---
title: 文章标题          # 必需
date: 2026-06-23        # 必需
description: 一句话描述   # 必需
category: Tech          # 可选，大方向分类
tags: [React, Vite]     # 可选，细粒度标签
draft: false            # 可选
cover: /images/x.jpg    # 可选
---
```

### 目录结构

```
content/posts/           # 平铺，slug 唯一标识
  hello-world.md
  ...
  posts.json             # 构建生成的元数据索引
  posts/                 # 构建生成的文章 HTML 内容
    hello-world.html
    ...
```

---

## 页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 文章列表，支持 `?tag=` / `?category=` 过滤 |
| `/blog/:slug` | 文章详情 | Markdown 渲染 + react:xxx 交互组件注入 |
| `/about` | 关于页 | 单独 Markdown 文件渲染 |

Tags 和 Categories 不单独成页，文章卡片上点击标签/分类链接回到首页并附带筛选参数。

---

## 构建管线

### 内容管线（build-posts.js）

```
遍历 content/posts/*.md
  → gray-matter 提取 frontmatter
  → slug = 文件名（去掉 .md）
  → compiled HTML = unified + remark + rehype 管线
  → 处理 react:xxx 代码块标记（替换为占位符）
  → 输出：
    content/posts.json        ← 所有文章的元数据数组
    content/posts/[slug].html ← 正文 HTML
```

### 页面预渲染（static-renderer.js）

```
读取 posts.json
  → 构造路由列表：/ + /about + /blog/*（每篇文章一条）
  → 对每条路由：
    StaticRouter → renderToString → 完整 HTML 字符串
  → 写出到 dist/[path]/index.html
```

---

## 项目目录骨架

```
my-blog/
├── content/
│   └── posts/
│       ├── hello-world.md
│       ├── building-a-blog.md
│       └── ...
├── src/
│   ├── components/
│   │   ├── PostList.jsx
│   │   ├── PostCard.jsx
│   │   ├── PostContent.jsx
│   │   ├── TagChip.jsx
│   │   └── InteractiveWrapper.jsx    # react:xxx 组件渲染容器
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── BlogPost.jsx
│   │   └── About.jsx
│   ├── App.jsx
│   └── main.jsx
├── scripts/
│   ├── build-posts.js               # 内容构建（扫描 MD → JSON + HTML）
│   └── static-renderer.js           # 页面预渲染（StaticRouter → HTML）
├── public/
├── vite.config.js
└── package.json
```

---

## 核心依赖

| 用途 | 包 |
|------|----|
| 构建工具 | `vite`, `vite-plugin-react` |
| 路由 | `react-router-dom` |
| Markdown 编译 | `unified`, `remark-parse`, `remark-rehype`, `rehype-stringify` |
| frontmatter 解析 | `gray-matter` |
| 代码高亮 | `rehype-highlight` 或手写 |
| react:xxx 标记 | 手写 remark 插件（~30 行） |

---

## 实现顺序

```
Step 1: Vite + React + react-router 项目骨架
Step 2: 内容管线（scan → parse → posts.json + HTML）
Step 3: 首页（PostList + PostCard + 标签筛选）
Step 4: 文章详情页（Markdown 渲染 + react:xxx 注入）
Step 5: 关于页
Step 6: 页面预渲染（StaticRouter → 静态 HTML）
Step 7: Nginx 配置 → 上线
Step 8: 自定义 UI 交互（动画、3D、微交互……）
```
