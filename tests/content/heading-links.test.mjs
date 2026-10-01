import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { compileMD, buildPosts } from '../../scripts/build-posts.js'
import { resolveWikiAnchor, parseAnchorIndex } from '../../scripts/lib/heading-links.js'

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'cixain-headings-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  for (const kind of ['posts', 'fragment', 'pages']) await mkdir(join(directory, kind))
  const put = (kind, slug, body, fields = '') => writeFile(join(directory, kind, `${slug}.md`),
    `---\ntitle: ${slug}\ndate: 2020-01-01\ndescription: description\n${fields}---\n${body}`)
  const html = (kind, slug) => readFile(join(directory, kind, `${slug}.html`), 'utf8')
  return { directory, put, html }
}

const hrefs = html => [...html.matchAll(/href="([^"]*)"/g)].map(match => decodeURIComponent(match[1]))

test('original heading names resolve across forward, circular, fragment and page links', async t => {
  const { directory, put, html } = await fixture(t)
  await put('posts', 'a', '## 1. 梯度下降法\n\n[[z#3.3 Softmax 回归|推导]]\n\n[[fragment/z#Fragment Title]]')
  await put('posts', 'z', '## 3.3 Softmax 回归\n\n[[a#1. 梯度下降法]]')
  await put('fragment', 'z', '## Fragment Title\n\n[[#Fragment Title]]\n\n[[z#3.3 Softmax 回归]]')
  await put('pages', 'about', '## About This Site\n\n[[#About This Site]]\n\n[[a#1. 梯度下降法]]')
  const result = await buildPosts({ directory })
  assert.deepEqual(result.diagnostics, [])
  assert.deepEqual(hrefs(await html('posts', 'a')), ['/blog/z/#33-softmax-回归', '/fragment/z/#fragment-title'])
  assert.deepEqual(hrefs(await html('posts', 'z')), ['/blog/a/#1-梯度下降法'])
  assert.deepEqual(hrefs(await html('fragment', 'z')), ['#fragment-title', '/blog/z/#33-softmax-回归'])
  assert.deepEqual(hrefs(await html('pages', 'about')), ['#about-this-site', '/blog/a/#1-梯度下降法'])
  assert.match(await html('posts', 'a'), />推导<\/a>/)
  assert.deepEqual(result.posts.find(post => post.slug === 'z').backlinks.map(x => x.id).sort(), ['fragment:z', 'post:a'])
  const index = JSON.parse(await readFile(join(directory, 'anchor-index.json'), 'utf8'))
  assert.equal(index.schemaVersion, 1)
  assert.equal(index.documents['post:z'].headings[0].id, '33-softmax-回归')
})

test('actual IDs distinguish slug collisions, duplicate titles and explicit block IDs', async () => {
  const refs = []
  const { html, anchors } = await compileMD('## A.B\n\n## AB\n\n## Repeat Title\n\n## Repeat Title\n\n## Fixed Heading ^fixed\n\n[[#A.B]]\n\n[[#AB]]\n\n[[#Repeat Title]]\n\n[[#repeat-title-1]]\n\n[[#Fixed Heading]]\n\n[[#^fixed]]\n\n[[^fixed]]', 'local', refs)
  assert.deepEqual(anchors, ['ab', 'ab-1', 'repeat-title', 'repeat-title-1', 'fixed'])
  assert.deepEqual(hrefs(html), ['#ab', '#ab-1', '#repeat-title', '#repeat-title-1', '#fixed', '#fixed', '#fixed'])
  assert.equal(refs.length, 7)
  assert(refs.every(ref => ref.syntax === 'wiki' && ref.resolvedAnchor))
  assert(!/data-cixain/.test(html))
})

test('source title text survives inline formatting and KaTeX without changing existing IDs', async () => {
  const source = '## **Softmax** 与 $x$\n\n## `Code` and [Link](https://example.com)\n\n## ==Highlight== Title\n\n[[#Softmax 与 $x$|公式]]\n\n[[#Softmax 与 x]]\n\n[[#Code and Link]]\n\n[[#Highlight Title]]'
  const { html, anchors } = await compileMD(source, 'local')
  assert.deepEqual(anchors, ['softmax-与-xxx', 'code-and-link', 'highlight-title'])
  assert.deepEqual(hrefs(html).slice(-4), ['#softmax-与-xxx', '#softmax-与-xxx', '#code-and-link', '#highlight-title'])
  assert.match(html, /class="katex"/)
  assert(!/data-cixain/.test(html))
})

test('wiki provenance, original spelling and URL semantics are preserved', async t => {
  const refs = []
  const { html } = await compileMD('## 1. 标题\n\n[[#1.%20标题|中文别名]] 和 [[#1. 标题]]\n\n[网址](#1-标题)', 'local', refs)
  assert.deepEqual(hrefs(html), ['#1-标题', '#1-标题', '#1-标题'])
  assert.equal(refs.length, 3)
  assert.equal(refs[0].raw, '[[#1.%20标题|中文别名]]')
  assert.deepEqual(refs[0].position, { line: 3, column: 1 })
  assert.equal(refs[2].syntax, 'url')
  const { directory, put } = await fixture(t)
  await put('posts', 'a', '## 1. 标题\n\n[[#1. 标题]]\n\n[失效网址](#1.%20标题)')
  const result = await buildPosts({ directory, dev: true })
  assert.deepEqual(result.diagnostics.map(x => x.code), ['missing-anchor'])
  assert.equal(decodeURIComponent(result.diagnostics[0].raw), '#1. 标题')
})

test('ambiguous wiki title versus existing ID fails with its original source position', async t => {
  const { directory, put } = await fixture(t)
  await put('posts', 'a', '## A\n\n## a ^other\n\n[[#a|歧义]]\n\n[明确 ID](#a)\n\n[[#^other]]')
  const dev = await buildPosts({ directory, dev: true })
  assert.deepEqual(dev.diagnostics.map(x => x.code), ['ambiguous-anchor'])
  assert.equal(dev.diagnostics[0].raw, '[[#a|歧义]]')
  assert.deepEqual(dev.diagnostics[0].sourcePosition, { line: 10, column: 1 })
  await assert.rejects(buildPosts({ directory }), /内容校验失败/)
})

test('failed builds preserve all output including the shared anchor index', async t => {
  const { directory, put, html } = await fixture(t)
  await put('posts', 'a', '## Original Title\n\n[[#Original Title]]')
  await buildPosts({ directory })
  const originalHtml = await html('posts', 'a')
  const originalIndex = await readFile(join(directory, 'anchor-index.json'), 'utf8')
  await put('posts', 'a', '## Changed Title\n\n[[#Missing Heading|失效]]\n\n[[draft#Draft Heading]]')
  await put('posts', 'draft', '## Draft Heading', 'draft: true\n')
  await assert.rejects(buildPosts({ directory }), /内容校验失败/)
  assert.equal(await html('posts', 'a'), originalHtml)
  assert.equal(await readFile(join(directory, 'anchor-index.json'), 'utf8'), originalIndex)
  const dev = await buildPosts({ directory, dev: true })
  assert.deepEqual(dev.diagnostics.map(x => x.code), ['missing-anchor'])
  assert(!dev.diagnostics.some(x => x.raw?.includes('Draft Heading')))
})

test('fold headings remain excluded from title resolution', async () => {
  const refs = []
  const { html, anchors, headings } = await compileMD('> [!fold] 题目\n> ## 输入格式\n> text\n\n## Outside Heading\n\n[[#Outside Heading]]\n\n[[#输入格式]]', 'local', refs)
  assert(!anchors.includes('输入格式'))
  assert.deepEqual(headings.map(x => x.title), ['Outside Heading'])
  assert.deepEqual(hrefs(html), ['#outside-heading', '#输入格式'])
  assert(!/data-cixain/.test(html))
})

test('only text aliases of distinct source titles are ambiguous, metadata is validated', () => {
  const document = { anchors: ['x', 'y'], blocks: [], headings: [
    { title: '$x$', textTitle: 'x', id: 'x' },
    { title: '$ x $', textTitle: 'x', id: 'y' },
  ] }
  const index = parseAnchorIndex({ schemaVersion: 1, documents: { 'post:a': document } })
  assert.equal(resolveWikiAnchor({ targetId: 'post:a', anchor: 'x' }, index).resolutionError.code, 'ambiguous-anchor')
  assert.equal(resolveWikiAnchor({ targetId: 'post:a', anchor: '$x$' }, index).resolvedAnchor, 'x')
  for (const value of [null, { schemaVersion: 2, documents: {} },
    { schemaVersion: 1, documents: { 'post:a': { ...document, anchors: [] } } }]) {
    assert.throws(() => parseAnchorIndex(value), /标题索引/)
  }
})

test('encoded literal percentages are decoded once and rebuilding does not reuse stale titles', async t => {
  const { directory, put, html } = await fixture(t)
  await put('posts', 'a', '## 100% Done\n\n[[#100%25 Done]]')
  await buildPosts({ directory })
  assert.deepEqual(hrefs(await html('posts', 'a')), ['#100-done'])
  await put('posts', 'a', '## New Title\n\n[[#100%25 Done]]')
  const result = await buildPosts({ directory, dev: true })
  assert.deepEqual(result.diagnostics.map(x => x.code), ['missing-anchor'])
})

test('deferred serialization preserves interactive data and IDs attached to rich blocks', async () => {
  const defs = []
  const { html, interactive, anchors } = await compileMD('## Interactive Heading\n\n```react:FlashCard\nconst value = 42\n```\n\n```js\nconst x = 1\n```\n\n^code\n\n$$x^2$$\n\n^equation\n\n[[#Interactive Heading]]\n\n[[#^code]]\n\n[[#^equation]]', 'local', [], defs)
  assert.deepEqual(interactive, [{ id: 0, component: 'FlashCard', code: 'const value = 42' }])
  assert.deepEqual(anchors, ['interactive-heading', 'code', 'equation'])
  assert.deepEqual(defs, ['code', 'equation'])
  assert.match(html, /data-interactive="FlashCard"/)
  assert.match(html, /class="pre-wrapper" id="code"/)
  assert.match(html, /id="equation"/)
  assert.deepEqual(hrefs(html), ['#interactive-heading', '#code', '#equation'])
})

test('ordinary content URLs under a base path still resolve against the same target', async t => {
  const { directory, put } = await fixture(t)
  const previous = process.env.VITE_BASE_URL
  process.env.VITE_BASE_URL = '/preview/'
  try {
    await put('posts', 'a', '[URL](/preview/fragment/z/#target-heading)\n\n[[fragment/z#Target Heading]]')
    await put('fragment', 'z', '## Target Heading')
    assert.deepEqual((await buildPosts({ directory })).diagnostics, [])
  } finally {
    if (previous == null) delete process.env.VITE_BASE_URL
    else process.env.VITE_BASE_URL = previous
  }
})
