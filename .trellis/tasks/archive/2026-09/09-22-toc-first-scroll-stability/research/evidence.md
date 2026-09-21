# 证据与边界

## 已完成复现（上一轮诊断记录，本轮未重新运行）

本地 preview /blog/2026-09-03-001/，601×837 视口，容器 top=53。

- 第二节原始 top=2948.9453。
- 首次点击后 scrollTop=2834，标题 top=-92.4609。
- 前置图片高度 402.75 → 195.34375，减少 207.40625。
- 再次点击 scrollTop=2628.5，标题 top=113.0391，约为容器 53 + margin 60。
- 两次落点差 205.5px，与图片高度变化吻合（有滚动/取整小差值）。

preview 构建时刻未核验；当前源代码确认仍是相同机制。尚未定量测试桌面及跨浏览器，不将本次复现推广为所有环境保证。

## 源码证据

- TableOfContents.jsx:54 仅一次 smooth/start，contentRef 未用于稳定性。
- useHeadingAnchors.js:40 注入 60px margin。
- lazyImages.js:28 提前 200px 懒加载；PostContent.module.css:282 保留 height:auto。
- build-posts.js:376 和 content-pipeline.md 明确零网络构建、缺高度以 4:3 占位。准确比例采集属于更大的设计调整。
- useHashScroll 遇首个 load 或 complete 即 finish，800ms 兜底，并非等全部图片，不能直接借用。TOC preventDefault 不改 hash，也不走该路径。
- 已安装 vanilla-lazyload 12.x dist 中存在 instance.load(element,force) 与 callback_loaded/error；推荐方案不调用额外加载接口。

## 一手浏览器参考

[MDN Element scrollend](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollend_event) 和 [Document scrollend](https://developer.mozilla.org/en-US/docs/Web/API/Document/scrollend_event)：没有滚动位移时不触发事件；旧浏览器需兼容路径。因此设计必须包含无位移、无 scrollend 的回退。

## 规划方法

使用 .claude/skills/trellis-brainstorm/SKILL.md，遵循先查仓库再问问题。现有规范已回答尺寸写作与构建约束，可直接形成推荐方案。没有修改应用代码或执行 task.py start。
