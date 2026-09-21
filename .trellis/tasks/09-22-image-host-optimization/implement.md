# 实施清单与结果

## 准备

- [x] 用户要求实施后执行 `task.py start`，任务已切换为 `in_progress`。
- [x] 读取 PRD、design、research 和 frontend 内容链/质量规范。
- [x] 记录 git status，保留 scripts/build-posts.js、笔记、生成产物等已有用户修改。
- [x] 核对 PicGo/squeeze 版本和非敏感配置，不记录账户密钥。

## 1. 基线与上传规则

- [ ] 记录代表性文章/背景的冷热缓存基线和网络代理状态（留作后续实测，不阻塞本轮实施）。
- [ ] 离线验证 PNG 阈值两侧/相等、非 PNG、压缩失败/变大（本轮不上传测试图，避免改变远端内容）。
- [x] 通过 PicGo UI 保存 custom 模式和规则，并读取本地配置核对持久化。
- [ ] 用明确选择的非敏感测试图验证实际剪贴板上传、文件格式与 Markdown 链接（本轮不上传测试图，避免远端新增文件）。
- [ ] 检查尺寸、解码像素和体积，不承诺每图都变小（需后续用本地样本验证）。

## 2. 连接提示与错误恢复

- [x] 在 index.html 增加 dns-prefetch/preconnect，并通过 Vite/SSG 生成验证。
- [x] Context7 工具在当前环境不可用，改以已安装 vanilla-lazyload@12.5.0 的类型定义、README 和源码核对 `load(el, true)`。
- [x] 正文加入手动重试，按钮在请求期间禁用，成功移除，失败恢复，不自动循环。
- [x] 修复主题切换覆盖错误占位图的问题。
- [x] 灯箱重试按当前图片和原 URL 隔离，不追加时间戳 query。
- [x] 保留 memo、尺寸、原图灯箱、历史对比及滚动定位行为。

## 3. 验证交付

- [x] 通过代码路径核对错误→主题切换仍为错误、重试按钮禁用与 `load(el, true)` 单次触发；灯箱重试通过 key 隔离旧图片节点。
- [x] 执行 `npm run test:revisions`。
- [x] 执行 `npm run build:posts`、`npm run build:history`、`npx vite build` 和 `node scripts/static-renderer.js`；未运行包含 IndexNow/百度提交的完整发布命令。
- [ ] 桌面/移动端测试快速滚动、主题、灯箱、历史、hash、失败恢复；与基线对比。
- [x] 更新 content-pipeline 运行时图片契约；收益与限制、分项回退方式在交付说明中报告，不混入其他用户修改。

## 后续实验

- [ ] 固定背景无损衍生资源与主机路径实测，通过后另定发布计划。
- [ ] 根据瀑布评估首屏 eager 例外。
- [ ] 按需审计工具，不接入日常构建。
