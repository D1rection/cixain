# 实现清单

## 执行步骤

1. 激活 Trellis 任务，确认只处理 Navbar 与正文滚动容器的布局关系。
2. 调整 `src/App.jsx`，让 `NavBar` 成为 `ScrollContainer` 的兄弟节点。
3. 调整 `ScrollContainer.module.css` 的移动端 flex 高度计算，确保 Navbar 占用固定高度后正文容器只获得剩余高度。
4. 保持 `ScrollProvider`、滚动目标、菜单 fixed 层和打印样式的现有契约。
5. 运行构建与静态检查，检查工作区差异只包含本任务文件。

## 验证命令

- `npm run build`
- `git diff --check`
- `python3 .trellis/scripts/task.py validate .trellis/tasks/09-19-navbar-outside-scroll-container`

## 验收检查

- Navbar 位于滚动容器外，宽度不再受正文经典滚动条 gutter 影响。
- 移动端 `ScrollContainer` 仍是唯一纵向滚动目标，根文档保持锁定。
- 桌面端保持 window 滚动、sticky Navbar、首页双栏与内容横向滚动。
- 不引入隐藏滚动条、固定宽度补偿或负 margin。
