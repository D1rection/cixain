# 实施验证（2026-09-30）

## 结果
已完成全尺寸正文滚动、稳定滚动目标、嵌套容器锁、响应式标题留白、目录高亮基准，以及正文具名可聚焦区域。未改变 Navbar JSX、导航视觉、移动壁纸、hash 居中逻辑或宽屏目录定位。

## 已执行
- npm run build：成功；包含内容、历史、资源、SSG、SEO 与搜索索引。KaTeX µ 字形提示与未提交文章跳过历史比较为内容侧提示，无构建失败。
- npm run test:content：7/7 通过。
- 最后增加键盘焦点入口后，重新执行 vite build 与 static-renderer.js：成功；对最终生产预览重复交互检查，无页面脚本/水合异常。
- git diff --check 与 Trellis 上下文 validate：通过。项目没有 lint/typecheck 脚本。

## 浏览器实测
使用本机 Google Chrome 的 Playwright 自动化，生产预览 http://127.0.0.1:4173；脚本及截图位于 /tmp/cixain-scroll-validation（临时验证材料，不作为依赖提交）。

| 项目 | 结果 |
|---|---|
| 390/480/768/769/1024/1440/1920px | nav top=0，宽度等于视口，容器从 nav bottom 到视口底部；文档 scrollTop=0，正文 scrollTop=1000 |
| 导航实际高度 | ≤480px 为49px，其余53px（含边框） |
| 标题间距 | 移动60px，桌面8px；桌面目录跳转后的标题 top≈61px |
| 经典滚动条 | 移除自动化的 hide-scrollbars 默认参数并禁用 overlay 特性，headless 与 headed 均实测正文 offsetWidth-clientWidth=11px、Navbar width=1440px；不是用 scrollbar-gutter 模拟 |
| overlay 模式 | 正文 gutter=0，几何关系同样正确 |
| 目录首、中、末标题 | 定位正确，根文档不滚动；原稳定性校正逻辑保持 |
| hash 直达 | 目标居中，根 scrollTop=0，nav top=0，无需改 useHashScroll |
| 跨768px缩放 | 正文保留非零阅读位置，无目标切换导致的回顶 |
| 键盘 | Tab可进入具名正文区域，区域聚焦后 PageDown/Space/End/Home 原生滚动正确；初始焦点在 body 时 PageDown 不滚动，未自动抢焦点或全局拦截键盘 |
| 搜索/预览 | 单层与双层锁定通过；关闭预览仍保持搜索锁，最后关闭搜索恢复auto |
| 回顶/路由/历史 | 回顶到0，无hash SPA 路由与前进后退按现有策略回顶，无脚本错误 |
| 短页 | 847px正文区域，Footer bottom=900px；无多余主滚动条 |
| 代码横向滚动 | 769px视口展开折叠代码后，代码区clientWidth=610、scrollWidth=654、scrollLeft可到44；文档scrollWidth仍为769，无页面横向溢出 |
| 首页/碎片 | 无页面级横向溢出；桌面双栏保持 |
| 移动菜单 | 展开菜单、搜索、关闭正常 |
| 懒加载 | 模拟成功图片响应，内部滚动后文章lazy图片加载完成；未修改懒加载配置 |
| 打印媒体 | overflow释放，正文容器恢复约9691px、文档约9744px，未裁为一屏 |

## 验证边界
未进行 Safari/Firefox、移动真机、真实浏览器“查找”、物理打印与读屏器测试；未重新穷举原有目录校正的延迟图片/连续点击/用户中断组合。阅读进度DOM保持原实现，其fixed层级低于导航的既有显示行为未顺带重设计。

## 工作区保护
构建前保存了content/public的文件快照；构建完成后将受影响的既有元数据/Feed/Sitemap等文件精确恢复到构建前版本，保留用户原有未提交内容。构建新增的忽略历史缓存保留，不纳入提交。预览使用独立dist产物，不受上述恢复影响。
