# 构建期图片尺寸获取（零 CLS 前置）

## 结论

jsDelivr **支持 Range 请求**（实测 `Range: bytes=0-2047` → HTTP 206，返回 2048 字节）。
前 2KB 对 PNG/JPEG/WebP/GIF 均可完成尺寸解析，无需下载整图。

## 实测（2026-08-14）

```
$ curl -H "Range: bytes=0-2047" https://cdn.jsdelivr.net/gh/D1rection/img@main/images/20260717195426261.png
status=206 size=2048
00000000: 8950 4e47 0d0a 1a0a 0000 000d 4948 4452  .PNG........IHDR
00000010: 0000 05f4 0000 037e 0806 0000 0053 bb8a  .......~.....S..
```

- PNG 魔数 8 字节 + IHDR（偏移 16 起）：width = u32 BE @16，height = u32 BE @20 → `0x05f4=1524` × `0x037e=894`
- 该图在文章中显示宽度 600px（`![|600]`），真实尺寸 1524×894（Retina 截图）——**必须用真实比例换算 height**

## 各格式解析规格（2KB 内可解）

| 格式 | 定位方式 | 尺寸偏移 |
|---|---|---|
| PNG | 魔数 `89 50 4E 47`，IHDR 在固定偏移 16 | u32 BE @16 / @20 |
| JPEG | 扫描段：`FF D8` 后遍历 marker，找 SOF0/1/2 (`FF C0/C1/C2`) | height u16 BE +2，width u16 BE +4（SOF 载荷内） |
| WebP | RIFF `RIFF....WEBP`；VP8X（含 canvas 尺寸）或 VP8（`9D 01 2A` 后 u16 LE 宽高）或 VP8L（`2F` 后 14bit 打包宽高） | 分变体 |
| GIF | 魔数 `GIF87a/89a` | u16 LE @6（宽）/ @8（高） |

## 降级策略

- 下载失败 / 解析失败 / 未知格式 → **跳过该图懒加载改造**（保持现状直接加载），构建不失败，`console.warn` 打日志（宽松降级，Q8 决策）
- 构建内按 URL 去重缓存（Map），dev HMR 重建复用同进程缓存
- 无需磁盘持久化缓存：每图仅 2KB 请求，全站 ~20 图一次构建毫秒级

## 关键约束（比例换算）

HTML `width`/`height` 属性必须同源同比例，否则浏览器 aspect-ratio 错误：
- 管道宽度存在（`![|600]`）：`width` 属性保持 600（现有语义不变），`height = round(600 × h / w)`
- 管道宽度不存在：`width`/`height` = 真实尺寸（CSS `max-width:100%` 下按属性比例缩放）
