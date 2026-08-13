import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const distDir = join(rootDir, 'dist')
const contentDir = join(rootDir, 'content')

const SITE_URL = process.env.SITE_URL || 'https://blog.cicadae.cloud'
const SITE_NAME = "Cicada's blog"
const SITE_DESC = 'cicada 的个人博客，记录技术与生活'

/** cover 归一为绝对 URL：https 开头原样，相对路径挂到 SITE_URL */
function normalizeImage(url) {
  if (/^https?:\/\//.test(url)) return url
  return `${SITE_URL}/${url.replace(/^\/+/, '')}`
}

/** 根据路由数据生成 meta 标签 */
function getMeta(route) {
  const { path, data } = route
  const url = `${SITE_URL}${path === '/' ? '' : path}`
  const defaultImage = { image: `${SITE_URL}/og/default.png`, imageAlt: SITE_NAME }

  if (path === '/' || path.startsWith('/page/')) {
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
    const postUrl = `${SITE_URL}/blog/${post.slug}`
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
    if (post.series) crumbs.push({ name: post.series, url: `${SITE_URL}/series/${encodeURIComponent(post.series)}` })
    else if (post.category) crumbs.push({ name: post.category, url: `${SITE_URL}/category/${post.category}` })
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

  const PAGE_SIZE = 10

  // wouter 是纯 ESM，ssrLoadModule 开箱即用
  const vite = await createServer({
    root: rootDir,
    server: { middlewareMode: true },
    appType: 'custom',
  })

  const { render } = await vite.ssrLoadModule('/src/entry-server.jsx')

  const routes = [
    { path: '/', output: 'index.html', data: { posts: posts.map(p => ({
      ...p,
      postContent: readFileSync(join(contentDir, 'posts', `${p.slug}.html`), 'utf-8'),
    })) } },
    ...posts.map(p => ({
      path: `/blog/${p.slug}`,
      output: join('blog', p.slug, 'index.html'),
      data: {
        post: p,
        postContent: readFileSync(join(contentDir, 'posts', `${p.slug}.html`), 'utf-8'),
        posts: posts.map(q => ({
          ...q,
          postContent: readFileSync(join(contentDir, 'posts', `${q.slug}.html`), 'utf-8'),
        })),
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
    // 分页
    ...Array.from({ length: Math.max(0, Math.ceil(posts.length / PAGE_SIZE) - 1) }, (_, i) => {
      const page = i + 2
      const paged = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
      return {
        path: `/page/${page}`,
        output: join('page', String(page), 'index.html'),
        data: { posts: paged.map(p => ({
          ...p,
          postContent: readFileSync(join(contentDir, 'posts', `${p.slug}.html`), 'utf-8'),
        })) },
      }
    }),
    // 分类页
    ...['Tech', 'Life'].map(slug => {
      const filtered = posts.filter(p => p.category === slug)
      return {
        path: `/category/${slug}`,
        output: join('category', slug, 'index.html'),
        data: { posts: filtered.map(p => ({
          ...p,
          postContent: readFileSync(join(contentDir, 'posts', `${p.slug}.html`), 'utf-8'),
        })) },
      }
    }),
    // 标签页
    ...[...new Set(posts.flatMap(p => p.tags))].map(slug => {
      const filtered = posts.filter(p => p.tags.includes(slug))
      return {
        path: `/tag/${slug}`,
        output: join('tag', slug, 'index.html'),
        data: { posts: filtered.map(p => ({
          ...p,
          postContent: readFileSync(join(contentDir, 'posts', `${p.slug}.html`), 'utf-8'),
        })) },
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
