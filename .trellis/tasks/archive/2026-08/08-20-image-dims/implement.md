# 图片显式尺寸 — 执行计划

## 前置确认

- 确认当前 `content/posts/*.html` 中 21 张图都有 `width`/`height` 属性（作为回填数据源）；若无则先临时构建一次

## 步骤

1. **存量回填**（先做，用旧构建的属性）
   - 写一次性脚本 `scripts/backfill-image-dims.js`：读 `content/posts/*.html` 建 `<url → {w,h}>` 映射 → 逐篇 `.md` 把 `![...](url)` 的管道参数补上高度（保留原 pos/w）；无管道且命中映射的补 `![|w h]`；纯 `![alt](url)` 不动
   - 运行后 `grep` 抽查每篇，确认 21 张图全部带高度
   - 记录：仅当脚本把当前 `![|600]` 写成 `![|600 352]` 这类（正确）

2. **语法扩展**（scripts/build-posts.js remarkImagePipe）
   - widthPart 改按 `\s+|x|×` 拆分出 `[w, h?]`；`h` 存在才写 `hProperties.height`
   - 编译 `node scripts/build-posts.js`，用临时测试内容验证四种写法产物属性正确

3. **删除尺寸解析**（scripts/build-posts.js）
   - 删 `fetchImageDimensions` / `dimCache` / `parsePNG/JPEG/WebP/GIF`；`rehypeImageLazy` 改纯同步（不再 await fetch），保留 src/data-src/lazy class 与 remark 写的 width/height
   - 移除不再使用的 import（无则跳过）
   - `node scripts/build-posts.js` 通过；确认无网络请求（构建日志无 [lazy] 相关，且耗时回秒级）

4. **验证（对应 prd.md Acceptance Criteria）**
   - 语法矩阵：`![|600 400]` / `![|600]` / `![|left 300 200]` / `![alt]` / `![|300×200]` 产物属性逐一 grep
   - 构建耗时：`time node scripts/build-posts.js && time npm run build` 对比（应无 10s 网络段）
   - 浏览器（vite preview）：桌面 + 移动端视口——占位 4:3 贴合、真实图完整无裁剪、带尺寸图无跳动、淡入、主题跟随、错误态、灯箱
   - 存量：21 个 img 宽高与回填前一致（grep 比对）
   - 移动端：`height:auto` 下无裁剪（回归）
   - 语法向后兼容：`![|600]`、`![|left 300]`、`![left](url)` 原语义

5. **文档**
   - `Templates/new-post.md`：图片语法示例加高度写法
   - `content-pipeline.md`：懒加载段落改写（显式尺寸语法、预设 4:3 盒、无构建期解析、height:auto 规则）

## Review Gates

- 步骤 1–3 完成 + 全量验证通过 → 用户预览确认 → spec/模板更新 → 提交（`feat: 图片显式尺寸` + `chore(spec)`）
- push 前询问

## Rollback

- 还原 `scripts/build-posts.js`（git checkout 单文件）+ 还原回填的 `.md`（git checkout 单篇或整批）+ 还原模板/spec 即完全回退
- 无数据迁移；占位图/客户端零改动
