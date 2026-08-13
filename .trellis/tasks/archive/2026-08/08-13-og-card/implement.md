# 实施计划 — OG 分享卡片

## 实施清单

1. **安装依赖**
   - `npm i -D sharp`
   - 验证：`node -e "import('sharp').then(m => m.default('x').metadata().then(console.log))"` 无报错

2. **新增 `scripts/generate-og.js`**
   - 读 `content/posts/posts.json`（仅非 draft），读 `SITE_URL`（默认 `https://blog.cicadae.cloud`）
   - SVG 模板函数：文章图（标题两行断行 + 省略号、信息行 series→category→仅日期）
   - 通用图模板：`default.png`
   - sharp 渲染 1200×630 PNG 到 `public/og/`
   - cover 文章跳过生成；清理不再存在的旧图
   - 验证：`node scripts/generate-og.js` 后 `ls public/og/` 数量 = 文章数 + 1，`sips -g pixelWidth -g pixelHeight public/og/<slug>.png` 为 1200×630

3. **package.json build 链接入**
   - `"build": "... && node scripts/generate-og.js && vite build ..."`（在 vite build 前，保证 public/ 复制进 dist）
   - 验证：`npm run build` 全链通过，`dist/og/` 有图

4. **static-renderer.js meta 注入**
   - `renderMeta` 增加 image/imageAlt 参数，注入 og:image 全套 + og:site_name/locale + twitter 卡
   - 路由侧：文章页 cover/生成图，其余页面 default 图
   - `renderJsonLd` 补 image/publisher/mainEntityOfPage
   - 验证：`npm run build` 后 grep dist 中文章页 HTML 含 `og:image` 绝对 URL + twitter:card；列表页含 default.png

5. **本地视觉验证**
   - 打开生成的 PNG（Read 工具直接看）人工核对：终端风格、中文渲染、两行标题、信息行
   - 构造超长标题临时验证断行+省略号（可用测试 slug 生成后删除）
   - 验证：截图确认与 PostEnd 视觉一致

6. **cover 覆盖验证**
   - 临时给某文章 frontmatter 加 `cover`，重建后该文章无生成图、meta 指向 cover URL；验证后还原
   - 验证：grep dist 文章页 og:image = cover URL

7. **质量检查（trellis-check）**
   - 全量 diff review + 回归

## 检查项（对应 PRD 验收标准）

- [ ] public/og/ 每篇 PNG + default.png，1200×630，<1MB
- [ ] 文章页 og:image 全套 + twitter 卡（绝对 URL）
- [ ] 列表页 default 图
- [ ] JSON-LD image/publisher/mainEntityOfPage
- [ ] 本地构建无报错
- [ ] curl 线上验证（若已部署）或 preview 验证

## 回滚点

- 每个 commit 前：生成图 + meta 注入分两个 commit，可独立回退
- sharp 异常时：`npm uninstall sharp` + 移除 build 链步骤即可恢复（generate-og.js 保留不调用）
