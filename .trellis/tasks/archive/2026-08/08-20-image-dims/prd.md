# 图片显式尺寸

## Goal

去掉构建期对图片的尺寸解析（网络请求），改为**作者在 markdown 里显式声明尺寸**：`![|左中右 宽 高](url)`。作者给出完整宽高 → 精确占位盒、零 CLS；只给宽度/不给 → 以占位图固有 4:3 为预设盒（占位图完美贴合），加载时切到真实比例（一次可接受的跳动）。真实图始终按自身比例完整显示，绝不裁剪/变形。构建恢复零网络、秒级。存量 21 张图回填真实宽高，保持零 CLS。

## 背景事实

- 现状：构建期对每张外链图发 `Range: bytes=0-2047` 网络请求解析真实尺寸（PNG/JPEG/WebP/GIF），21 张图串行约 10s；这是构建变慢的根因
- 占位 SVG 固有 800×600（4:3）——浏览器在无 `height` 属性时会按此比例预留盒子，天然可作为「预设尺寸」，无需额外配置
- 已确认方向：不联网取真实尺寸（与主流静态博客一致）；现有 `![|600]` 管道语法是自定义扩展，可自然加高度

## Requirements

1. **语法扩展**：管道宽度后支持可选高度，`![|pos w h]`（分隔符空格 / `x` / `×`）；`h` 缺失时不写 `height` 属性
   - `![|600 400]` → `width=600 height=400`（精确盒，作者尺寸写对则零 CLS）
   - `![|600]` → 仅 `width=600`，无 `height`（占位盒 = 占位图 4:3）
   - `![|left 300 200]` → 定位 `img-left` + 双尺寸
   - `![alt](url)`（无管道）→ 无尺寸属性，响应式宽度 + 4:3 预设占位盒
2. **删除构建期尺寸解析**：`fetchImageDimensions` / `dimCache` / PNG/JPEG/WebP/GIF 解析全部移除，`npm run build`/`build-posts` **零网络请求**
3. **占位图保持 4:3**（即预设比例），双主题 + `loading` 字样 + 闪烁光标 + reduced-motion 不变（`src/utils/placeholderUri.js` 不动）
4. **CSS 不变**：`img.lazy { object-fit: cover; height: auto; opacity: 1 }`——`height: auto` 保证真实图永远按自身比例完整显示（作者尺寸写错也只是占位盒略不准，最终渲染不受影响）
5. **存量回填**：把当前 21 张图的真实宽高（已在现有 `content/posts/*.html` 的属性里）回填进 markdown 对应 `![|...]` 用法，保持零 CLS
6. **客户端不变**：懒加载 / `.loaded` 淡入 / 主题跟随 / 错误态均不涉及（`lazyImages.js` 不动）
7. **文档**：`Templates/new-post.md` 图片语法示例更新；spec `content-pipeline.md` 懒加载段落改写（无尺寸解析、显式尺寸语法、预设盒语义）

## Acceptance Criteria

- [ ] `npm run build` / `node scripts/build-posts.js` 全程**无任何网络请求**，构建耗时回到秒级（无 10s 量级延迟）
- [ ] `![|600 400](url)` 产物 `<img width="600" height="400">`
- [ ] `![|600](url)` 产物 `<img width="600">`（无 `height` 属性）
- [ ] `![|left 300 200](url)` 产物 `<img class="img-left" width="300" height="200">`
- [ ] `![alt](url)` 产物 `<img>` 无尺寸属性
- [ ] 所有图片真实渲染按自身比例完整显示，无裁剪、无变形（桌面 + 移动端）
- [ ] 占位阶段盒子 = 4:3（占位图完美贴合，无拉伸/裁剪占位图）
- [ ] 据有尺寸标注的图片（作者宽高正确）：滚动加载无布局跳动（盒比例从未变）
- [ ] 仅有宽度的图片：加载时一次轻微跳动（可接受），fade-in 掩盖
- [ ] 存量 21 张图 markdown 全部回填宽高，与旧属性值一致
- [ ] 占位图 / 淡入 / 主题跟随 / 错误态 / 灯箱 / 移动端无裁剪 回归通过
- [ ] `Templates/new-post.md` 与 `content-pipeline.md` 已更新

## Notes

- 语法向后兼容：`![|600]`、`![|left 300]`、`![left](url)` 原语义不变
- 占位「预设尺寸」= 占位 SVG 固有 4:3，不新增配置项
- 任务外遗留（不在本次范围）：dev 模式 dev 服务器会用 `--dev` 覆盖 `posts.json`（含草稿）的已知行为
