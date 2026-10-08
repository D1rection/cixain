import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { compileMD } from '../../scripts/build-posts.js'
import useHeadingAnchors from '../../src/hooks/useHeadingAnchors.js'

function renderToc(html) {
  let result
  function Probe() {
    result = useHeadingAnchors(html)
    return createElement('nav', null, result.toc.map(item =>
      createElement('a', { key: item.id, href: `#${item.id}` }, item.text)))
  }
  const markup = renderToStaticMarkup(createElement(Probe))
  return { ...result, markup }
}

test('the reported CS229 heading decodes in SSR without changing its compiled anchor', async () => {
  const source = readFileSync(new URL('../../content/posts/2026-10-09-001.md', import.meta.url), 'utf8')
    .split('\n').find(line => line.startsWith('### 4.2 Necessary conditions'))
  assert(source)
  const { html } = await compileMD(source)
  const { toc, markup } = renderToc(html)
  assert.deepEqual(toc, [{
    id: '42-necessary-conditions-amp-sucient-conditions',
    text: '4.2 Necessary conditions & Suﬃcient conditions',
    level: 3,
  }])
  assert.match(markup, />4\.2 Necessary conditions &amp; Suﬃcient conditions<\/a>/)
  assert(!markup.includes('&amp;#x26;'))
})

test('TOC text handles numeric and named entities, Unicode and invalid references', () => {
  const html = '<h2 id="symbols"> &#x26; &#38; &amp; &lt; &gt; &quot; &apos; a&nbsp;b &copy; &#x1F600; &#x110000; &unknown; </h2>'
  const { toc } = renderToc(html)
  assert.equal(toc[0].text, '& & & < > " \' a\u00a0b © 😀 \uFFFD &unknown;')
})

test('TOC text decodes once and preserves escaped tags as inert text', () => {
  const { toc, markup } = renderToc('<h2 id="literal"><strong>Literal</strong> <code>&amp;#x26;</code> &lt;img src=x onerror=alert(1)&gt;</h2>')
  assert.equal(toc[0].text, 'Literal &#x26; <img src=x onerror=alert(1)>')
  assert.match(markup, /Literal &amp;#x26; &lt;img src=x onerror=alert\(1\)&gt;/)
  assert(!markup.includes('<img'))
})

test('legacy fallback IDs, duplicate numbering, explicit IDs and hierarchy remain unchanged', () => {
  const { toc } = renderToc('<h2>A &#x26; B</h2><h3>A &#x26; B</h3><h4 id="fixed">A &amp; B</h4>')
  assert.deepEqual(toc, [
    { id: 'a-x26-b', text: 'A & B', level: 2 },
    { id: 'a-x26-b-1', text: 'A & B', level: 3 },
    { id: 'fixed', text: 'A & B', level: 4 },
  ])
})

test('empty input, formatted headings, block IDs, folds and math keep their existing behavior', async () => {
  assert.deepEqual(renderToc('').toc, [])
  const { html } = await compileMD('> [!fold] Problem\n> ## Hidden & Heading\n> text\n\n## **Code** and [`Link`](https://example.com) & text ^fixed\n\n## Formula $x$')
  const { toc } = renderToc(html)
  assert.equal(toc.length, 2)
  assert.deepEqual(toc[0], { id: 'fixed', text: 'Code and Link & text', level: 2 })
  assert.equal(toc[1].id, 'formula-xxx')
})
