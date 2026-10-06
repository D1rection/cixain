import test from 'node:test'
import assert from 'node:assert/strict'
import { compileMD } from '../../scripts/build-posts.js'

test('mathtext keeps prose separate from inline and display math without callout chrome', async () => {
  const { html } = await compileMD(String.raw`> [!mathtext]
>
> Assume **at some point**, $\theta$ can be represented as [a combination](https://example.com).
>
> $$\theta = \sum_{i=1}^n \beta_i \varphi(x^{(i)})$$`)
  assert.match(html, /<blockquote data-mathtext="">/)
  assert(!html.includes('[!mathtext]'))
  assert(!html.includes('data-callout'))
  assert(!html.includes('callout-title'))
  assert.match(html, /<strong><span class="math-text">at some point<\/span><\/strong>/)
  assert.match(html, /<a href="https:\/\/example.com"><span class="math-text">a combination<\/span><\/a>/)
  assert.match(html, /<span class="math-text">, <\/span><span class="katex">/)
  assert.match(html, /<span class="katex-display">/)
  assert.match(html, /<annotation encoding="application\/x-tex">\\theta<\/annotation>/)
})

test('mathtext handles same-line and next-line prose without consuming body content', async () => {
  for (const source of ['> [!mathtext] Start $x$ here.', '> [!MATHTEXT]\n> Start $x$ here.']) {
    const { html } = await compileMD(source)
    assert.match(html, /<p><span class="math-text">Start <\/span><span class="katex">/)
    assert.match(html, /<span class="math-text"> here\.<\/span><\/p>/)
    assert(!html.includes('<br>'))
  }
})

test('mathtext leaves code and nested unmarked quotes at their original typography', async () => {
  const { html } = await compileMD('> [!mathtext]\n>\n> Text `x + y` and $z$.\n>\n> > Nested $x$ text.\n>\n> ```text\n> code\n> ```')
  assert.match(html, /<code>x \+ y<\/code>/)
  assert(!html.includes('<code><span class="math-text">'))
  assert.match(html, /<blockquote>\n<p>Nested <span class="katex">/)
  assert.match(html, /class="shiki /)
  assert(!html.includes('<span class="math-text">code'))
})

test('normal blockquotes and existing callouts do not opt into mathtext', async () => {
  for (const source of ['> Plain $x$ text.', '> [!note] Title\n> Plain $x$ text.', '> [!fold] Title\n> Plain $x$ text.']) {
    const { html } = await compileMD(source)
    assert(!html.includes('math-text'))
    assert(!html.includes('data-mathtext'))
    assert.match(html, /class="katex"/)
  }
})

test('mathtext keeps suffix and standalone block anchors on their semantic blocks', async () => {
  const refs = []
  const defs = []
  const { html, anchors } = await compileMD(String.raw`> [!mathtext]
>
> Text $x$ here. ^prose
>
> $$x = y$$
>
> ^equation

[[#^prose]] and [[#^equation]]`, 'local', refs, defs)
  assert.match(html, /<p id="prose"><span class="math-text">Text /)
  assert.match(html, /<p id="equation"><span class="katex-display">/)
  assert(!html.includes('^prose'))
  assert(!html.includes('^equation'))
  assert(!/<span class="math-text" id=/.test(html))
  assert.deepEqual(defs, ['prose', 'equation'])
  assert(anchors.includes('prose') && anchors.includes('equation'))
  assert(refs.some(ref => ref.anchor === 'prose'))
  assert.match(html, /href="#equation"/)
})
