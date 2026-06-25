# CRT 终端配色方案重构

## Goal

重新设计博客配色方案，暗色主题采用 CRT 终端风格（绿磷光），亮色主题采用复古纸张风格，各自有独立 accent。

## Design

**Dark (CRT Terminal):**
- bg: #0c0c0a (near-black)
- text: #c5ccc3
- accent: #3fb950 (green phosphor)
- muted: #6a7a66
- border: #1a2418
- CRT scanlines (更明显) + vignette 暗角

**Light (Vintage Paper):**
- bg: #f4efe6 (antique paper)
- text: #2c2822 (dark ink)
- accent: #8a3a2a (brick red / 印章色)
- muted: #8a8273
- border: #ddd6cb
- 极淡纸张纹理，无扫描线

## Requirements

- 更新 global.css 双主题 CSS 变量
- 优化暗色扫描线效果（更明显 + 暗角 + 速度加快）
- 亮色加极淡纸张纹理
- 所有硬编码颜色替换为 CSS 变量
- 双主题使用不同 accent 色（暗色绿，亮色砖红）

## Acceptance Criteria

- [x] 暗色有 CRT 终端氛围
- [x] 亮色有复古纸张质感
- [x] 双主题各自 accent 色协调
- [x] 硬编码颜色全部替换为 CSS 变量
