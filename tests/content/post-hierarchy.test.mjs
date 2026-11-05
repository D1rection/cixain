import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { buildPosts } from '../../scripts/build-posts.js'
import { validatePostHierarchy } from '../../scripts/lib/post-hierarchy.js'
import { rootPosts, directChildPosts, parentPost } from '../../src/utils/postHierarchy.js'
import { buildTaxonomy } from '../../src/utils/taxonomy.js'
import { sortSeries } from '../../src/utils/series.js'

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'cixain-hierarchy-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  for (const folder of ['posts', 'fragment', 'pages']) await mkdir(join(directory, folder))
  const put = (slug, fields = '', folder = 'posts', body = '正文') => writeFile(join(directory, folder, `${slug}.md`),
    `---\ntitle: ${slug}\ndate: "2020-01-01"\ndescription: 概要\n${fields}---\n${body}`)
  return { directory, put }
}

function graph(entries) {
  return new Map(entries.map(([id, parent, state = 'visible', hasParent = true]) => [id, { file: `${id}.md`, parent, state, hasParent }]))
}

test('visible graph rejects malformed parents, missing targets, self links and cycles without recursion', () => {
  for (const parent of [1, [], {}, 'a', 'fragment:a', '/blog/a/', 'post:a#x', 'post:a/b', '[[post:a]]']) {
    const result = validatePostHierarchy(graph([['post:a', parent]]))
    assert.equal(result.diagnostics[0].code, 'invalid-post-parent')
    assert.equal(result.diagnostics[0].field, 'parent')
  }
  assert.equal(validatePostHierarchy(graph([['post:a', 'post:missing']])).diagnostics[0].code, 'missing-post-parent')
  assert.equal(validatePostHierarchy(graph([['post:a', 'post:a']])).diagnostics[0].code, 'self-post-parent')
  const cycle = validatePostHierarchy(graph([['post:a', 'post:b'], ['post:b', 'post:c'], ['post:c', 'post:a'], ['post:d', 'post:a']]))
  assert.equal(cycle.invalidIds.size, 4)
  assert(cycle.diagnostics.some(item => item.code === 'cyclic-post-parent' && item.reason.includes('post:a → post:b → post:c → post:a')))
  for (const parent of [undefined, null, '', '   ']) assert.equal(validatePostHierarchy(graph([['post:a', parent]])).parentIds.get('post:a'), null)
  const deep = Array.from({ length: 20000 }, (_, i) => [`post:${i}`, i === 19999 ? null : `post:${i + 1}`])
  assert.equal(validatePostHierarchy(graph(deep)).invalidIds.size, 0)
})

test('compiled children remain posts, lose classification, retain direct links and stay separate from same-name fragments', async t => {
  const { directory, put } = await fixture(t)
  await put('root', 'category: Tech\nseries: 主系列\n')
  await put('child', 'parent: " post:root "\ncategory: Tech\nseries: 错误系列\nseriesIndex: 4\nshowOnHome: true\ntags: [子标签]\n', 'posts', '[[fragment/child]]')
  await put('grandchild', 'parent: post:child\n')
  await put('child', '', 'fragment', '[[posts/child]]')
  const { posts, fragments } = await buildPosts({ directory })
  const child = posts.find(item => item.slug === 'child')
  assert.equal(child.kind, 'post')
  assert.equal(child.parentId, 'post:root')
  assert.equal(child.contentUrl, '/blog/child/')
  assert.equal(child.category, null)
  assert.equal(child.series, null)
  assert.equal(child.seriesIndex, null)
  assert.equal(child.showOnHome, true)
  assert.deepEqual(rootPosts(posts).map(item => item.slug), ['root'])
  assert.deepEqual(directChildPosts(posts, 'post:root').map(item => item.slug), ['child'])
  assert.deepEqual(directChildPosts(posts, 'post:child').map(item => item.slug), ['grandchild'])
  assert.equal(parentPost(posts, child).slug, 'root')
  assert(!Object.hasOwn(fragments[0], 'parentId'))
  assert.equal(fragments[0].backlinks[0].id, 'post:child')
  assert.deepEqual(posts.find(item => item.slug === 'root').backlinks, [])
  const registry = JSON.parse(await readFile(join(directory, 'registry.json'), 'utf8'))
  assert.equal(registry.length, 4)
  assert.equal(registry.find(item => item.id === child.id).parentId, 'post:root')
  assert((await readFile(join(directory, 'posts/child.html'), 'utf8')).includes('/fragment/child/'))
})

test('production errors write no artifacts; development removes invalid nodes and dependent descendants', async t => {
  const { directory, put } = await fixture(t)
  await put('root')
  await buildPosts({ directory })
  const paths = ['posts/posts.json', 'posts/root.html', 'registry.json', 'anchor-index.json']
  const before = await Promise.all(paths.map(file => readFile(join(directory, file), 'utf8')))
  await put('bad', 'parent: post:missing\n')
  await put('dependent', 'parent: post:bad\n')
  await put('frag', 'parent: null\n', 'fragment')
  await assert.rejects(buildPosts({ directory }), /内容校验失败/)
  assert.deepEqual(await Promise.all(paths.map(file => readFile(join(directory, file), 'utf8'))), before)
  await assert.rejects(readFile(join(directory, 'posts/bad.html')), /ENOENT/)
  const dev = await buildPosts({ directory, dev: true })
  assert.deepEqual(dev.posts.map(item => item.slug), ['root'])
  assert.deepEqual(dev.fragments, [])
  assert(dev.diagnostics.some(item => item.code === 'unsupported-fragment-parent'))
  const registry = JSON.parse(await readFile(join(directory, 'registry.json'), 'utf8'))
  assert.deepEqual(registry.map(item => item.id), ['post:root'])
})

test('unpublished ancestors never become published through children; valid draft trees preview only in development', async t => {
  const { directory, put } = await fixture(t)
  await put('draft', 'draft: true\n')
  await put('child', 'parent: post:draft\n')
  await put('descendant', 'parent: post:child\n')
  await assert.rejects(buildPosts({ directory }), /内容校验失败/)
  assert.equal((await buildPosts({ directory, dev: true })).posts.length, 3)
  await writeFile(join(directory, 'posts/draft.md'), '---\ntitle: draft\ndate: "2999-01-01"\ndescription: 未来\n---\n正文')
  const dev = await buildPosts({ directory, dev: true })
  assert.equal(dev.posts.length, 0)
  assert(dev.diagnostics.some(item => item.code === 'unpublished-post-parent'))
})

test('classification and series consumers exclude children even before metadata normalization; child order is stable', () => {
  const posts = [
    { id: 'post:root', kind: 'post', slug: 'root', category: 'Tech', tags: ['根'], series: '系列', date: '2020-01-01' },
    { id: 'post:z', kind: 'post', slug: 'z', parentId: 'post:root', category: 'Tech', tags: ['子'], series: '系列', date: '2020-01-02' },
    { id: 'post:a', kind: 'post', slug: 'a', parentId: 'post:root', date: '2020-01-02' },
  ]
  assert.deepEqual(sortSeries(posts, '系列').map(item => item.slug), ['root'])
  assert.deepEqual(buildTaxonomy(posts).tags.map(item => item.name), ['根'])
  assert.equal(buildTaxonomy(posts).series[0].count, 1)
  assert.deepEqual(directChildPosts(posts, 'post:root').map(item => item.slug), ['a', 'z'])
})
