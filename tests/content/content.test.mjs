import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import matter from 'gray-matter'
import { parseWikiTarget, wikiLinkLabel } from '../../src/utils/contentLinks.js'
import { fragmentDate, fragmentFrontmatter } from '../../scripts/lib/fragment-frontmatter.js'
import { compileMD, buildPosts } from '../../scripts/build-posts.js'

const current = { kind: 'fragment', slug: 'same' }
const registry = new Map([
  ['post:same', { title: '文章标题' }], ['fragment:same', { title: '碎片标题' }],
])

test('explicit and bare links agree across rendered content and search labels', async () => {
  for (const [raw, targetId, title, href] of [
    ['same', 'post:same', '文章标题', '/blog/same/'],
    ['posts/same', 'post:same', '文章标题', '/blog/same/'],
    ['post/same', 'post:same', '文章标题', '/blog/same/'],
    ['fragment/same', 'fragment:same', '碎片标题', '/fragment/same/'],
  ]) {
    for (const kind of ['post', 'fragment']) {
      const from = { kind, slug: 'same' }
      assert.equal(parseWikiTarget(raw, from).targetId, targetId)
      assert.equal(wikiLinkLabel({ value: raw }, from, registry), title)
      const refs = []
      const { html } = await compileMD(`[[${raw}]]`, from.slug, refs, [], new Map(), { kind, registry })
      assert(html.includes(`href="${href}"`))
      assert(html.includes(`>${title}</a>`))
      assert(refs.some(ref => ref.targetId === targetId && ref.position?.line === 1))
    }
  }
  const { html } = await compileMD('[[fragment/same|其数据格式]]', 'from', [], [], new Map(), { registry })
  assert(html.includes('>其数据格式</a>'))
  assert.equal(wikiLinkLabel({ value: 'fragment/same', alias: '其数据格式' }, current, registry), '其数据格式')
})

test('same-document anchors and encoded names remain unambiguous', () => {
  for (const raw of ['#^block', '^block']) {
    assert.deepEqual(parseWikiTarget(raw, current), { kind: 'fragment', slug: 'same', anchor: 'block', blockRef: true, sameDocument: true, targetId: 'fragment:same' })
  }
  assert.equal(parseWikiTarget('#标题', current).anchor, '标题')
  assert.equal(parseWikiTarget('#id', {kind:'fragment',slug:'a%20b'}).slug, 'a%20b')
  assert.equal(parseWikiTarget('fragment/%E4%B8%AD%E6%96%87#%E6%A0%87%E9%A2%98', current).slug, '中文')
  assert.equal(parseWikiTarget('fragment/a%2520b', current).slug, 'a%20b')
  for (const raw of ['', 'fragment/', 'fragment/a%2Fb', 'fragment/%ZZ', '#^']) assert(parseWikiTarget(raw, current).error)
  assert.equal(wikiLinkLabel({value:'fragment/missing'}, current, new Map([['post:missing',{title:'错误标题'}]])), 'missing')
})

test('fragment calendar dates and draft types are strictly checked', () => {
  assert.equal(fragmentDate('2024-02-29', 'f.md', 'date'), '2024-02-29')
  assert.equal(fragmentDate(new Date('2024-02-29'), 'f.md', 'date'), '2024-02-29')
  for (const date of ['2023-02-29','2026-02-30','2026-13-01','{{date}}','2026-01-01T00:00:00Z',1]) {
    assert.throws(() => fragmentDate(date,'f.md','date'), /f.md: date/)
  }
  assert.throws(() => fragmentFrontmatter({ title:'x',date:'2026-01-02',updated:'2026-01-01' },{file:'f.md'}), /updated/)
  assert.throws(() => fragmentFrontmatter({ draft:'false' },{file:'f.md'}), /draft/)
  assert.equal(fragmentFrontmatter({draft:true},{file:'f.md'}).state,'draft')
  assert.equal(fragmentFrontmatter({draft:true},{file:'f.md',dev:true}).state,'incomplete-draft')
  assert.equal(fragmentFrontmatter({title:'x',date:'2026-09-29'},{file:'f.md',now:new Date('2026-09-28T16:00:00Z')}).state,'visible')
  const invalid = matter('---\ntitle: x\ndate: 2026-02-30\n---\n')
  assert.throws(() => fragmentFrontmatter(invalid.data,{file:'f.md',matter:invalid.matter}), /有效日历/)
})

test('date-only values normalize identically across time zones', () => {
  const module = new URL('../../scripts/lib/fragment-frontmatter.js', import.meta.url).href
  const code = `import { fragmentDate } from ${JSON.stringify(module)};console.log(fragmentDate(new Date('2024-02-29'),'f','date'))`
  for(const TZ of ['UTC','Asia/Shanghai','America/Los_Angeles']) {
    assert.equal(execFileSync(process.execPath,['--input-type=module','-e',code],{env:{...process.env,TZ},encoding:'utf8'}).trim(),'2024-02-29')
  }
})

async function fixture(t) {
  const directory=await mkdtemp(join(tmpdir(),'cixain-content-test-'))
  t.after(()=>rm(directory,{recursive:true,force:true}))
  for(const dir of ['posts','fragment','pages']) await mkdir(join(directory,dir))
  const put=(dir,name,body,fields='')=>writeFile(join(directory,dir,`${name}.md`),`---\ntitle: ${name}\ndate: 2020-01-01\ndescription: description\n${fields}---\n${body}`)
  return { directory,put }
}

test('production validates all sources before writes; dev warns and previews drafts', async t => {
  const {directory,put}=await fixture(t)
  await put('posts','article','[[fragment/note#^block]]')
  await put('fragment','note','正文 ^block\n\n[[posts/article]]\n\n## 标题\n\n[[#标题]]')
  await put('fragment','draft','秘密','draft: true\n')
  await writeFile(join(directory,'fragment/future.md'),'---\ntitle: future\ndate: 2999-01-01\n---\n未来')
  await put('pages','about','[阅读](/fragment/note/#block)')
  const first=await buildPosts({directory})
  assert.deepEqual(first.fragments.map(x=>x.slug),['note'])
  assert.equal(first.fragments[0].date,'2020-01-01')
  assert.equal(first.fragments[0].backlinks[0].id,'post:article')
  const original=await readFile(join(directory,'posts/article.html'),'utf8')
  await put('posts','article','[[fragment/draft]]\n\n[缺失](/fragment/missing/)\n\n[[fragment/future]]\n\n[[fragment/note#absent]]')
  await assert.rejects(buildPosts({directory}),/内容校验失败/)
  assert.equal(await readFile(join(directory,'posts/article.html'),'utf8'),original)
  const dev=await buildPosts({directory,dev:true})
  assert(dev.fragments.some(x=>x.slug==='draft'))
  assert(dev.diagnostics.some(x=>x.code==='missing-target'))
  assert(dev.diagnostics.some(x=>x.code==='missing-anchor'))
  assert(dev.diagnostics.some(x=>x.code==='unpublished-target' && x.reason.includes('future')))
})

test('missing block, duplicate IDs, and page-local anchors fail the publish gate',async t=>{
  const {directory,put}=await fixture(t)
  await put('fragment','note','第一段 ^dup\n\n第二段 ^dup\n\n[[#^missing]]')
  await put('pages','about','[失效](#missing)')
  const result=await buildPosts({directory,dev:true})
  for(const code of ['duplicate-block','missing-block','missing-anchor']) assert(result.diagnostics.some(x=>x.code===code))
  await assert.rejects(buildPosts({directory}),/内容校验失败/)
})

test('template starts unpublished and contains no rendered tutorial',async()=>{
  const template=await readFile(new URL('../../Templates/new-fragment.md',import.meta.url),'utf8')
  const parsed=matter(template.replace('{{date}}','2026-09-29'))
  assert.equal(parsed.data.draft,true)
  const {html}=await compileMD(parsed.content)
  assert.equal(html.trim(),'')
})
