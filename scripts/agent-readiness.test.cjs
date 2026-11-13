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

  // The homepage is static HTML: its main content must be readable without JavaScript.
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/);
  assert.ok(main, 'homepage <main> is missing');
  assert.ok(strip(main[1]).length >= 500, 'homepage main content must contain at least 500 characters');
  assert.equal((html.match(/<h1\b/g) || []).length, 1, 'homepage must contain one H1');
  const levels = [...html.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
  levels.forEach((level, i) => assert.ok(i === 0 || level - levels[i - 1] <= 1, 'homepage headings must not skip levels'));
  assert.ok(!html.includes('This page requires JavaScript to display.'), 'no-JavaScript content must not be labelled unavailable');
  for (const slug of ['exaqube', 'azimuth-grc', 'planetspark']) {
    const page = read(`work/${slug}/index.html`);
    assert.match(page, new RegExp(`<link rel="canonical" href="https://omjay\\.github\\.io/Omjay-Portfolio/work/${slug}/">`));
    assert.equal((page.match(/<h1\b/g) || []).length, 1, `${slug} case page must contain one H1`);
    assert.ok(html.includes(`href="work/${slug}/"`), `homepage must link to the ${slug} case page`);
  }
  assert.ok(fs.existsSync(path.join(root, '.nojekyll')), 'publish the Markdown resource without Jekyll processing');

  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.ok(jsonLdBlocks.length >= 1, 'homepage JSON-LD is missing');
  const graph = JSON.parse(jsonLdBlocks[0][1])['@graph'];
  assert.ok(graph.some((item) => item['@type'] === 'Person'));
  const person = graph.find((item) => item['@type'] === 'Person');
  assert.equal(person?.email, 'mishra.omjay@gmail.com', 'Person email must be a plain address');
  assert.equal(person?.address?.['@type'], 'PostalAddress');
  assert.ok(!graph.some((item) => item['@type'] === 'Organization'), 'the site is a person, not an organization');
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
  const expected = ['/', '/toolkit.html', '/certifications.html', '/resume.html', '/about/', '/contact/', '/privacy/', '/developers/', '/work/exaqube/', '/work/azimuth-grc/', '/work/planetspark/'];
  for (const suffix of expected) {
    assert.ok(sitemap.includes(`<loc>https://omjay.github.io/Omjay-Portfolio${suffix}</loc>`), `sitemap missing ${suffix}`);
  }

  for (const directory of ['about', 'contact', 'privacy']) {
    const html = read(`${directory}/index.html`);
    assert.ok(strip(html).length >= 500, `${directory} must contain at least 500 characters`);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, `${directory} must contain one H1`);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://omjay.github.io/Omjay-Portfolio/${directory}/">`));
  }
  const pages = ['index.html', 'toolkit.html', 'certifications.html', 'resume.html', '404.html', 'about/index.html', 'contact/index.html', 'privacy/index.html', 'developers/index.html', 'work/exaqube/index.html', 'work/azimuth-grc/index.html', 'work/planetspark/index.html'];
  for (const page of pages) {
    const html = read(page);
    assert.ok(!html.includes('?v=20'), `${page} must not carry cache-busting query strings on links`);
    assert.ok(!/[—–]/.test(html), `${page} must not contain em or en dashes`);
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
