# 设计 — OG 分享卡片

## 1. 技术选型

**SVG 模板字符串 + sharp 转 PNG**（构建时，静态产物）。

- 不用 Satori/@vercel/og：布局是简单矩形 + 文本（终端窗口），SVG 直接表达即可；Satori 强制要求嵌入本地字体文件（WOFF/TTF），且不支持 WOFF2——本项目全用系统字体，SVG 引用系统字体栈零成本
- sharp 为 devDependency：prebuilt binary 覆盖 macOS 本地与 CI（Node 22 / ubuntu-latest），无编译负担
- 中文字体渲染：SVG `font-family` 指定系统字体栈，librsvg 用系统字体。macOS 有 PingFang SC；GitHub Actions ubuntu-latest 预装 fonts-noto-cjk，CI 可正常渲染中文
- SVG 无自动换行：标题断行在 JS 侧按字符宽度估算切分（全角≈字号宽，半角≈字号/2），切出最多 2 行，超长加省略号

## 2. 视觉规格（文章图 1200×630）

```
┌─ 圆角 16px 边框 #1a2418（2px）────────────┐
│ ● ● ●   cicada@blog:~          ← 标题栏  │
│ ────────────────────────────────          │
│ $ cat posts/2026-08-13         ← 装饰行   │
│                                          │
│    文章标题（居中，≤2 行）                │
│    #c5ccc3 / 44px 黑体                    │
│                                          │
│  2026-08-13 · CS229 系列        ← 信息行  │
└──────────────────────────────────────────┘
```

- 画布背景 `#0c0c0a`；窗口内留白 64px；装饰/信息行绿 `#3fb950`，等宽字体栈
- 标题 44px 系统黑体栈 `PingFang SC, 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif`，两行间距 1.4
- 窗口宽度 ~900px 居中，垂直居中
- 通用图（default.png）：同边框与标题栏，`$ whoami` 装饰行，`cicada` 60px 大字居中，`Cicada's blog` 信息行

## 3. 数据流与构建链

```
npm run build
 ├─ node scripts/build-posts.js        # 产出 content/posts/posts.json（含 slug/title/date/category/tags/series/cover）
 ├─ node scripts/generate-og.js        # 新增：读 posts.json → 写 public/og/*.png
 ├─ vite build                         # public/ 原样复制进 dist/
 ├─ node scripts/static-renderer.js    # 注入 og:image 全套 + twitter 卡 + JSON-LD 补全
 └─ (build-seo.js / build-search-index.js 不变)
```

- `generate-og.js` 输入：`content/posts/posts.json`；输出：`public/og/<slug>.png` + `public/og/default.png`
- 有 `cover` 的文章：跳过生成，meta 直接引用 cover
- 幂等：同 slug 覆盖写，删除不再需要的旧图（读取已有文件名求差集）
- 文件名稳定（slug 固定），平台缓存 24–72h 无需刷新

## 4. meta 注入（static-renderer.js）

`renderMeta(meta)` 增加参数 `image`（og:image URL）与 `imageAlt`；路由侧按类型填充：

| 路由 | og:image |
|---|---|
| /blog/:slug | cover ? normalize(cover) : `${SITE_URL}/og/${slug}.png` |
| /、/category/*、/tag/*、/series/* | `${SITE_URL}/og/default.png` |
| 404 | `${SITE_URL}/og/default.png` |

- `og:image:width=1200` / `height=630` / `type=image/png` / `alt=文章标题`
- `og:site_name=Cicada's blog`、`og:locale=zh_CN`
- `twitter:card=summary_large_image` + `twitter:title/description/image`
- JSON-LD（renderJsonLd）：`image: SITE_URL + /og/<slug>.png`、`publisher: { '@type': 'Person', name: 'cicada' }`、`mainEntityOfPage: { '@type': 'WebPage', '@id': url }`

cover 归一规则：`https://` 开头原样；否则 `${SITE_URL}/${cover 去掉开头斜杠}`。

## 5. 边界情况

| 情况 | 处理 |
|---|---|
| 标题超长 | 按宽度估算断两行，仍超则第二行末尾省略号 |
| 无 series 无 category | 信息行只显示日期 |
| cover 已写 | 不生成该文章图，og:image 用 cover |
| 标题含特殊字符 | SVG 转义 `& < > "` |
| 图片体积 | 扁平色块 PNG 预期 <100KB，远低于 1MB 上限 |

## 6. 风险

- **微博 CORS 校验**：微博爬虫要求图片响应带 `Access-Control-Allow-Origin`。GitHub Pages 实际行为需 curl 验证；若缺失，微博走 og 兜底仍能出图（该点列为验证项，非阻塞）
- **CI 中文字体**：若 ubuntu-latest 无 CJK 字体，图内中文显示豆腐块。验证方式：CI 构建后检查产物（本地 mac 可先行验证渲染效果）
- sharp 安装失败回退：devDependency，npm ci 失败即 CI 红，无静默降级
