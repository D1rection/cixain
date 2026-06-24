# 修复移动端响应式布局

## Goal

修复博客在移动端（<768px）的响应式布局问题，让主内容区单栏居中显示，隐藏多余 sidebar。

## Requirements

- 移动端 sidebar 不再显示
- 移动端主内容区单栏居中
- 桌面端布局不受影响

## Acceptance Criteria

- [x] 移动端（<768px）文章列表隐藏 sidebar，只显示主内容
- [x] 移动端文章列表居中显示（max-width + auto margin）
- [x] 桌面端（≥768px）保持现有两栏布局不变
