# 图片懒加载 — 技术设计

## 1. 总体数据流

```
content/posts/*.md
  → build-posts.js compileMD（async）
      → remark 阶段：remarkImagePipe（定位/宽度，现状不变）
      → rehype 阶段：rehypeImageLightbox（包 <a>，现状不变）
      → rehype 阶段：rehypeImageLazy（新增，最后执行）
          ├─ fetchImageDimensions(url)  ← 2KB Range 请求，构建内 Map 缓存
          ├─ 成功 → img 属性：
          │     src       = PLACEHOLDER_URI（内联 SVG data URI）
          │     data-src  = 原图 URL
          │     width     = 管道宽度 ?? 真实宽
          │     height    = 管道宽度 ? round(管道宽度 × 真实高/真实宽) : 真实高
          │     class     += lazy
          └─ 失败 → 跳过该图（保持原样直接加载），console.warn
  → posts.json（HTML 字符串）+ [slug].html
      ↓ SSG：static-renderer 输出静态 HTML；dev：SPA fetch [slug].html
  → 浏览器：
      main.jsx → initLazyLoad() 实例化 vanilla-lazyload（threshold=200）
      BlogPost 内容注入后 → lazyImages.update()（dev 导航场景）
      加载完成 → .loaded 类 → CSS 淡入
      加载失败 → .error 类 → src 换 ERROR_URI，console.warn
```

## 2. 构建期：尺寸解析（scripts/build-posts.js）

新增模块级：

```js
const dimCache = new Map()   // url → {w, h} | null（构建进程内缓存，dev HMR 复用）

async function fetchImageDimensions(url) {
  if (dimCache.has(url)) return dimCache.get(url)
  // Range: bytes=0-2047 → 206；失败/非 2xx 或非图片 content-type → null
  // PNG: 偏移 16 u32BE 宽, 20 u32BE 高
  // JPEG: 扫 marker 找 SOF0/1/2（FF C0/C1/C2），载荷内 h u16BE、w u16BE
  // WebP: VP8X / VP8 / VP8L 分变体
  // GIF: 偏移 6 u16LE 宽, 8 u16LE 高
}
```

约束：
- 解析失败一律返回 `null`（不抛异常），调用方跳过该图
- 只对 `http(s):` 外链发起请求；data URI 图不做懒加载（无网络收益）
- 并发：逐文件处理时为避免排队，可 `Promise.allSettled` 批量预热；实现上以简单为先（单图 2KB，串行亦可接受，20 图 < 1s）

## 3. 构建期：rehypeImageLazy 插件

- 位置：插件链末尾（lightbox 包裹之后；对 `a > img` 结构直接改 img 属性即可）
- 对每个 `img` 元素：
  - 跳过条件：`data-src` 已有 / `src` 是 data URI / 尺寸解析失败（warn 一次）
  - `hProperties` 合并：`src`、`data-src`、`width`、`height`，`className` 追加 `lazy`
  - 保留现有 `img-center/left/right` 类与管道 `width` 属性（存在时覆盖为管道值）
- **比例换算**：管道宽度存在 → `width` 属性 = 管道值（覆盖真实宽），`height` = `Math.round(管道值 * h / w)`；无管道宽度 → `width`/`height` = 真实值（CSS `max-width:100%` 响应式缩放，浏览器按属性比例自动换算高度）

## 4. 占位图 / 错误图（内联 SVG data URI）

**PLACEHOLDER_URI**（构建期常量，写进 HTML `src`）：

```svg
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'>
  <style>
    @media (prefers-reduced-motion: reduce) { .cur { animation: none } }
    .cur { animation: blink 1s steps(1) infinite }
    @keyframes blink { 50% { opacity: 0 } }
  </style>
  <rect width='800' height='600' fill='#0c0c0a'/>
  <text x='400' y='310' text-anchor='middle' font-family='monospace' font-size='28' fill='#3a3a35'>cicada@blog:~$</text>
  <rect class='cur' x='523' y='282' width='16' height='30' fill='#3a3a35'/>
</svg>
```

设计要点（Q6 决策）：
- 底色 `#0c0c0a` 与站点背景一致；文字 `#3a3a35`（前景色 ~30% 透明度）低对比
- 纯色底 + 居中内容 + `object-fit: cover` → 拉伸到任意真实比例裁剪不违和
- 动画用 CSS（非 SMIL），`prefers-reduced-motion` 可关
- 转 `encodeURIComponent` 成 data URI；尺寸精调在 implement 阶段做

**ERROR_URI**（客户端常量，`callback_error` 里替换 `src`）：同构布局，文案 `✗ ERROR`。

## 5. 客户端（src/utils/lazyImages.js 新增）

```js
import LazyLoad from 'vanilla-lazyload'

const ERROR_URI = 'data:image/svg+xml,...'   // ✗ ERROR 版占位

let instance = null
export function initLazyLoad() {
  if (instance || typeof IntersectionObserver === 'undefined') return
  instance = new LazyLoad({
    elements_selector: 'img.lazy',
    threshold: 200,                    // rootMargin 提前 200px
    callback_loaded: () => {},         // .loaded 类由库自动加（class_loaded 默认）
    callback_error: (el) => {
      el.classList.add('error')
      el.src = ERROR_URI               // 保留 alt 可读
      console.warn('[lazy-img] failed:', el.dataset.src)
    },
  })
}
export function updateLazyLoad() { instance?.update() }
```

- `main.jsx` 顶部调用 `initLazyLoad()`（SSG hydrate 与 dev 均可用；dev 内容后注入，需要 update）
- `BlogPost.jsx`：`html` 变化（dev fetch 完成 / 路由切换）后 `useEffect` 里调 `updateLazyLoad()`
- 无 IO 浏览器：库内建降级，`data-src` 直接赋值加载——注意此时 placeholder `src` 会先显示再被替换，属可接受降级
- 注：库默认 `class_loaded` 即 `loaded`，无需自定义

## 6. CSS（PostContent.module.css + global.css）

```css
/* 占位期：铺满预留空间不变形；加载后无影响（真实图即预留比例） */
.content :global(img.lazy) { object-fit: cover; }
/* 淡入 */
.content :global(img.lazy) { opacity: 0; transition: opacity .3s; }
.content :global(img.lazy.loaded) { opacity: 1; }
.content :global(img.lazy.error) { opacity: 1; }
```

- 暗色主题下 `#0c0c0a` 占位底融入页面；亮色主题由 SVG 自身底色保证（占位图固定暗色为设计决策，暗色是站点主视觉）
- 组件样式走 CSS Modules（`:global` 包裹内容区 HTML），符合 component-guidelines

## 7. 边界与兼容

| 场景 | 行为 |
|---|---|
| 尺寸解析失败（URL 失效/未知格式） | 跳过懒加载改造，图原样直接加载；构建不失败，warn |
| data URI / 非 http(s) 图 | 不做懒加载（跳过） |
| 灯箱点击占位图 | `<a href=原图>` 不变 → 灯箱按需加载原图 |
| 无 IO 浏览器 | 库降级全量加载 |
| dev HMR 重建 | dimCache 同进程复用，无重复请求 |
| `![alt](url)` 纯 alt 图 | 懒加载照做，alt 保留（错误态可读） |

## 8. 依赖

- 新增运行时依赖：`vanilla-lazyload@^12.5.0`（npm i）
- 无其他新增依赖；构建期尺寸解析用 Node 内置 `fetch`（Node ≥18）
