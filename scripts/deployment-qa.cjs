const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = (process.env.QA_BASE_URL || 'http://127.0.0.1:4180/Omjay-Portfolio').replace(/\/$/, '');
const root = path.resolve(__dirname, '..');
const out = process.env.QA_OUTPUT || path.join(root, 'output/deployment-qa');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const executablePath = process.env.PLAYWRIGHT_BROWSER || ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
  const browser = await chromium.launch({ headless: true, executablePath });
  const results = [];
  try {
    for (const width of [320,375,768,1440]) {
      for (const js of [false,true]) {
        const context = await browser.newContext({ viewport: { width, height:900 }, javaScriptEnabled:js, reducedMotion:'reduce' });
        for (const route of ['', 'about/', 'contact/', 'privacy/', 'developers/', 'missing/deep/path']) {
          const page = await context.newPage();
          const errors=[];page.on('pageerror',e=>errors.push(e.message));
          const response = await page.goto(`${base}/${route}`,{waitUntil:'networkidle'});
          assert.equal(response.status(),route.startsWith('missing')?404:200,route);
          const info = await page.evaluate(() => ({
            title:document.title,h1:document.querySelectorAll('h1').length,
            text:document.body.innerText.length,
            overflow:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-innerWidth,
            links:[...document.querySelectorAll('a[href]')].map(a=>a.href),
            json:[...document.querySelectorAll('script[type="application/ld+json"]')].map(e=>JSON.parse(e.textContent)),
            small:[...document.querySelectorAll('nav a,footer a')].filter(a=>{const r=a.getBoundingClientRect();return getComputedStyle(a).display!=='inline' && r.width && r.height && (r.height<44 || r.width<24)}).map(a=>a.textContent)
          }));
          assert.equal(info.h1,1,`${route} H1`);assert.ok(info.text>250,`${route} text`);
          assert.ok(info.overflow<=2,`${route} overflow ${info.overflow}`);
          assert.deepEqual(errors,[],`${route} script errors`);
          if (width<=375) assert.deepEqual(info.small,[],`${route} small navigation`);
          for(const href of new Set(info.links)) {
            const u = new URL(href);
            if(u.origin===new URL(base).origin) assert.ok((await context.request.get(href)).ok(),`broken ${href}`);
          }
          if(route==='') {
            assert.ok(info.json.length,'JSON-LD missing');
            if(js) assert.ok(info.links.includes(`${base}/about/`),'runtime hides About');
          }
          if(width===320 || width===1440) await page.screenshot({path:path.join(out,`${route.replaceAll('/','-')||'home'}-${width}-${js?'js':'no-js'}.png`),fullPage:true});
          results.push({route,width,js,status:response.status(),...info});await page.close();
        }
        await context.close();
      }
    }
    // A broken bundle must leave useful content and navigation available.
    const context=await browser.newContext();
    const page=await context.newPage();
    await page.route('**/index.html',async route=>{
      const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('type="__bundler/manifest"','type="broken-manifest"');
      await route.fulfill({status:200,contentType:'text/html',body:html});
    });
    await page.goto(`${base}/index.html`);await page.waitForTimeout(500);
    assert.ok(await page.locator('#agent-fallback').isVisible(),'broken bundle hides fallback');
    await page.getByRole('link',{name:'About',exact:true}).click();assert.ok(page.url().endsWith('/about/'));
    await context.close();
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
    console.log(`PASS ${results.length} page/viewport/JavaScript combinations; local links, nested 404 recovery, JSON-LD, and broken-bundle recovery.`);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
