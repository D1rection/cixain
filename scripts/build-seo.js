import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const distDir = join(rootDir, 'dist')
const publicDir = join(rootDir, 'public')
const contentDir = join(rootDir, 'content')

// 分类列表唯一源：src/config.js（纯 ESM，Node 直接 import）
import { SITE } from '../src/config.js'

const SITE_URL = process.env.SITE_URL || 'https://blog.cicadae.cloud'
const SITE_NAME = "Cicada's blog"
const SITE_DESC = 'cicada 的个人博客，记录技术与生活'
const BAIDU_TOKEN = process.env.BAIDU_TOKEN || ''
// 最近 N 篇输出全文，更早仅摘要：订阅器内直读新文，同时控制 feed 体积
const FEED_FULL = 3

function build() {
  const posts = JSON.parse(readFileSync(join(contentDir, 'posts', 'posts.json'), 'utf-8'))
  const now = new Date().toISOString()

  // ── sitemap.xml ──
  const urls = [
    { loc: '', priority: 1.0 },
    { loc: '/about', priority: 0.6 },
    { loc: '/archive', priority: 0.6 },
    ...posts.map(p => ({ loc: `/blog/${p.slug}`, priority: 0.8 })),
  ]

  // 分页
  const PAGE_SIZE = 10
  const totalPages = Math.ceil(posts.length / PAGE_SIZE)
  for (let i = 2; i <= totalPages; i++) {
    urls.push({ loc: `/page/${i}`, priority: 0.5 })
  }

  // 分类页（含隐藏分类：题解分类页需要被收录）
  for (const slug of SITE.categories.map(([, s]) => s).filter(Boolean)) {
    urls.push({ loc: `/category/${slug}`, priority: 0.6 })
  }

  // 标签页
  const tags = [...new Set(posts.flatMap(p => p.tags))]
  for (const slug of tags) {
    urls.push({ loc: `/tag/${slug}`, priority: 0.5 })
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  for (const dir of [publicDir, distDir]) {
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'sitemap.xml'), sitemap)
  }
  console.log('[seo] sitemap.xml')

  // ── feed.xml (Atom) ──
  // 题解（隐藏分类）不进 RSS：订阅者不被刷屏；sitemap/IndexNow 保留收录
  const feedPosts = posts
    .filter(p => !p.draft)
    .filter(p => !SITE.homeExcludedCategories.includes(p.category))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20)

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <title>${SITE_NAME}</title>
  <subtitle>${SITE_DESC}</subtitle>
  <link href="${SITE_URL}/feed.xml" rel="self" />
  <link href="${SITE_URL}" />
  <updated>${now}</updated>
  <id>${SITE_URL}/</id>
  <author>
    <name>cicada</name>
  </author>
${feedPosts.map((p, i) => {
  const html = readFileSync(join(contentDir, 'posts', `${p.slug}.html`), 'utf-8')
  const tags = (p.tags || []).map(t => `<category term="${escapeXml(t)}"/>`).join('\n')
  // 缩略图：cover 优先（归一为绝对 URL），否则兜底 og 图
  const thumb = /^https?:/.test(p.cover || '')
    ? p.cover
    : p.cover
      ? `${SITE_URL}/${p.cover.replace(/^\/+/, '')}`
      : `${SITE_URL}/og/${p.slug}.png`
  const full = i < FEED_FULL
  return `  <entry>
    <title>${escapeXml(p.title)}</title>
    <link href="${SITE_URL}/blog/${encodeURI(p.slug)}"/>
    <id>${SITE_URL}/blog/${encodeURI(p.slug)}</id>
    <published>${new Date(p.date).toISOString()}</published>
    <updated>${new Date(p.updated || p.date).toISOString()}</updated>
    <summary>${escapeXml(p.description || '')}</summary>
    <media:content url="${escapeXml(thumb)}" medium="image"/>
${full ? `    <content type="html">${escapeXml(html)}</content>` : ''}
${tags}
  </entry>`
}).join('\n')}
</feed>`

  for (const dir of [publicDir, distDir]) {
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'feed.xml'), feed)
  }
  console.log(`[seo] feed.xml (${feedPosts.length} entries)`)
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ── IndexNow 提交 ─────────────────────────────────
async function submitIndexNow(posts) {
  const files = readdirSync(publicDir)
  const keyFile = files.find(f => /^[0-9A-F-]+\.txt$/i.test(f))
  if (!keyFile) return

  const key = keyFile.replace(/\.txt$/, '')
  const keyLocation = `${SITE_URL}/${keyFile}`

  const urlList = [
    SITE_URL + '/',
    SITE_URL + '/about',
    SITE_URL + '/archive',
    ...posts.filter(p => !p.draft).map(p => `${SITE_URL}/blog/${p.slug}`),
  ]

  const body = JSON.stringify({ host: new URL(SITE_URL).host, key, keyLocation, urlList })

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
    })
    if (res.ok) {
      console.log(`[seo] IndexNow submitted ${urlList.length} URLs`)
    } else {
      console.warn(`[seo] IndexNow returned ${res.status} ${res.statusText}`)
    }
  } catch (e) {
    console.warn('[seo] IndexNow submission failed:', e.message)
  }
}

// ── 百度主动推送 ───────────────────────────────────
async function submitBaidu(posts) {
  if (!BAIDU_TOKEN) return

  const urlList = [
    SITE_URL + '/',
    SITE_URL + '/about',
    SITE_URL + '/archive',
    ...posts.filter(p => !p.draft).map(p => `${SITE_URL}/blog/${p.slug}`),
  ]

  const body = urlList.join('\n')

  try {
    const res = await fetch(`http://data.zz.baidu.com/urls?site=${SITE_URL}&token=${BAIDU_TOKEN}`, {
      method: 'POST', headers: { 'Content-Type': 'text/plain' }, body,
    })
    const json = await res.json()
    if (json.success) {
      console.log(`[seo] Baidu submitted ${json.success}/${urlList.length} URLs (remain: ${json.remain})`)
    } else {
      console.warn(`[seo] Baidu error:`, json)
    }
  } catch (e) {
    console.warn('[seo] Baidu submission failed:', e.message)
  }
}

async function submitAll(posts) {
  await Promise.allSettled([submitIndexNow(posts), submitBaidu(posts)])
}

build()

if (process.env.CI) {
  const posts = JSON.parse(readFileSync(join(contentDir, 'posts', 'posts.json'), 'utf-8'))
  submitAll(posts).catch(() => {})
}
