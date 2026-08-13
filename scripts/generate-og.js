import { readFileSync, readdirSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { createElement } from 'react'
import htm from 'htm'
import { ImageResponse } from '@vercel/og'
import { wrapTitle } from './og-text.js'

const html = htm.bind(createElement)

const POSTS_JSON = 'content/posts/posts.json'
const OUT_DIR = 'public/og'
const WIDTH = 1200
const HEIGHT = 630
const FONT_DIR = 'scripts/assets/fonts'

// 复刻主页背景三层结构：暗色底 + 背景图 + 92% 纯色遮罩（body::after）
// 背景图固定使用 public/og/bg.png（本地文件，无网络依赖）
const BG = '#0c0c0a'
const MUTED = '#a1a1aa'
const OVERLAY = 'rgba(12, 12, 10, 0.92)'

function fetchBg() {
  const buf = readFileSync(join(OUT_DIR, 'bg.png'))
  return `data:image/png;base64,${buf.toString('base64')}`
}

function card(body, bgData) {
  return html`<div style=${{ position: 'relative', width: '100%', height: '100%', background: BG, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72 }}>
    ${bgData ? html`<img src=${bgData} style=${{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />` : ''}
    <div style=${{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: OVERLAY }} />
    <div style=${{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      ${body}
    </div>
  </div>`
}

// 阅读时长估算：构建产物 HTML 去标签后按 400 字/分钟（业界卡片常见副标题）
function readMinutes(slug) {
  try {
    const html = readFileSync(join('content/posts', `${slug}.html`), 'utf8')
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    return Math.max(1, Math.round([...text].length / 400))
  } catch {
    return null
  }
}

// 标题字号：默认 72px；超 13 全角单位降为 56px（安全行宽 940px 内两行）
function titleSize(title) {
  let units = 0
  for (const ch of title) units += ch.codePointAt(0) >= 0x2e80 && ch.codePointAt(0) <= 0x9fff ? 1 : 0.5
  return units > 13 ? 56 : 72
}

function postCard(post, bgData) {
  const date = post.date.slice(0, 10)
  const size = titleSize(post.title)
  // 断行上限按字号折算：安全行宽 940px / 字号
  const lines = wrapTitle(post.title, Math.floor(940 / size))
  // 断行上限按 900px 行宽 / 24px 字号折算，超出会触发 satori 二次折行破坏两行布局
  const descLines = wrapTitle(post.description || '', 37)
  const mins = readMinutes(post.slug)
  // 信息行标签：系列名 → tags（/ 分隔）→ 分类，逐级回退
  const label = post.series
    || (post.tags && post.tags.length ? post.tags.join(' / ') : null)
    || post.category
    || null
  const info = [date, label, mins ? `约 ${mins} 分钟` : null]
    .filter(Boolean)
    .join(' · ')
  return card(html`
    <div style=${{ display: 'flex', flexDirection: 'column' }}>
      <div style=${{
        color: '#fff', fontSize: size, fontFamily: 'TITLE',
        lineHeight: 1.3, maxWidth: 940, display: 'flex', flexDirection: 'column',
      }}>
        ${lines.map(l => html`<div>${l}</div>`)}
      </div>
      <div style=${{
        marginTop: 24, color: MUTED, fontSize: 24, fontFamily: 'BODY',
        lineHeight: 1.5, maxWidth: 900, display: 'flex', flexDirection: 'column',
      }}>
        ${descLines.map(l => html`<div>${l}</div>`)}
      </div>
    </div>
    <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontFamily: 'BODY', fontSize: 18, color: '#71717a' }}>
      <span>${info}</span>
      <span style=${{ color: '#e4e4e7', fontSize: 20 }}>${'cicadae.cloud'}</span>
    </div>`, bgData)
}

function defaultCard(posts, bgData) {
  const seriesCount = new Set(posts.map(p => p.series).filter(Boolean)).size
  return card(html`
    <div style=${{ display: 'flex', flexDirection: 'column' }}>
      <div style=${{ color: '#fff', fontSize: 88, fontFamily: 'TITLE' }}>${'cixain'}</div>
      <div style=${{ marginTop: 24, color: MUTED, fontSize: 24, fontFamily: 'BODY' }}>${'cicada 的个人博客，记录技术与生活'}</div>
    </div>
    <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontFamily: 'BODY', fontSize: 18, color: '#71717a' }}>
      <span>${`${posts.length} 篇文章 · ${seriesCount} 个系列`}</span>
      <span style=${{ color: '#e4e4e7', fontSize: 20 }}>${'cicadae.cloud'}</span>
    </div>`, bgData)
}

const posts = JSON.parse(readFileSync(POSTS_JSON, 'utf8'))
const active = posts.filter(p => !p.draft)

// 完整字体直接加载（构建时内存解析，无子集化缺字风险）
// 标题得意黑（斜体展示字体），其余全部阿里普惠体 Bold
const FONTS = [
  { name: 'TITLE', data: readFileSync(join(FONT_DIR, 'SmileySans-Oblique.ttf')), weight: 400 },
  { name: 'BODY', data: readFileSync(join(FONT_DIR, 'AlibabaPuHuiTi-3-85-Bold.ttf')), weight: 400 },
]

// 幂等清理：删除不再需要的旧图
mkdirSync(OUT_DIR, { recursive: true })
const existing = readdirSync(OUT_DIR).filter(f => f.endsWith('.png'))
const needed = new Set([...active.filter(p => !p.cover).map(p => `${p.slug}.png`), 'default.png', 'bg.png'])
for (const f of existing) {
  if (!needed.has(f)) rmSync(join(OUT_DIR, f))
}

const bgData = await fetchBg()
for (const post of active) {
  if (post.cover) continue
  const resp = new ImageResponse(postCard(post, bgData), { width: WIDTH, height: HEIGHT, fonts: FONTS })
  writeFileSync(join(OUT_DIR, `${post.slug}.png`), Buffer.from(await resp.arrayBuffer()))
}
const resp = new ImageResponse(defaultCard(active, bgData), { width: WIDTH, height: HEIGHT, fonts: FONTS })
writeFileSync(join(OUT_DIR, 'default.png'), Buffer.from(await resp.arrayBuffer()))
