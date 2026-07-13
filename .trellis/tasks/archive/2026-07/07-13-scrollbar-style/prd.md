# PRD: 美化滚动条样式

## 需求
为博客添加像素风自定义滚动条，与整体主题一致。

## 设计决定
- 宽度 8px，像素块风格
- 轨道（track）：左侧 2px `--color-border` 分割线，其余透明
- 滚动块（thumb）：默认 `--color-muted` + `box-shadow: 2px 2px 0` 像素凸起感
- 滚动块 hover：变为 `--color-accent`，加深阴影，像素按钮反馈
- 支持水平滚动条（代码块等）：高度 8px，同款样式
- Firefox：`scrollbar-color` + `scrollbar-width`，形状默认

## 实现位置
`src/styles/global.css`，添加到文件末尾

## 验收标准
- [ ] Chrome/Safari/Edge 下滚动条为 8px 像素风格
- [ ] 亮色/暗色主题下颜色随 `--color-*` 变量变化
- [ ] hover 滚动块时变色 + 凸起反馈
- [ ] Firefox 不丢失功能（颜色跟随、宽度 thin）
- [ ] 水平滚动条（代码块）同样样式
