import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const distDir = join(rootDir, 'dist')
const contentDir = join(rootDir, 'content')

const SITE_URL = process.env.SITE_URL || 'https://d1rection.github.io/cixain'
const SITE_NAME = "Cicada's blog"
const SITE_DESC = 'cicada 的个人博客，记录技术与生活'

function build() {
  const posts = JSON.parse(readFileSync(join(contentDir, 'posts', 'posts.json'), 'utf-8'))
  const now = new Date().toISOString()

  // ── sitemap.xml ──
  const urls = [
    { loc: '', priority: 1.0 },
    { loc: '/about', priority: 0.6 },
    ...posts.map(p => ({ loc: `/blog/${p.slug}`, priority: 0.8 })),
  ]

  // 分页
  const PAGE_SIZE = 10
  const totalPages = Math.ceil(posts.length / PAGE_SIZE)
  for (let i = 2; i <= totalPages; i++) {
    urls.push({ loc: `/page/${i}`, priority: 0.5 })
  }

  // 分类页
  const CATEGORIES = ['Tech', 'Life']
  for (const slug of CATEGORIES) {
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

  writeFileSync(join(distDir, 'sitemap.xml'), sitemap)
  console.log('[seo] sitemap.xml')

  // ── feed.xml (Atom) ──
  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${SITE_NAME}</title>
  <subtitle>${SITE_DESC}</subtitle>
  <link href="${SITE_URL}/feed.xml" rel="self" />
  <link href="${SITE_URL}" />
  <updated>${now}</updated>
  <id>${SITE_URL}/</id>
  <author>
    <name>cicada</name>
  </author>
${posts.map(p => `  <entry>
    <title>${escapeXml(p.title)}</title>
    <link href="${SITE_URL}/blog/${p.slug}"/>
    <id>${SITE_URL}/blog/${p.slug}</id>
    <published>${new Date(p.date).toISOString()}</published>
    <updated>${new Date(p.date).toISOString()}</updated>
    <summary>${escapeXml(p.description || '')}</summary>
  </entry>`).join('\n')}
</feed>`

  writeFileSync(join(distDir, 'feed.xml'), feed)
  console.log(`[seo] feed.xml (${posts.length} entries)`)
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

build()
