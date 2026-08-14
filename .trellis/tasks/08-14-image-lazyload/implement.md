# 图片懒加载 — 执行计划

## 前置

- 依赖：`npm i vanilla-lazyload`（^12.5.0）
- 确认 Node ≥ 18（内置 fetch）；当前 Node 版本先验证

## 步骤

1. **构建期尺寸解析**（scripts/build-posts.js）
   - 新增 `fetchImageDimensions(url)` + `dimCache`（PNG/JPEG/WebP/GIF 头解析，2KB Range）
   - 新增 `rehypeImageLazy` 插件（插件链末尾）：
     - 尺寸成功 → `src` 占位 data URI / `data-src` 原图 / `width`+`height`（比例换算）/ class 追加 `lazy`
     - 失败 → 跳过 + `console.warn`
   - 重建：`node scripts/build-posts.js` → 检查 `content/posts.json` 里某篇含图文章的 HTML 片段（grep `data-src`）

2. **占位/错误 SVG 常量**
   - 构建侧：PLACEHOLDER_URI（design §4）放 build-posts.js 顶部
   - 客户端：ERROR_URI 放 `src/utils/lazyImages.js`
   - 两图视觉一致（同底色/同字体族），仅文案不同

3. **客户端模块**（新增 `src/utils/lazyImages.js`）
   - `initLazyLoad()` / `updateLazyLoad()`（design §5）
   - `main.jsx` 顶部调用 init
   - `BlogPost.jsx`：内容注入后 `updateLazyLoad()`（useEffect 依赖 html）

4. **CSS**（PostContent.module.css）
   - `img.lazy` 占位 cover + opacity 过渡 + `.loaded` / `.error` 态（design §6）

5. **验证（对应 prd.md Acceptance Criteria）**
   - 构建产物检查：`grep -o '<img[^>]*>' content/posts/[slug].html` 确认全套属性 + 管道宽度保留
   - `npm run dev` 手测：网络面板（视口外不请求、滚动 200px 内触发）、淡入、灯箱点击、错误模拟（DevTools 改坏 URL 或断网）、`prefers-reduced-motion`（DevTools 模拟）
   - dev SPA 导航：A 文章 → B 文章，B 的图懒加载生效
   - 语法回归：`![|200]`、`![|right 300]`、`![alt](url)` 三种形态
   - 降级：DevTools 禁 IO（或旧浏览器 UA 模拟）→ 全量加载
   - `npm run build` 全链路（含 SSG 输出）通过

6. **spec 更新**（Phase 3.3）
   - `content-pipeline.md`：图片处理规则补懒加载段落（rehypeImageLazy、占位、尺寸解析、降级）

## Review Gates

- 步骤 1-4 完成 → 本地全量验证通过 → 用户 dev 预览确认
- 用户确认 → spec 更新 → 提交（Angular 规范，≤10 字，如 `feat: 图片懒加载`）
- push 前询问

## Rollback

- 还原代码文件：`scripts/build-posts.js`、`src/utils/lazyImages.js`（删除）、`main.jsx`、`BlogPost.jsx`、`PostContent.module.css`、`package.json`（npm uninstall vanilla-lazyload）
- 重建 posts.json / dist 即完全回退；无数据迁移
