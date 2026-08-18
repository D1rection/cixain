# 基准排版参数调研（阅读内容区 / 呼吸感）

> 调研时间：2026-08-19。目标：为"博客正文排版缺呼吸感"找权威数值基准。
> 博客内容为中文为主、英文/代码混排，因此基准综合【中文排版规范】+【西文网页排版最佳实践】两套体系。

## 一、核心结论（可直接落地的数值带）

| 参数 | 推荐基准 | 依据 |
|------|---------|------|
| 正文字号 | **16px（Web 阅读密度高用 16px，≥14px 是底线）** | Ant Design / Apple HIG / WCAG（<16px 移动端伤眼） |
| 中文行高 | **1.5–1.75**（中文笔画密，比英文 1.4–1.6 需要更多呼吸） | 中文排版规范（W3C clreq 系） |
| 正文行宽 measure | **桌面 30–40 字/行；移动 18–25 字/行** → 中文正文约 `36em`（16px 下≈576–640px） | 中文排版规范；西文 45–75ch（Google Fonts Knowledge） |
| 字距 | 正文 `letter-spacing: 0`；**禁负字距**；大标题可 +0.05em | 中文排版规范（负字距汉字会糊） |
| 段间距 | `margin-bottom: 1em`（或段间空行，与首行缩进二选一，不可并用） | 中文排版规范 / impeccable typography |
| 垂直节奏 | **行高 = 所有垂直间距的基准单位**（16px × 1.75 = 28px；间距取 14/28/56 等倍数） | impeccable typography / W3C Vertical Rhythm 演讲 |
| 标题行高 | 收紧到 **1.2–1.35**（不得继承正文 1.7+，否则标题松散） | 排版通则（标题与正文行高分离） |
| 标题间距 | margin-top 是段落间距的 1.5–2×，margin-bottom 为 0.5×（标题"吸住"下方正文） | 设计系统惯例（如 GitHub、News 类站点） |
| 字号层级 | 少数尺寸+大对比：1.25（major third）或 1.333 倍率，5 级制 | impeccable typography |
| 暗色补偿 | 暗底正文需三轴补偿：行高 +0.05–0.1、字距 +0.01–0.02em、字重 +1 档；暗底正文不用纯白（`rgba(255,255,255,.85)`，对比度 ≥7:1） | impeccable typography / 中文排版规范（汉字低对比暗底损失更大） |
| 代码块 | 行高可保持较紧 1.5；内边距与块间距应与正文垂直节奏同源 | impeccable / 通用惯例 |
| 渲染细节 | `text-wrap: balance`（标题）/ `text-wrap: pretty`（长文段落）；正文用 rem 而非 px | impeccable typography |

## 二、来源清单（含链接）

1. **中文排版与配色规范**（W3C clreq / Ant Design / Apple HIG 汇总，2026-07 调研版）
   - https://github.com/joeseesun/qiaomu-design/blob/main/references/chinese-typography.md
   - 关键原文：行高 1.5–1.75；每行 30–40 字（桌面）/ 18–25 字（移动）；段间距 1em；暗色正文 `rgba(255,255,255,.85)`、对比度 7:1
2. **Impeccable · Typography**（硅谷设计实践汇总）
   - https://github.com/pbakaus/impeccable/blob/dc715c73/.trae/skills/impeccable/reference/typography.md
   - 关键原文：垂直节奏（line-height 为基准单位，间距取倍数）；measure 65ch；暗色三轴补偿（行高+0.05–0.1、字距+0.01–0.02em、字重+1）；段落间距与首行缩进二选一；modular scale 1.25/1.333；正文 ≥16px；`text-wrap: balance/pretty`
3. **Google Fonts Knowledge — Understanding measure/line length**
   - https://fonts.google.com/knowledge/using_type/understanding_measure_line_length
   - 关键原文：西文舒适行宽 45–75 字符/行（Bringhurst 52–78 上限更严）；行宽决定阅读节奏
4. **W3C CSS WG — Vertical Rhythm**（fantasai）
   - https://fantasai.inkedblade.net/style/talks/vertical-rhythm/slides.html
   - 关键原文：行高网格是所有垂直间距的基础；脱离网格的间距产生"视觉错拍"
5. **W3C 中文排版需求（clreq）演进介绍（Type is Beautiful 系文章）**
   - https://developer.baidu.com/article/detail.html?id=3681172

## 三、与"呼吸感"直接相关的判断标准（供设计验收用）

1. **行距 vs 段距有明确层级**：段落间隙应 ≥ 1×行高，否则"行接行"与"段接段"分不清
   - 本博客现状：line-height 1.8(28.8px) + 段距 16px → 段落间隙 < 行高间距，段落感弱 ← 呼吸感缺失主因之一
2. **标题与正文间距成比例**：标题上方空间应明显大于下方（1.5–2× : 0.5×）
   - 本博客现状：h2 上 28px / 下 12px（约 2.3:1，方向对但绝对值偏小）；h2 行高继承 1.8 ← 标题显挤
3. **垂直节奏对齐**：主要块间距（段落/代码/引用/图片/列表）应落在行高基线的倍数上
   - 本博客现状：段落 16px、代码 16px、引用 16px、图片 16px、h2 上 28 下 12…与 28.8px 基线无倍数关系 ← 视觉错拍
4. **暗色主题补偿**：暗底 CTR 绿色主题正文未做行高/字距补偿 ← 低对比暗底可读性