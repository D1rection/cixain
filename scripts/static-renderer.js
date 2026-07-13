import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const distDir = join(rootDir, 'dist')
const contentDir = join(rootDir, 'content')

const SITE_URL = process.env.SITE_URL || 'https://d1rection.github.io/cixain'
const SITE_NAME = "Cicada's blog"
const SITE_DESC = 'cicada 的个人博客，记录技术与生活'

/** 根据路由数据生成 meta 标签 */
function getMeta(route) {
  const { path, data } = route
  const url = `${SITE_URL}${path === '/' ? '' : path}`

  if (path === '/' || path.startsWith('/page/')) {
    return { title: SITE_NAME, description: SITE_DESC, url, type: 'website' }
  }
  if (path.startsWith('/blog/')) {
    const post = data.post
    return {
      title: `${post.title} — ${SITE_NAME}`,
      description: post.description || SITE_DESC,
      url,
      type: 'article',
    }
  }
  if (path === '/about') {
    return { title: `关于 — ${SITE_NAME}`, description: SITE_DESC, url, type: 'website' }
  }
  if (path.startsWith('/category/')) {
    const name = path.replace('/category/', '')
    return { title: `${name} — ${SITE_NAME}`, description: `${name}分类下的文章`, url, type: 'website' }
  }
  if (path.startsWith('/tag/')) {
    const name = path.replace('/tag/', '')
    return { title: `${name} — ${SITE_NAME}`, description: `标签 #${name} 的相关文章`, url, type: 'website' }
  }
  return { title: `404 — ${SITE_NAME}`, description: SITE_DESC, url, type: 'website' }
}

function renderMeta(meta) {
  return `<title>${meta.title}</title>
    <meta name="description" content="${meta.description}" />
    <meta property="og:title" content="${meta.title}" />
    <meta property="og:description" content="${meta.description}" />
    <meta property="og:url" content="${meta.url}" />
    <meta property="og:type" content="${meta.type}" />`
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
      },
    })),
    {
      path: '/about',
      output: join('about', 'index.html'),
      data: {
        pageContent: pagesData.about || '',
      },
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
      .replace(/<title>.*<\/title>\n\s*<!--head-meta-->/, () => renderMeta(meta))
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
