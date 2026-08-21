# 导航栏两端留白过大

## Goal

大屏（≥1200px 视口）下导航条背景满宽，但内容被 `max-width: 1200px` 约束居中，导致左右两端露出大片空导航条背景（1440px 下各约 120px，更高分辨率更大）。改为：导航内容铺满整条 bar（不做 max-width 收缩），左段（品牌）与右段（链接/按钮组）分居两侧，两端留白按视觉规范取适中值。

## Requirements

- R1: 去掉 `.inner` 的 `max-width: 1200px` + `margin: 0 auto` 居中约束，内容占满导航条全宽。
- R2: 两端留白：移动端（≤768px）保持 `16px`（≤480px 为 `12px`）；桌面端（≥769px）取 `32px`——依据 Material Design 桌面边距 24dp 与常见设计系统 24–64px 区间的折中（desktop container 规范参考 m2.material.io / Bootstrap 5 containers）。
- R3: 两端对齐：左段 brand 左缘贴容器左内边距，右段 links 组右缘贴容器右内边距（由现有 `justify-content: space-between` 保证）。
- R4: 两段之间的中间空隙随视口变宽而变大，属预期行为（用户已确认可接受）。
- R5: 不改变 768px 断点以下的移动端行为（汉堡菜单、图标折叠等）。
- R6: 不改动 NavBar.jsx 结构，仅调整 NavBar.module.css。

## Acceptance Criteria

- [ ] 1440px 视口：brand 左缘 = 32px，右段右缘 = 1440−32px（两端空白仅为 padding）。
- [ ] 1920px 视口：同样两端 32px，无居中 1200 约束。
- [ ] 769–1199px 视口：导航内容占满全宽，两端 32px。
- [ ] ≤768px 视口：两端 16px（≤480px 为 12px），汉堡按钮/图标菜单行为与修改前一致。
- [ ] 构建无回归：`npm run build` 通过（纯 CSS 改动，SSG 正常产出）。

## Notes

- 中间空隙变大是"内容铺满"方案的必然结果，用户已确认接受。
- 备选方案 B（导航条收窄为 1200px 居中悬浮条）未选中，仅记录。