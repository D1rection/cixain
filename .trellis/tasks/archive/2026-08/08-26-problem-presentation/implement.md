# Implement：算法题帖呈现

## 执行清单

1. `scripts/build-posts.js`：`rehypeCallout` 增 `fold` 分支（约 20 行）；posts.json 映射透传 `source`/`difficulty`/`url`（3 行）。
2. 新增 `src/components/ProblemMeta.jsx` + `.module.css`；`BlogPost.jsx` 顶部条件渲染。
3. `src/components/PostContent.module.css`：`.content details`/`summary` 折叠样式。
4. `Templates/problem-post.md` 题帖模板。
5. 演示文 `content/posts/2026-08-26-001.md`（`LC-231 2 的幂`，draft）。
6. 验证：dev 浏览器 DOM（信息条、折叠默认收起、展开含 KaTeX）、旧文章回归、`npm run build`、posts.json 字段。
7. spec 更新（content-pipeline.md：`source/difficulty/url` 可选字段 + fold callout 约定）；提交计划呈用户确认（不 push）。

## 防回归备忘（前一轮被否方案，勿重蹈）

- ❌ 嵌套 `problem` 对象 / JSON 式 YAML → 平铺键值。
- ❌ raw HTML `<details>`（CommonMark 排除名单 + remark-rehype 默认丢弃）→ fold callout 唯一入口。
- ❌ 样例/约束独立卡片 → 原文已含。
- fold 元素不加 `callout` class（避免双重样式）。