# PRD: 添加全屏像素背景

## 需求
为博客添加全屏像素风格背景图，使用 3 张角色像素图进行每日轮换。

## 素材
`public/` 下已有三张像素图：
- `kisaki-1-dot.png`
- `kisaki-2-dot.png`
- `kisaki-3-dot.png`

## 设计决定
- 全屏覆盖（`background-size: cover`），`image-rendering: pixelated`
- 上方叠加半透明遮罩（`--color-bg`，opacity 0.88）保证文字可读
- 每日轮换：按日期取模 3 选图
- 主题兼容：亮/暗主题下遮罩色自动跟随 `--color-bg`
- 遮罩层 `pointer-events: none`，不影响交互
- 图片通过 CSS 自定义属性 `--bg-image` 设置，由 inline script 按日期赋值

## 实现文件
- `src/styles/global.css` — body 背景图 + 遮罩 + 层级调整
- `index.html` — inline script 设置 `--bg-image`

## 验收标准
- [ ] 页面有全屏像素背景图
- [ ] 背景图像素感清晰（未模糊缩放）
- [ ] 文字内容在半透明遮罩上清晰可读
- [ ] 每天刷新页面后图片轮换（3 张循环）
- [ ] 亮色/暗色主题下遮罩色正确
- [ ] 不影响滚动条、纸纹理等已有样式
- [ ] 构建部署后正常
