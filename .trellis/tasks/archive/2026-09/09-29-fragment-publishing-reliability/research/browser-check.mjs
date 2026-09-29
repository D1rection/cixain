// Install Playwright outside the repository; TEST_BASE_URL selects a running Vite fixture copy.
import assert from 'node:assert/strict'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base=process.env.TEST_BASE_URL || 'http://127.0.0.1:5178/notes'
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
const page=await browser.newPage({viewport:{width:390,height:844}})
const errors=[]
page.on('pageerror',e=>errors.push(e.message))
let mode='404', pending, requests=[]
await page.route('**/*',async route=>{
 const request=route.request()
 if(request.isNavigationRequest() && request.resourceType()==='document') {
   return route.fulfill({response:await route.fetch({url:`${base}/fragment-fixture.html`})})
 }
 if(request.url().includes('/content/fragment/')) {
   requests.push(request.url())
   if(mode==='slow') {pending=route;return}
   if(mode==='404') return route.fulfill({status:404,contentType:'text/html',body:'missing'})
   if(mode==='fallback') return route.fulfill({contentType:'text/html',body:'<!doctype html><html><body>wrong app fallback</body></html>'})
   if(mode==='network') return route.abort('failed')
   const name=request.url().includes('/b.html')?'B':'A'
   return route.fulfill({contentType:'text/html',body:`<p>${name} 正文</p><div style="height:1200px"></div><h2 id="中文标题">中文标题</h2><p>结束</p>`})
 }
 return route.continue()
})
async function navigate(slug){await page.evaluate(path=>{history.pushState({},'',path);dispatchEvent(new PopStateEvent('popstate'))},`${new URL(base).pathname.replace(/\/$/,'')}/fragment/${slug}`)}
try {
 await page.goto(`${base}/fragment/a`)
 await page.getByRole('alert').waitFor()
 assert.equal(await page.getByText('wrong app fallback').count(),0)
 mode='fallback';await page.getByRole('button',{name:'重试'}).click();await page.getByRole('alert').waitFor()
 mode='network';await page.getByRole('button',{name:'重试'}).click();await page.getByRole('alert').waitFor()
 mode='slow';await page.getByRole('button',{name:'重试'}).click();await page.getByText('正在加载内容…').waitFor()
 await page.waitForTimeout(80);assert(pending)
 mode='ok';await navigate('b')
 await page.getByText('B 正文').waitFor()
 await pending.fulfill({contentType:'text/html',body:'<p>过期的 A 正文</p>'}).catch(()=>{})
 await page.waitForTimeout(100)
 assert.equal(await page.getByText('过期的 A 正文').count(),0)
 mode='slow';pending=null;await navigate('a')
 await page.getByText('正在加载内容…').waitFor();assert.equal(await page.getByText('B 正文').count(),0)
 await page.waitForTimeout(80);mode='ok'
 await pending.fulfill({contentType:'text/html',body:'<p>A 正文</p><div style="height:1200px"></div><h2 id="中文标题">中文标题</h2>'})
 await page.getByText('A 正文').waitFor()
 await page.evaluate(()=>{location.hash=encodeURIComponent('中文标题')})
 await page.waitForTimeout(900)
 assert(await page.locator('#中文标题').evaluate(el=>el.getBoundingClientRect().top<innerHeight),'Chinese hash was not located')
 await navigate('missing');await page.getByRole('heading',{name:'碎片未找到'}).waitFor()
 assert.equal(await page.getByText('slug: missing').count(),0)
 const before=requests.length
 await navigate('inline');await page.getByText('内联正文').waitFor()
 assert.equal(requests.length,before,'SSG inline body fetched again')
 assert(requests.every(url=>url.startsWith(`${base}/content/fragment/`)))
 assert.deepEqual(errors,[])
 console.log(JSON.stringify({base,requests:requests.length,checks:'404, network failure, 200 fallback, retry, loading, stale response, route reset, Chinese anchor, missing metadata, inline no-fetch, base path passed'}))
} finally {await browser.close()}
