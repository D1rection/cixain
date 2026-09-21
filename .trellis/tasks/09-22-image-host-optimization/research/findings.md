# 证据与限制（2026-09-22）

## 本轮只读核验

- index.html：背景 CDN @main 链接，未配置 preconnect。
- src/styles/global.css：<=768px 使用移动背景；不能仅看到桌面 URL 就断言手机重复下载，需查看真实网络。
- src/components/NavBar.jsx：new Image.onload 后切背景，缺少失败反馈。
- src/utils/lazyImages.js：threshold=200；错误换成 SVG；主题切换实际替换所有 data SVG，也包括错误图，与注释不一致。
- src/components/SegmentsRenderer.jsx：memo 的 innerHTML 应保留。
- src/components/ImagePreview.jsx：当前为自研 React portal 灯箱，无失败恢复。旧 ssg spec 关于 FSLightbox 实例的描述已过时，以代码为准。
- scripts/build-seo.js：全文 Feed 使用编译 HTML，data-src 图片可能在无 JS 阅读器停留占位，作为独立兼容问题记录，不扩展本期。
- 内容链规范明确图片编译零网络，尺寸可选由作者声明；本期不增加作者填写要求。
- scripts/build-seo.js 有搜索引擎外部推送；构建验证不能意外提交。
- scripts/build-posts.js 等已有用户修改，本轮未改这些文件。

## 本机 squeeze 配置（仅非敏感字段）

```json
{"compression_mode":"local","accept_lossy":false,"convert_to":"off","jpeg_quality":"0","custom_pipeline":"ext=png,size>=300KB=>mode=local,png_lossy=false; ext=*=>mode=off"}
```

安装插件 src/index.js 区分 custom/local，官方 README 明确规则只在 custom 生效。因此之前“阈值过滤已生效”的完成声明错误：local 不保证小图/JPEG 原样通过。本轮未更改设置。

## 前期采样限制

早先 23KB 图片耗时约 1.8s、188KB 图片约 0.7s，只能说明体积不是唯一因素。响应出现 200 Connection established，有代理隧道迹象，缺少直连和跨地区对照，不能确定大陆链路是主因。

36 文件约 5.8MB、最大约 1.24MB 是先前快照，本轮未重测。浏览器命中缓存可避免下载背景；@main 也可缓存，不代表每次访问回 GitHub。不能保证压缩到某一体积或预热节省固定时长。

## 官方依据

- https://github.com/Redns/picgo-plugin-squeeze ：custom、png_lossy、关闭转换、失败/变大处理，最终以安装版本为准。
- https://github.com/jsdelivr/jsdelivr#caching ：分支与固定版本缓存策略不同，不保证首访提速。
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preconnect ：连接提示及实际请求模式匹配。

## 待实施时验证

真实网络瀑布、PicGo 剪贴板格式、无损像素及色彩元数据、端到端上传、懒加载 API、背景压缩收益。本轮未上传图片、未触发构建外部推送、未改应用代码。
