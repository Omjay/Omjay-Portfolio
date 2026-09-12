const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8').replace(/\r\n/g, '\n');
const strip = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z]+;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function testHomepage() {
  const html = read('index.html');
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/omjay\.github\.io\/Omjay-Portfolio\/">/);
  assert.match(html, /<meta property="og:type" content="website">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/omjay\.github\.io\/Omjay-Portfolio\/og-image\.png">/);
  assert.match(html, /<link rel="alternate" type="text\/markdown"[^>]+index\.md/);

  const fallback = html.match(/<div id="agent-fallback">([\s\S]*?)<div id="__bundler_thumbnail">/);
  assert.ok(fallback, 'raw HTML fallback is missing');
  assert.ok(strip(fallback[1]).length >= 500, 'raw HTML fallback must contain at least 500 characters');
  assert.equal((fallback[1].match(/<h1\b/g) || []).length, 1, 'fallback must contain one H1');
  assert.ok(!/<h[3-6]\b/.test(fallback[1]), 'fallback headings must not skip levels');
  assert.ok(!/\.js\s+#agent-fallback\s*\{\s*display:\s*none/.test(html), 'fallback must remain usable until the bundle renders');
  assert.ok(!html.includes('This page requires JavaScript to display.'), 'no-JavaScript content must not be labelled unavailable');
  assert.ok(fs.existsSync(path.join(root, '.nojekyll')), 'publish the Markdown resource without Jekyll processing');

  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.ok(jsonLdBlocks.length >= 1, 'homepage JSON-LD is missing');
  const graph = JSON.parse(jsonLdBlocks[0][1])['@graph'];
  assert.ok(graph.some((item) => item['@type'] === 'Person'));
  const organization = graph.find((item) => item['@type'] === 'Organization');
  assert.ok(organization?.contactPoint?.email, 'Organization contactPoint email is missing');
  assert.equal(organization?.address?.['@type'], 'PostalAddress');
}

function testCrawlerFiles() {
  const robots = read('robots.txt');
  for (const agent of ['ChatGPT-User', 'ClaudeBot', 'Google-Extended', 'DeepSeekBot', 'ora-agent']) {
    assert.ok(robots.includes(`User-agent: ${agent}\nAllow: /`), `robots.txt does not allow ${agent}`);
  }
  assert.match(robots, /Sitemap: https:\/\/omjay\.github\.io\/Omjay-Portfolio\/sitemap\.xml/);

  const llms = read('llms.txt');
  assert.match(llms, /## When to use this site/);
  assert.match(llms, /## How to use this site/);
  assert.match(llms, /github\.com\/Omjay\/Omjay-Portfolio/);
  assert.ok(read('index.md').length >= 500);
}

function testSitemapAndPages() {
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  const expected = ['/', '/toolkit.html', '/certifications.html', '/resume.html', '/about/', '/contact/', '/privacy/', '/developers/'];
  for (const suffix of expected) {
    assert.ok(sitemap.includes(`<loc>https://omjay.github.io/Omjay-Portfolio${suffix}</loc>`), `sitemap missing ${suffix}`);
  }

  for (const directory of ['about', 'contact', 'privacy']) {
    const html = read(`${directory}/index.html`);
    assert.ok(strip(html).length >= 500, `${directory} must contain at least 500 characters`);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, `${directory} must contain one H1`);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://omjay.github.io/Omjay-Portfolio/${directory}/">`));
  }
  const developers = read('developers/index.html');
  assert.match(developers, /Omjay\/Omjay-Portfolio GitHub repository/);
  assert.match(developers, /GitHub Pages serves static files and does not perform request-time content negotiation/);
}

function testRecoveryAndImage() {
  const notFound = read('404.html');
  for (const target of ['sitemap.xml', 'llms.txt', 'index.md', 'developers/']) assert.ok(notFound.includes(target));
  for (const target of ['sitemap.xml', 'llms.txt', 'index.md', 'developers/']) assert.ok(notFound.includes(`href="/Omjay-Portfolio/${target}"`), `404 recovery link must be clickable: ${target}`);
  const png = fs.readFileSync(path.join(root, 'og-image.png'));
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
}

testHomepage();
testCrawlerFiles();
testSitemapAndPages();
testRecoveryAndImage();
console.log('Agent-readiness checks passed.');
