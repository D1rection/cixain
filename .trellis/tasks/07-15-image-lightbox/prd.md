# PRD: 图片点击预览 (FSLightbox)

## 问题

文章内的图片点击后没有反应，技术文章的截图（含代码、图表等）读者无法放大查看细节。

## 方案

使用 [FSLightbox](https://fslightbox.com/)（零依赖、~10KB、纯 vanillla JS），给所有文章图片包裹 `<a data-fslightbox>` 实现点击放大。

### 改动范围

| 文件 | 改动 |
|------|------|
| `package.json` | 新增 `fslightbox` 依赖 |
| `package-lock.json` | 自动更新 |
| `scripts/build-posts.js` | 新增 `rehypeImageLightbox` 插件，构建时将 `<img>` 包裹 `<a data-fslightbox>` |
| `src/main.jsx` | 导入 fslightbox，路由变化时刷新实例 |

### 详细设计

**`scripts/build-posts.js`** — 新增 rehype 插件，在 HAST 阶段将每个 `<img>` 用 `<a>` 包裹：
- `tagName` 改为 `a`
- `href` 设为图片 src
- `data-fslightbox` 属性（值为文章 slug，实现按文章分组）
- 原有 `<img>` 节点作为子节点保留
- 跳过已被 `<a>` 包裹的图片（理论上不会出现）

插件放在 `remarkRehype` 之后、`rehypeKatex` 之前。

**`src/main.jsx`** — 导入 fslightbox：
```js
import 'fslightbox'
```

FSLightbox 会在 DOMContentLoaded 自动挂载。对于 SPA 路由切换后的新内容，调用 `refreshFslightbox()`。

**图片分组：** 每篇文章的图片使用文章 slug 作为分组 key，让 reader 可以在单篇文章的图片之间滑动切换。

### 不做的事

- 不额外加 CSS（FSLightbox 自带样式）
- 不自定义 FSLightbox 主题
- 不启用视频等扩展功能（只做图片预览）
