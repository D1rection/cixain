# Git Conventions

> Commit message standards for this project.

## Commit Format

Follow Angular commit convention, with Chinese description:

```
<type>(<scope>): <中文描述>
```

Types:
- `feat` — 新功能
- `fix` — 修复 bug
- `chore` — 杂项（构建、工具、配置）
- `docs` — 文档
- `refactor` — 重构
- `style` — 样式调整（非 CSS Modules 改动）
- `test` — 测试

## Guidelines

- 描述简明易懂，不要过长
- 第一行不超过 72 字符
- scope 可选，对应模块名（如 `build-posts`、`ssg`）

## Examples

```
feat(build-posts): 支持 draft 文章过滤
fix(ssg): 修复 404 页面数据注入错误
chore: 初始化 Vite + React 项目骨架
docs: 更新 README 部署说明
```
