# PRD — OG 分享卡片

## 背景

博客已有 og:title/description/url/type + 基础 JSON-LD（static-renderer.js），但缺少 `og:image`：链接分享到微信/微博/推特/Telegram 等平台时没有预览图，卡片只有纯文字。

## 目标

1. 构建时为每篇文章生成 1200×630 终端窗口风格暗色预览图（`public/og/<slug>.png`）
2. 生成站点通用图（`public/og/default.png`），首页/分类/标签/404 页面共用
3. frontmatter `cover` 字段（已存在，暂无文章使用）可覆盖生成图：写了 cover 的文章不生成图，og:image 直接指向 cover
4. 补全分享 meta：`og:image` 全套（url/width/height/type/alt）、`og:site_name`、`og:locale`、`twitter:card` 全套
5. JSON-LD 补 `image` / `publisher` / `mainEntityOfPage`
6. 文章页 PostEnd 增加分享入口（终端命令风格）：复制链接 + 微博分享 + X 分享

## 需求详述

### 文章预览图（og/<slug>.png）

- 尺寸 1200×630（1.91:1，通用标准），PNG 格式
- shadcn 博客风格 + 主页背景三层复刻：
  - 背景 = 暗色 `#0c0c0a` + 固定背景图 `public/og/bg.png`（cover 平滑）+ 92% 纯色遮罩（复刻 body::after 的 opacity 0.92 观感）
  - 标题白色（得意黑 Smiley Sans 斜体展示字体，默认 72px，长标题降 56px，最多两行）
  - 标题下摘要（阿里普惠体 Bold，26px，两行）
  - 底部行（普惠体 Bold）：左 `日期 · 系列/分类 · 约 N 分钟`，右 `cicadae.cloud`
- 字体：得意黑（标题）+ 阿里普惠体 Bold（正文，均 OFL 开源），完整字体直接加载（不子集化）

### 站点通用图（og/default.png）

同风格：`cixain` 大字（得意黑）+ 站点描述 + 底部 `N 篇文章 · M 个系列` / `cicadae.cloud`。

### cover 覆盖

- 文章 frontmatter 有 `cover` 时：跳过该文章的图生成，og:image 使用 cover 的绝对 URL（相对路径按 `SITE_URL + /` 归一）
- 无 cover 时：og:image 为 `SITE_URL + /og/<slug>.png`

### meta 注入（static-renderer.js renderMeta）

| 标签 | 文章页 | 首页/列表页 |
|---|---|---|
| og:image | /og/\<slug\>.png 或 cover | /og/default.png |
| og:image:width / height | 1200 / 630 | 1200 / 630 |
| og:image:type | image/png | image/png |
| og:image:alt | 文章标题 | Cicada's blog |
| og:site_name | Cicada's blog | Cicada's blog |
| og:locale | zh_CN | zh_CN |
| twitter:card | summary_large_image | summary_large_image |
| twitter:title / description / image | 与 og 对应 | 与 og 对应 |

### JSON-LD 补全（文章页）

`image`（og:image 的绝对 URL）、`publisher`（Person: cicada）、`mainEntityOfPage`（文章 URL）。

### 博客标准 meta 增强

- `rel="canonical"`：所有页面（SITE_URL + path）
- `theme-color` 两套（亮 `#f4efe6` / 暗 `#0c0c0a`，prefers-color-scheme 分流）
- 文章页 OG Article 专属标签：`article:published_time` / `article:author` / `article:section`（category）/ `article:tag`（tags）
- JSON-LD：`Article` → `BlogPosting`；文章页追加 `BreadcrumbList`（首页 > 系列[或分类] > 文章，系列链接与 ToC 一致用 encodeURIComponent）；首页注入 `WebSite`（无 SearchAction——站点搜索是前端弹层无 URL 端点）

### 分享入口（PostEnd 圆形图标按钮）

- 分享 group 位于相关推荐之后、footer 之前：一排圆形图标按钮（38px，圆形边框 + 品牌色图标），平台：微信 / QQ / 微博 / 知乎 / X
- 行为：
  - 微博 / X / QQ：`window.open` 跳官方分享 intent URL（service.weibo.com / twitter.com/intent/tweet / connect.qq.com/widget/shareqq），新窗口
  - 微信 / 知乎：无公开 web 分享接口，点击复制链接，按钮排下方提示「✓ 已复制，去微信/知乎粘贴」（2s 消失）
- 分享链接需绝对 URL，SSG 渲染期无 `window`，全部用 button 点击时才取 `window.location.href`

## 非目标

- 不做微博 weibo: 自有标签
- 不做运行时动态图服务
- 不动 sitemap / feed.xml

## 验收标准

- [ ] `npm run build` 后 `public/og/` 下每篇文章有对应 PNG，且存在 `default.png`
- [ ] 生成图尺寸 1200×630，文件体积 <1MB
- [ ] 文章页静态 HTML 含完整 og:image + twitter 块（绝对 URL）
- [ ] 首页/分类/标签/404 页含 og:default 图引用
- [ ] 有 cover 的文章：og:image 指向 cover，且不生成对应图
- [ ] JSON-LD 含 image/publisher/mainEntityOfPage
- [ ] 本地构建无 sharp 报错、无字体缺失警告
- [ ] curl 检查线上/预览站响应头与 meta 输出正确
- [ ] 暗色终端风格与 PostEnd 视觉一致（人工检查生成图）
