import { readFileSync, writeFileSync, mkdirSync, cpSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const distDir = join(rootDir, 'dist')
const contentDir = join(rootDir, 'content')

// 分类列表唯一源：src/config.js（纯 ESM，Node 直接 import）
import { SITE } from '../src/config.js'
import { routePath } from '../src/utils/routes.js'

const SITE_URL = process.env.SITE_URL || 'https://blog.cicadae.cloud'
const SITE_NAME = "Cicada's blog"
const SITE_DESC = 'cicada 的个人博客，记录技术与生活'

/** cover 归一为绝对 URL：https 开头原样，相对路径挂到 SITE_URL */
function normalizeImage(url) {
  if (/^https?:\/\//.test(url)) return url
  return `${SITE_URL}/${url.replace(/^\/+/, '')}`
}

/** 元数据条目：剥离 postContent，仅保留 posts.json 里的元数据字段 */
function metaOnly(p) {
  const { postContent, ...meta } = p
  return meta
}

/** 根据路由数据生成 meta 标签 */
function getMeta(route) {
  const { path, data } = route
  // GitHub Pages 目录型路由 301 到带尾斜杠版本，og:url/canonical 用规范 URL 保持一致
  const url = `${SITE_URL}${routePath(path)}`
  const defaultImage = { image: `${SITE_URL}/og/default.png`, imageAlt: SITE_NAME }

  if (path === '/') {
    return { title: SITE_NAME, description: SITE_DESC, url, type: 'website', ...defaultImage }
  }
  if (path.startsWith('/blog/')) {
    const post = data.post
    return {
      title: `${post.title} — ${SITE_NAME}`,
      description: post.description || SITE_DESC,
      url,
      type: 'article',
      image: post.cover ? normalizeImage(post.cover) : `${SITE_URL}/og/${post.slug}.png`,
      imageAlt: post.title,
      publishedTime: post.date,
      author: 'cicada',
      section: post.category || null,
      tags: post.tags || [],
    }
  }
  if (path === '/about') {
    return { title: `关于 — ${SITE_NAME}`, description: SITE_DESC, url, type: 'website', ...defaultImage }
  }
  if (path === '/archive') {
    return { title: `归档 — ${SITE_NAME}`, description: `${SITE_NAME} 全部文章归档`, url, type: 'website', ...defaultImage }
  }
  if (path.startsWith('/category/')) {
    const name = path.replace('/category/', '')
    return { title: `${name} — ${SITE_NAME}`, description: `${name}分类下的文章`, url, type: 'website', ...defaultImage }
  }
  if (path.startsWith('/tag/')) {
    const name = path.replace('/tag/', '')
    return { title: `${name} — ${SITE_NAME}`, description: `标签 #${name} 的相关文章`, url, type: 'website', ...defaultImage }
  }
  if (path.startsWith('/series/')) {
    const name = decodeURIComponent(path.replace('/series/', ''))
    return { title: `${name} — ${SITE_NAME}`, description: `${name} 系列文章`, url, type: 'website', ...defaultImage }
  }
  return { title: `404 — ${SITE_NAME}`, description: SITE_DESC, url, type: 'website', ...defaultImage }
}

function renderMeta(meta) {
  const articleTags = meta.publishedTime ? `
    <meta property="article:published_time" content="${meta.publishedTime}" />
    <meta property="article:author" content="${meta.author}" />
    ${meta.section ? `<meta property="article:section" content="${meta.section}" />` : ''}
    ${(meta.tags || []).map(t => `<meta property="article:tag" content="${t}" />`).join('\n    ')}` : ''
  return `<title>${meta.title}</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="alternate" type="application/atom+xml" title="Cicada's blog" href="/feed.xml">
    <link rel="canonical" href="${meta.url}" />
    <meta name="description" content="${meta.description}" />
    <meta name="theme-color" content="#f4efe6" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#0c0c0a" media="(prefers-color-scheme: dark)">
    <meta property="og:title" content="${meta.title}" />
    <meta property="og:description" content="${meta.description}" />
    <meta property="og:url" content="${meta.url}" />
    <meta property="og:type" content="${meta.type}" />
    <meta property="og:image" content="${meta.image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:alt" content="${meta.imageAlt}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:locale" content="zh_CN" />${articleTags}
    <meta name="wx:webpage" content="true" />
    <meta property="wx:thumbnail" content="${meta.image}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${meta.title}" />
    <meta name="twitter:description" content="${meta.description}" />
    <meta name="twitter:image" content="${meta.image}" />`
}

function renderJsonLd(route) {
  if (route.path === '/') {
    const site = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESC,
    }
    return `<script type="application/ld+json">${JSON.stringify(site)}</script>`
  }
  if (route.path.startsWith('/blog/')) {
    const post = route.data.post
    const postUrl = `${SITE_URL}${routePath(`/blog/${post.slug}`)}`
    const image = post.cover ? normalizeImage(post.cover) : `${SITE_URL}/og/${post.slug}.png`
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description || '',
      datePublished: post.date,
      image,
      author: [{ '@type': 'Person', name: 'cicada' }],
      publisher: { '@type': 'Person', name: 'cicada' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
      url: postUrl,
    }
    // 面包屑：首页 > 系列（或分类）> 文章
    const crumbs = [{ name: SITE_NAME, url: `${SITE_URL}/` }]
    if (post.series) crumbs.push({ name: post.series, url: `${SITE_URL}${routePath(`/series/${encodeURIComponent(post.series)}`)}` })
    else if (post.category) crumbs.push({ name: post.category, url: `${SITE_URL}${routePath(`/category/${post.category}`)}` })
    crumbs.push({ name: post.title, url: postUrl })
    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        item: c.url,
      })),
    }
    return `<script type="application/ld+json">${JSON.stringify(ld)}</script>
    <script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`
  }
  return ''
}

async function build() {
  const posts = JSON.parse(readFileSync(join(contentDir, 'posts', 'posts.json'), 'utf-8'))
  const pagesData = JSON.parse(readFileSync(join(contentDir, 'pages', 'pages.json'), 'utf-8'))
  const template = readFileSync(join(distDir, 'index.html'), 'utf-8')

  // 文章正文发布到 dist，供客户端 SPA 跳转时按需 fetch（与 dev 路径 /content/posts/ 一致）
  // 注意：cpSync 的 filter 会作用于源根目录本身，需按「目录放行 + 文件按后缀过滤」判断，
  // 否则根目录被过滤会导致整棵子树静默跳过
  cpSync(join(contentDir, 'posts'), join(distDir, 'content', 'posts'), {
    recursive: true,
    filter: f => statSync(f).isDirectory() || f.endsWith('.html'),
  })

  // wouter 是纯 ESM，ssrLoadModule 开箱即用
  const vite = await createServer({
    root: rootDir,
    server: { middlewareMode: true },
    appType: 'custom',
  })

  const { render } = await vite.ssrLoadModule('/src/entry-server.jsx')

  const routes = [
    { path: '/', output: 'index.html', data: { posts: posts.map(metaOnly) } },
    ...posts.map(p => ({
      path: `/blog/${p.slug}`,
      output: join('blog', p.slug, 'index.html'),
      data: {
        // post 只内联当前文章正文供 SSR 水合；列表其余文章仅元数据，跳转时按需 fetch
        post: {
          ...p,
          postContent: readFileSync(join(contentDir, 'posts', `${p.slug}.html`), 'utf-8'),
        },
        posts: posts.map(metaOnly),
      },
    })),
    {
      path: '/about',
      output: join('about', 'index.html'),
      data: {
        pageContent: pagesData.about || '',
        posts,
      },
    },
    {
      path: '/archive',
      output: join('archive', 'index.html'),
      data: { posts },
    },
    {
      path: '/404',
      output: '404.html',
      data: { posts: [] },
    },
    // 分类页（隐藏分类如题解同样生成：分类页是题解的唯一入口）
    ...SITE.categories.filter(([, slug]) => slug).map(([, slug]) => {
      const filtered = posts.filter(p => p.category === slug)
      return {
        path: `/category/${slug}`,
        output: join('category', slug, 'index.html'),
        data: { posts: filtered.map(metaOnly) },
      }
    }),
    // 标签页
    ...[...new Set(posts.flatMap(p => p.tags))].map(slug => {
      const filtered = posts.filter(p => p.tags.includes(slug))
      return {
        path: `/tag/${slug}`,
        output: join('tag', slug, 'index.html'),
        data: { posts: filtered.map(metaOnly) },
      }
    }),
    // 系列页：由已发布文章元数据动态派生，站内跳转与直接访问使用同一路由
    ...[...new Set(posts.map(p => p.series).filter(Boolean))].map(name => {
      const filtered = posts.filter(p => p.series === name)
      return {
        path: `/series/${encodeURIComponent(name)}`,
        output: join('series', name, 'index.html'),
        data: { posts: filtered.map(metaOnly) },
      }
    }),
  ]

  for (const route of routes) {
    const appHtml = render(route.path, route.data)
    const meta = getMeta(route)
    const dataScript = `<script id="__BLOG_DATA__" type="application/json">${JSON.stringify(route.data)}</script>`

    const fullHtml = template
      .replace('<!--ssr-outlet-->', appHtml)
      .replace(/<title>.*<\/title>\n[\s\S]*?<!--head-meta-->/, () => renderMeta(meta))
      .replace('</head>', `${renderJsonLd(route)}\n  </head>`)
      .replace('</body>', `${dataScript}\n  </body>`)

    const outputPath = join(distDir, route.output)
    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, fullHtml)
    console.log(`[ssg] ${route.path} → ${route.output}`)
  }

  await vite.close()
}

build().catch(err => {
  console.error(err)
  process.exit(1)
})
