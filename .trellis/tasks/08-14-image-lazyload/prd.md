# 图片懒加载

## Goal

文章页图片懒加载，体验优先：统一终端风占位图 + 加载淡入 + 零布局跳动（CLS）；同时减少非视口图片的无效带宽。覆盖 SSG 与 dev SPA 两种模式。

## 背景事实

- 图只出现在文章详情页（列表页无图）；全部外链（jsDelivr CDN + 少量外部图），约 20 张，显示宽度 ≤600px
- 图片显示宽度构建期已知（`![|200]` 管道语法），真实尺寸未知（Retina 截图，如 600px 显示宽的图实为 1524×894）
- 现状：无任何懒加载；构建期 `rehypeImageLightbox` 已把每个 `<img>` 包进 `<a href=原图 data-action="preview" data-fslightbox>`
- 内容以 HTML 字符串存 `posts.json`，构建期注入的改动 SSG 与 dev 双模式生效

## Requirements

1. **懒加载机制**：文章内全部图片（含首图，无豁免）经 IntersectionObserver 懒加载，采用 `data-src` 模式；库选 vanilla-lazyload@12（约 2KB、零依赖、活跃维护）
2. **统一占位图**：不逐图生成占位；所有图片共用一张内联 SVG data URI 占位图（终端风：`cicada@blog:~$` + 闪烁光标），低对比（前景色 ~30% 透明度）、`prefers-reduced-motion` 下关闭动画；占位期 `object-fit: cover` 适配任意裁剪比例
3. **零 CLS**：构建期下载图片头 2KB（jsDelivr 支持 Range）解析真实尺寸，写 `width`/`height` 属性预留空间：
   - 管道宽度存在 → `width` 保持管道值，`height` 按真实比例换算
   - 管道宽度不存在 → `width`/`height` = 真实尺寸
4. **淡入**：图片加载完成加 `.loaded` 类 → CSS opacity 过渡
5. **错误态**：加载失败 → 元素加 `.error` 类 → 占位图替换为错误 SVG（`✗ ERROR` 风格），`alt` 文本保留可读；`console.warn` 输出坏图日志
6. **宽松降级**：构建期单图下载/解析失败 → 该图跳过懒加载改造（保持现状直接加载），构建不失败，warn 日志
7. **SPA 集成**：内容注入后调用 `update()` 重新扫描；SSG hydrate 场景直接实例化即可生效
8. **灯箱兼容**：`<a href=原图 data-action="preview">` 包裹层与 `data-fslightbox` 分组逻辑不变；点击未加载的占位图 → 灯箱按需加载原图
9. **语法回归**：`![|left 300]` / `![|right]` / `![alt]` 等全部现有图片语法行为不变

## Acceptance Criteria

- [ ] 构建产物：`posts.json` / `[slug].html` 中所有可解析图片带 `data-src`（原图）、`src`（占位 data URI）、`width`/`height`（真实比例）、`lazy` 类；`img-*` 定位类与管道宽度保留
- [ ] 网络面板：页面加载时不请求视口外图片；滚动接近（rootMargin 200px）才请求，首屏内图片立即请求
- [ ] 滚动到图片位置无布局跳动（width/height 预留生效）
- [ ] 图片加载完成有淡入过渡（.loaded）
- [ ] 坏 URL / 断网：显示错误态（`✗ ERROR` + alt），控制台有 warn
- [ ] 点击占位图打开灯箱显示原图，组内前后切换正常
- [ ] 无 IntersectionObserver 的浏览器：全部图片直接加载（库优雅降级）
- [ ] 构建失败宽容：单图 URL 失效时构建成功，该图保持原样直接加载
- [ ] dev SPA：文章间客户端导航后懒加载仍生效；SSG 首屏水合后生效
- [ ] `prefers-reduced-motion: reduce` 下占位图无动画
- [ ] **重渲染持久性**：灯箱开关、主题切换等任何 App 重渲染后，已加载图片保持加载态（节点不被重建、不回落占位）
- [ ] **占位图跟随主题**：暗/亮主题下占位图配色正确（同款终端 prompt + `loading` 字样）；主题切换时未加载图片即时换色，已加载/错误态图片不受影响
- [ ] 现有图片语法全部回归通过（`![|200]`、`![|right 300]`、`![alt](url)`）

## Notes

- 不引入 blur-up / 逐图占位（已决策排除）；不引入运行时第三方图片代理
- 占位/错误 SVG 均为内联 data URI 常量，无额外请求
- 尺寸解析覆盖 PNG/JPEG/WebP/GIF（前 2KB 内可解），详见 `research/image-dimension-fetch.md`
