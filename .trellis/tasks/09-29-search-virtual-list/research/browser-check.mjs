// Run against vite dev; install Playwright in a separate directory and set PLAYWRIGHT_MODULE.
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const docs = Array.from({ length: 1000 }, (_, i) => ({
  id: `fixture:${String(i).padStart(4, '0')}`, slug: `fixture-${i}`, url: `/fixture-${i}/`,
  title: `测验 ${String(i).padStart(4, '0')} ${i % 3 === 0 ? '长标题用于验证窄屏下完整换行和测量'.repeat(3) : '短标题'}`,
  description: i % 4 ? '混合摘要用于检查两行截断，不同条目的高度不同。'.repeat(10) : '',
  tags: i % 5 ? [] : ['测验标签', '测验' + '很长的标签'.repeat(8)], sections: [],
}))
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5176'
const reports = []
async function setup(width, height, data = docs) {
  const page = await browser.newPage({ viewport: { width, height } })
  page.on('pageerror', error => { throw error })
  await page.route('**/search-index.json', route => route.fulfill({ json: { schemaVersion: 1, documents: data } }))
  await page.goto(base)
  if (width < 769) await page.getByRole('button', { name: '菜单', exact: true }).click()
  await page.getByRole('button', { name: '搜索', exact: true }).click()
  await page.getByRole('combobox').fill('测验')
  await page.waitForTimeout(200)
  return page
}
async function geometry(page) {
  return page.getByRole('listbox').evaluate(list => {
    const bounds = list.getBoundingClientRect()
    const rows = [...list.querySelectorAll('[role=option]')].map(node => ({
      index: Number(node.dataset.index), top: node.getBoundingClientRect().top, bottom: node.getBoundingClientRect().bottom,
    })).sort((a,b) => a.index - b.index)
    return { top: list.scrollTop, height: list.clientHeight, total: list.scrollHeight, count: rows.length,
      rows, visible: rows.filter(row => row.bottom > bounds.top && row.top < bounds.bottom), bounds: { top: bounds.top, bottom: bounds.bottom },
      activeExists: !!document.getElementById(document.querySelector('[role=combobox]').getAttribute('aria-activedescendant')) }
  })
}
function checkGeometry(g) {
  assert(g.count <= 40, `too many rows: ${g.count}`)
  assert(g.activeExists, 'active descendant missing')
  assert(g.visible.length, 'blank viewport')
  for (let i=1;i<g.rows.length;i++) if (g.rows[i].index === g.rows[i-1].index+1) {
    assert(Math.abs(g.rows[i].top-g.rows[i-1].bottom)<2, `overlap or gap ${JSON.stringify(g.rows.slice(i-1,i+1))}`)
  }
}
try {
  for (const [width,height] of [[1280,800],[390,844],[320,844]]) {
    const page = await setup(width,height)
    const input = page.getByRole('combobox'), list = page.getByRole('listbox')
    assert.equal(await page.getByText('共 1000 条结果').count(),1)
    assert.equal(await page.getByText('显示更多结果').count(),0)
    checkGeometry(await geometry(page))
    await page.screenshot({path:`/tmp/cixain-search-${width}.png`})
    for(let i=0;i<35;i++) await input.press('ArrowDown')
    await page.waitForTimeout(250)
    const active = page.locator('[role=option][aria-selected=true]')
    assert.equal(await active.getAttribute('aria-posinset'),'36')
    let g=await geometry(page); checkGeometry(g)
    assert(g.visible.some(row=>row.index===35),'keyboard target offscreen')
    const mid = await list.evaluate(el => el.scrollTop = el.scrollHeight * .5)
    await page.waitForTimeout(250)
    g=await geometry(page); checkGeometry(g)
    assert(g.top>mid-1000, 'wheel scroll pulled back to selection')
    const anchor=g.visible[0].index
    await page.setViewportSize({width:width===1280?390:1280,height})
    await page.waitForTimeout(300)
    g=await geometry(page);checkGeometry(g)
    assert(Math.abs(g.visible[0].index-anchor)<=2,`resize anchor moved ${anchor} -> ${g.visible[0].index}`)
    // Reflow a font, then emit the FontFaceSet completion event used by real font loading.
    await page.evaluate(()=>{document.querySelector('[role=listbox]').style.fontFamily='serif';document.fonts.dispatchEvent(new Event('loadingdone'))})
    await page.waitForTimeout(150); checkGeometry(await geometry(page))
    for(let i=0;i<3;i++){ await list.evaluate(el=>el.scrollTop=el.scrollHeight);await page.waitForTimeout(150) }
    g=await geometry(page);checkGeometry(g)
    assert(g.visible.some(row=>row.index===999),'last row inaccessible')
    assert.equal(await page.locator('[data-index="999"]').getAttribute('aria-setsize'),'1000')
    reports.push({width,height,domCount:g.count,lastIndex:g.visible.at(-1).index})
    await input.fill('找不到任何匹配的词语');assert.equal(await page.getByText('没有匹配结果').count(),1)
    await input.fill('测验');await page.waitForTimeout(100);assert.equal((await geometry(page)).top,0)
    assert.equal(await page.locator('[aria-selected=true]').getAttribute('aria-posinset'),'1')
    await input.dispatchEvent('compositionstart');await input.press('Enter');assert.equal(await page.getByRole('dialog').count(),1);await input.dispatchEvent('compositionend')
    await input.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-label')),'关闭搜索')
    await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('role')),'combobox')
    await input.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-label')),'关闭搜索')
    await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0)
    await page.setViewportSize({width:1280,height});await page.getByRole('button',{name:'搜索',exact:true}).click()
    assert.equal(await input.inputValue(),'');assert.equal(await page.getByText('输入关键词开始搜索').count(),1)
    await page.close()
  }
  for (const n of [0,1,10]) {
    const page=await setup(1280,800,docs.slice(0,n))
    if(n) {assert.equal(await page.getByText(`共 ${n} 条结果`).count(),1);checkGeometry(await geometry(page))}
    else assert.equal(await page.getByText('没有匹配结果').count(),1)
    reports.push({results:n,domCount:await page.getByRole('option').count()})
    await page.close()
  }
  const links=await setup(1280,800)
  await links.route('**/fixture-*/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>fixture</title>destination'}))
  // Headless Chrome here also fails to open tabs for a plain standalone anchor.
  // Verify event/default contracts; actual new-tab UI remains a manual check.
  await links.evaluate(() => {
    window.linkEvents=[]
    for(const type of ['click','auxclick']) document.getElementById('root').addEventListener(type,event=>{
      if(event.target.closest('[role=option]')) {
        window.linkEvents.push({type,prevented:event.defaultPrevented})
        event.preventDefault()
      }
    })
  })
  await links.getByRole('option').first().click({modifiers:['Meta']})
  // macOS Control-click opens a context menu, so exercise the cross-platform click contract directly.
  await links.getByRole('option').first().dispatchEvent('click', { ctrlKey: true, button: 0 })
  await links.getByRole('option').first().click({button:'middle'})
  assert.equal(await links.getByRole('dialog').count(),1)
  const events=await links.evaluate(()=>window.linkEvents)
  assert(events.length>=3)
  assert(events.every(event=>!event.prevented),'native modified link event was prevented')
  await links.getByRole('combobox').press('ArrowDown')
  const target=await links.locator('[aria-selected=true]').getAttribute('href')
  await links.getByRole('combobox').press('Enter')
  await links.waitForURL(base+target)
  await links.close()
  const click=await setup(1280,800)
  await click.route('**/fixture-*/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html>destination'}))
  const href=await click.getByRole('option').first().getAttribute('href')
  await click.getByRole('option').first().click()
  await click.waitForURL(base+href)
  await click.close()
  const zoom=await setup(1280,800)
  await zoom.evaluate(()=>{document.documentElement.style.zoom='2'})
  await zoom.waitForTimeout(300)
  checkGeometry(await geometry(zoom))
  await zoom.screenshot({path:'/tmp/cixain-search-zoom.png'})
  await zoom.close()
  const error=await browser.newPage()
  let attempts=0
  await error.route('**/search-index.json',route=>++attempts===1?route.fulfill({status:503,body:'unavailable'}):route.fulfill({json:{schemaVersion:1,documents:docs}}))
  await error.goto(base)
  await error.getByRole('button',{name:'搜索',exact:true}).click()
  await error.getByRole('button',{name:'重试',exact:true}).click()
  await error.getByRole('combobox').fill('测验')
  await error.getByText('共 1000 条结果').waitFor()
  await error.getByRole('combobox').press('Escape')
  assert.equal(await error.evaluate(()=>document.activeElement.getAttribute('aria-label')),'搜索')
  await error.close()
  reports.push({nativeLinks:'click/Enter navigation passed; modifier/middle default event contracts passed; actual new tabs not verified',retry:'passed',zoom:'CSS zoom 200% passed',focusRestore:'passed'})
  console.log(JSON.stringify(reports,null,2))
} finally { await browser.close() }
