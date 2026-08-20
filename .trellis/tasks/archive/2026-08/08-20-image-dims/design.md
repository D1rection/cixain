# 图片显式尺寸 — 技术设计

## 1. 语法解析（remarkImagePipe 扩展）

现状：alt 含 `|` → `split('|')` → `[posPart, widthPart]`；position 认得 `left/right/center`，width 只认纯数字。

扩展：widthPart 支持「宽 [高]」，分隔符空格 / `x` / `×`：

```js
const [posPart, widthPart] = alt.split('|')
// position 逻辑不变
const parts = widthPart.trim().split(/\s+|x|×/i)
const w = /^\d+$/.test(parts[0]) ? parts[0] : ''
const h = parts.length > 1 && /^\d+$/.test(parts[1]) ? parts[1] : ''
node.data.hProperties = { class: `img-${position}`, style: '' }
if (w) node.data.hProperties.width = w
if (h) node.data.hProperties.height = h   // 不写 h → 无 height 属性 → 占位盒=占位图 4:3
```

行为表：

| 写法 | 产物属性 | 占位盒 | 加载后 |
|---|---|---|---|
| `![|600 400]` | `width=600 height=400` | 600×400（作者假设比例） | 作者对则无跳动；错则为一次跳动（图仍完整） |
| `![|600]` | `width=600` | 600×450（占位图 4:3） | 一次跳动（非 4:3 时） |
| `![|left 300 200]` | `class=img-left width=300 height=200` | 300×200 | 同上 |
| `![alt](url)` | 无 | 容器宽×4:3 | 一次跳动 |
| `![|300×200]` / `x` | 同 `300 200` | — | — |

## 2. rehypeImageLazy 纯同步化

- **删除**：`fetchImageDimensions`、`dimCache`、`parsePNG/parseJPEG/parseWebP/parseGIF`、`Promise.all` 逻辑（约 80 行）
- 改为同步：对 http(s) 外链图 `src` → 占位 data URI、`data-src` → 原 URL、class 追加 `lazy`；**保留** remarkImagePipe 已写入的 `width`/`height` 属性（含 no-height 时的「不写 height」语义）
- 非 http(s) / data URI 跳过（不变）
- 构建零网络；`import { PLACEHOLDER_URI } from '../src/utils/placeholderUri.js'` 保留

## 3. 「预设盒」机制（零新增代码）

浏览器对 `<img src=占位SVG width=W>`（无 height）会按占位图**固有 4:3** 留盒——这就是预设比例，无需任何 CSS/配置。已有 CSS `img.lazy { object-fit:cover; height:auto; opacity:1 }`：
- 占位阶段：4:3 盒，占位图（4:3）完美贴合；作者写了非 4:3 高度时 `object-fit:cover` 轻微裁剪占位图（装饰性，居中构图不受影响）
- 加载后：`height:auto` 使盒切到真实比例 → 真实图完整显示，绝不裁剪/变形
- 作者宽高正确时占位盒比例 == 真实比例 → 全程零跳动

## 4. 存量回填（一次脚本）

- 数据源：当前 `content/posts/*.html` 中 `<img ... width height data-src>` 的真实属性（来自旧构建）
- 方案：逐篇读 `.md`，对每个 `![...](url)` 且 URL 在 `<url→(w,h)>` 映射中的，把管道参数重写为 `![|pos w h]`（原 pos/w 保留，加 h）；无管道的纯宽度写法补成 `![|w h]`；`![alt]` 无管道无尺寸的不动
- 脚本一次性运行（`scripts/` 下临时文件，不入库或作为工具保留均可）
- 校验：重构建后 21 个 img 的 `width/height` 与旧值逐图一致

## 5. 兼容与影响面

| 变化 | 影响 |
|---|---|
| 删除尺寸解析 | `build-posts.js` 大幅瘦身；构建零网络 |
| 语法扩展 | 向后兼容（旧 `![|600]` 语义不变） |
| img 属性 | 带 height 时从「构建期真实值」变为「作者值」——旧文章经回填保持一致；新文章由作者负责 |
| 客户端 / CSS / 占位图 | 零改动 |
| dev 模式 | build-posts `--dev` 行为同生产（同样零网络） |

## 6. 不做的事

- 不引入 sharp / 构建期下载 / srcset / 运行时优化（留作未来可选演进）
- 不保留尺寸清单/缓存
- 不改变占位图设计与主题跟随
