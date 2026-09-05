const fs = require('node:fs');
const path = require('node:path');

const playwrightModule = process.env.PLAYWRIGHT_MODULE || 'playwright';
let chromium;
try {
  ({ chromium } = require(playwrightModule));
} catch (error) {
  console.error(`Unable to load Playwright from ${playwrightModule}.`);
  console.error('Set PLAYWRIGHT_MODULE to the installed Playwright package path.');
  process.exit(2);
}

const baseUrl = (process.env.QA_BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const internalPageVersion = '20260904-3';
const configuredPages = ['index.html', 'toolkit.html', 'certifications.html', 'resume.html'];
const configuredViewports = [
  { name: 'mobile-320', width: 320, height: 720 },
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 900 },
  { name: 'desktop-1024', width: 1024, height: 900 },
  { name: 'desktop-1440', width: 1440, height: 1000 },
];
const pages = process.env.QA_PAGE
  ? configuredPages.filter((page) => page === process.env.QA_PAGE)
  : configuredPages;
const viewports = process.env.QA_VIEWPORT
  ? configuredViewports.filter((viewport) => viewport.name === process.env.QA_VIEWPORT)
  : configuredViewports;

const edgeCandidates = [
  process.env.PLAYWRIGHT_BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].filter(Boolean);

const executablePath = edgeCandidates.find((candidate) => fs.existsSync(candidate));

function printResult(result) {
  const status = result.failures.length ? 'FAIL' : 'PASS';
  console.log(`${status} ${result.page} ${result.viewport}`);
  for (const failure of result.failures) console.log(`  - ${failure}`);
}

async function inspect(page, pageName, viewport) {
  const errors = [];
  const badResponses = [];

  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()} ${message.location().url || ''}`.trim());
  });
  page.on('response', (response) => {
    if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
  });

  const response = await page.goto(`${baseUrl}/${pageName}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(250);

  const report = await page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
    };

    const accessibleName = (element) => {
      const labelledBy = element.getAttribute('aria-labelledby');
      if (labelledBy) {
        const label = labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' ').trim();
        if (label) return label;
      }
      return (
        element.getAttribute('aria-label') ||
        element.getAttribute('title') ||
        element.textContent ||
        element.querySelector('img')?.getAttribute('alt') ||
        ''
      ).trim();
    };

    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
    const duplicateIds = [...new Set(ids.filter((id, index) => id && ids.indexOf(id) !== index))];
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible).map((element) => ({
      level: Number(element.tagName.slice(1)),
      text: element.textContent.trim().replace(/\s+/g, ' '),
    }));
    const headingJumps = [];
    for (let index = 1; index < headings.length; index += 1) {
      if (headings[index].level > headings[index - 1].level + 1) {
        headingJumps.push(`${headings[index - 1].text} -> ${headings[index].text}`);
      }
    }

    const interactiveSelector = 'a[href],button,input,select,textarea,[role="button"],[role="link"],[role="menuitem"]';
    const unnamedInteractive = [...document.querySelectorAll(interactiveSelector)]
      .filter(visible)
      .filter((element) => !accessibleName(element))
      .map((element) => element.outerHTML.slice(0, 120));

    const unsafeBlankLinks = [...document.querySelectorAll('a[target="_blank"]')]
      .filter((element) => !(element.rel || '').split(/\s+/).includes('noopener'))
      .map((element) => element.href);

    const imagesWithoutAlt = [...document.images]
      .filter((image) => !image.hasAttribute('alt'))
      .map((image) => image.src);
    const brokenImages = [...document.images]
      .filter((image) => visible(image) && (!image.complete || image.naturalWidth === 0))
      .map((image) => image.src);

    const fragmentFailures = [...document.querySelectorAll('a[href^="#"]')]
      .map((anchor) => anchor.getAttribute('href'))
      .filter((href) => href && href !== '#' && !document.getElementById(decodeURIComponent(href.slice(1))));

    const smallTargets = innerWidth <= 600
      ? [...document.querySelectorAll(interactiveSelector)]
          .filter(visible)
          .filter((element) => getComputedStyle(element).display !== 'inline')
          .map((element) => ({ name: accessibleName(element), rect: element.getBoundingClientRect() }))
          .filter(({ rect }) => rect.width < 44 || rect.height < 44)
          .map(({ name, rect }) => `${name || '(unnamed)'} ${Math.round(rect.width)}x${Math.round(rect.height)}`)
      : [];

    const text = document.body.innerText;
    const unicodeDashes = (text.match(/[—–]/g) || []).length;
    const overflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth;

    const parseColor = (value) => {
      const parts = value.match(/[\d.]+/g)?.map(Number) || [];
      return parts.length >= 3 ? [parts[0], parts[1], parts[2], parts[3] ?? 1] : null;
    };
    const blend = (foreground, background) => {
      const alpha = foreground[3];
      return [
        foreground[0] * alpha + background[0] * (1 - alpha),
        foreground[1] * alpha + background[1] * (1 - alpha),
        foreground[2] * alpha + background[2] * (1 - alpha),
        1,
      ];
    };
    const luminance = (color) => {
      const channels = color.slice(0, 3).map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const contrast = (left, right) => {
      const first = luminance(left);
      const second = luminance(right);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    };
    const backgroundFor = (element) => {
      const chain = [];
      for (let current = element; current; current = current.parentElement) chain.push(current);
      let background = [255, 255, 255, 1];
      for (const current of chain.reverse()) {
        const style = getComputedStyle(current);
        const color = parseColor(style.backgroundColor);
        if (color && color[3] > 0) background = blend(color, background);
        if (style.backgroundImage !== 'none') {
          const gradientColors = (style.backgroundImage.match(/rgba?\([^)]+\)/g) || [])
            .map(parseColor)
            .filter(Boolean);
          if (gradientColors.length) {
            const average = gradientColors.reduce((total, sample) => [
              total[0] + sample[0], total[1] + sample[1], total[2] + sample[2], total[3] + sample[3],
            ], [0, 0, 0, 0]).map((value) => value / gradientColors.length);
            background = blend(average, background);
          }
        }
      }
      return background;
    };
    const contrastViolations = [];
    const seenContrastSamples = new Set();
    for (const element of document.querySelectorAll('body *')) {
      if (!visible(element) || element.closest('[aria-hidden="true"]') || element.closest('[aria-disabled="true"]')) continue;
      const directText = [...element.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent)
        .join(' ')
        .trim()
        .replace(/\s+/g, ' ');
      if (!directText) continue;
      const style = getComputedStyle(element);
      const foregroundRaw = parseColor(style.color);
      if (!foregroundRaw) continue;
      const background = backgroundFor(element);
      const foreground = blend(foregroundRaw, background);
      const ratio = contrast(foreground, background);
      const fontSize = Number.parseFloat(style.fontSize);
      const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
      const minimum = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700) ? 3 : 4.5;
      const key = `${directText}|${ratio.toFixed(2)}|${minimum}`;
      if (ratio + 0.01 < minimum && !seenContrastSamples.has(key)) {
        seenContrastSamples.add(key);
        contrastViolations.push(`${directText.slice(0, 70)} (${ratio.toFixed(2)}:1, needs ${minimum}:1)`);
      }
    }

    return {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content || '',
      canonical: document.querySelector('link[rel="canonical"]')?.href || '',
      lang: document.documentElement.lang,
      h1Count: document.querySelectorAll('h1').length,
      landmarks: {
        header: document.querySelectorAll('header').length,
        nav: document.querySelectorAll('nav, [role="navigation"]').length,
        main: document.querySelectorAll('main').length,
        footer: document.querySelectorAll('footer').length,
      },
      duplicateIds,
      headingJumps,
      unnamedInteractive,
      unsafeBlankLinks,
      imagesWithoutAlt,
      brokenImages,
      fragmentFailures,
      smallTargets,
      unicodeDashes,
      overflow,
      contrastViolations,
    };
  });

  const failures = [];
  if (!response || !response.ok()) failures.push(`document status ${response ? response.status() : 'missing'}`);
  if (!report.title) failures.push('missing title');
  if (!report.description) failures.push('missing meta description');
  if (!report.canonical) failures.push('missing canonical link');
  if (!report.lang) failures.push('missing document language');
  if (report.h1Count !== 1) failures.push(`expected one H1, found ${report.h1Count}`);
  if (report.landmarks.main !== 1) failures.push(`expected one main landmark, found ${report.landmarks.main}`);
  if (report.landmarks.header < 1) failures.push('missing header landmark');
  if (report.landmarks.nav < 1) failures.push('missing navigation landmark');
  if (pageName !== 'resume.html' && report.landmarks.footer < 1) failures.push('missing footer landmark');
  if (report.overflow > 2) failures.push(`horizontal overflow ${Math.round(report.overflow)}px`);
  if (report.duplicateIds.length) failures.push(`duplicate IDs: ${report.duplicateIds.join(', ')}`);
  if (report.headingJumps.length) failures.push(`heading level jumps: ${report.headingJumps.join('; ')}`);
  if (report.unnamedInteractive.length) failures.push(`${report.unnamedInteractive.length} unnamed interactive element(s)`);
  if (report.unsafeBlankLinks.length) failures.push(`${report.unsafeBlankLinks.length} target=_blank link(s) without noopener`);
  if (report.imagesWithoutAlt.length) failures.push(`${report.imagesWithoutAlt.length} image(s) without alt`);
  const brokenLocalImages = report.brokenImages.filter((url) => url.startsWith(baseUrl));
  if (brokenLocalImages.length) failures.push(`broken local images: ${brokenLocalImages.join(', ')}`);
  if (report.fragmentFailures.length) failures.push(`missing fragment targets: ${report.fragmentFailures.join(', ')}`);
  if (report.smallTargets.length) failures.push(`small mobile targets: ${report.smallTargets.join('; ')}`);
  if (report.unicodeDashes) failures.push(`${report.unicodeDashes} visible en/em dash character(s)`);
  if (report.contrastViolations.length) failures.push(`contrast: ${report.contrastViolations.join('; ')}`);
  for (const error of errors.filter((message) => !message.includes('ERR_NETWORK_ACCESS_DENIED'))) failures.push(error);
  for (const badResponse of badResponses) failures.push(`bad response: ${badResponse}`);

  return { page: pageName, viewport: viewport.name, failures, report };
}

async function reducedMotionCheck(browser, pageName) {
  const context = await browser.newContext({
    viewport: { width: 1024, height: 900 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/${pageName}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(250);
  const result = await page.evaluate(() => ({
    preference: matchMedia('(prefers-reduced-motion: reduce)').matches,
    activeAnimations: document.getAnimations().filter((animation) => animation.playState === 'running').length,
  }));
  await context.close();
  return result;
}

async function navigationCheck(browser) {
  const failures = [];
  const context = await browser.newContext({ viewport: { width: 1024, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'View PlanetSpark projects' }).click();
  if ((await page.getByText('Data Analytics Engineer', { exact: true }).count()) !== 1) {
    failures.push('PlanetSpark detail view does not use the verified Data Analytics Engineer title');
  }
  if (await page.getByText('Data Analyst', { exact: true }).count()) {
    failures.push('PlanetSpark detail view still exposes the inconsistent Data Analyst title');
  }

  await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
  const menuButton = page.getByRole('button', { name: 'Menu' });
  await menuButton.click();
  const menu = page.getByRole('menu');
  const menuText = (await menu.innerText()).replace(/\s+/g, ' ').trim();
  if (menuText.includes('MIND-MAP')) failures.push('homepage menu still uses MIND-MAP');
  if (menuText.includes('RESUME')) failures.push('homepage menu duplicates the persistent Resume link');
  for (const expected of ['TOOLKIT', 'CERTIFICATIONS', 'LINKEDIN', 'BLOGS', 'PERSONALITY']) {
    if (!menuText.includes(expected)) failures.push(`homepage menu is missing ${expected}`);
  }
  if ((menuText.match(/SOON/g) || []).length !== 2) failures.push('homepage menu should show two SOON placeholders');
  const disabledItems = menu.locator('[role="menuitem"][aria-disabled="true"]');
  if ((await disabledItems.count()) !== 2) failures.push('homepage menu should expose two disabled placeholder items');

  await page.keyboard.press('Escape');
  if ((await menuButton.getAttribute('aria-expanded')) !== 'false') failures.push('Escape did not close homepage menu');

  // Reproduce the reported path exactly: Portfolio menu -> Certifications -> Toolkit.
  await menuButton.click();
  const certificationsMenuItem = page.getByRole('menuitem', { name: 'CERTIFICATIONS' });
  const certificationsMenuUrl = new URL(await certificationsMenuItem.getAttribute('href'), `${baseUrl}/index.html`);
  if (certificationsMenuUrl.searchParams.get('v') !== internalPageVersion) {
    failures.push('homepage Certifications menu link is missing the cache-safe page version');
  }
  await certificationsMenuItem.click();
  await page.waitForURL('**/certifications.html*');
  if (new URL(page.url()).searchParams.get('v') !== internalPageVersion) {
    failures.push('homepage menu did not open the versioned Certifications page');
  }

  const certificationsToolkitLink = page.getByRole('link', { name: 'TOOLKIT', exact: true });
  const certificationsToolkitUrl = new URL(await certificationsToolkitLink.getAttribute('href'), page.url());
  if (certificationsToolkitUrl.searchParams.get('v') !== internalPageVersion) {
    failures.push('Certifications Toolkit link is missing the cache-safe page version');
  }
  await certificationsToolkitLink.click();
  await page.waitForURL('**/toolkit.html*');
  if (new URL(page.url()).searchParams.get('v') !== internalPageVersion) {
    failures.push('Certifications did not open the versioned Toolkit page');
  }
  if ((await page.getByRole('heading', { name: 'How the stack fits together', exact: true }).count()) !== 1) {
    failures.push('Portfolio -> Certifications -> Toolkit opened a legacy page instead of the current Toolkit');
  }
  const toolkitNavOrder = await page.locator('.site-nav a').allInnerTexts();
  if (toolkitNavOrder.join('|') !== 'Portfolio|Toolkit|Certifications|Resume') {
    failures.push('Toolkit header navigation order is inconsistent');
  }

  const languageCard = page.getByRole('heading', { name: 'Languages and query', exact: true }).locator('..');
  const languageTags = await languageCard.locator('li').allInnerTexts();
  for (const expected of ['Python', 'SQL', 'SQL Server', 'Hive', 'Bash', 'Scala']) {
    if (!languageTags.some((tag) => tag.includes(expected))) failures.push(`toolkit Languages and query card is missing ${expected}`);
  }
  if ((await page.getByRole('heading', { name: 'The stack at a glance', exact: true }).count()) !== 0) {
    failures.push('toolkit still contains the duplicate Engineering map');
  }
  const capabilityStatuses = (await page.locator('.capability-status').allTextContents()).map((status) => status.trim());
  for (const expected of ['Core · daily', 'Strong', 'Core', 'Daily', 'Delivery', 'Applied']) {
    if (!capabilityStatuses.includes(expected)) failures.push(`toolkit capability map is missing the ${expected} status`);
  }
  if ((await page.locator('.capability-logo').count()) !== 6) {
    failures.push('toolkit capability map should contain six platform/category symbols');
  }
  const binaryField = await page.locator('.stack-core').evaluate((element) => getComputedStyle(element, '::after').content);
  if (!binaryField.includes('01001101')) {
    failures.push('toolkit stack foundation is missing its binary data texture');
  }

  const stackBounds = await page.locator('.stack-core').boundingBox();
  const platformBounds = await page.locator('.capability-card--platform').boundingBox();
  if (!stackBounds || !platformBounds) {
    failures.push('toolkit capability hierarchy is missing its stack or platform card');
  } else {
    if (Math.abs(stackBounds.width - platformBounds.width) > 2) {
      failures.push('toolkit stack foundation and Databricks platform card are not equally full width');
    }
    if (platformBounds.y < stackBounds.y + stackBounds.height) {
      failures.push('toolkit Databricks platform card is not positioned below the stack foundation');
    }
  }

  const workVerifiedItems = [
    'databricks', 'delta-lake', 'azure', 'sql-server',
    'pyspark', 'python', 'sql', 'scala', 'hive',
    'power-bi', 'tableau', 'apps-script', 'google-sheets', 'excel',
    'docker', 'ubuntu', 'git', 'azure-devops', 'bash',
  ];
  for (const itemName of workVerifiedItems) {
    const item = page.locator(`[data-verification-item="${itemName}"]`);
    if ((await item.count()) !== 1) failures.push(`toolkit verification target is missing: ${itemName}`);
    const ownWorkBadge = item.locator(':scope > .verification-badge[aria-label="WORK VERIFIED"], :scope > .capability-title .verification-badge[aria-label="WORK VERIFIED"]');
    if ((await ownWorkBadge.count()) !== 1) {
      failures.push(`toolkit ${itemName} is missing its WORK VERIFIED badge`);
    }
  }

  const providerVerifiedItems = [
    ['databricks', 'DATABRICKS CERTIFIED'],
    ['delta-lake', 'DATABRICKS CERTIFIED'],
    ['azure', 'MICROSOFT AZURE CERTIFIED'],
  ];
  for (const [itemName, certificationName] of providerVerifiedItems) {
    const badge = page.locator(`[data-verification-item="${itemName}"] > .capability-title .verification-badge--certified[aria-label="${certificationName}"]`);
    if ((await badge.count()) !== 1) failures.push(`toolkit ${itemName} is missing its ${certificationName} badge`);
  }
  if ((await page.locator('.verification-badge[aria-label="WORK VERIFIED"]').count()) !== workVerifiedItems.length) {
    failures.push(`toolkit should show exactly ${workVerifiedItems.length} WORK VERIFIED badges`);
  }
  if ((await page.locator('.verification-badge--certified').count()) !== providerVerifiedItems.length) {
    failures.push(`toolkit should show exactly ${providerVerifiedItems.length} provider certification badges`);
  }

  const badgeColors = await page.evaluate(() => ({
    certified: getComputedStyle(document.querySelector('.verification-badge--certified')).color,
    work: getComputedStyle(document.querySelector('.verification-badge[aria-label="WORK VERIFIED"]')).color,
  }));
  if (badgeColors.certified !== 'rgb(233, 161, 21)') failures.push('provider certification badges do not use the original Git gold');
  if (badgeColors.work !== 'rgb(0, 120, 212)') failures.push('WORK VERIFIED badges do not use the original Git blue');

  const originalBadgePath = 'M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z';
  const renderedBadgePath = await page.locator('#verification-badge-mark path').first().getAttribute('d');
  if (renderedBadgePath !== originalBadgePath) failures.push('toolkit badge shape no longer matches the original Git implementation');
  const badgeUseTarget = await page.locator('.verification-badge use').first().getAttribute('href');
  if (badgeUseTarget !== '#verification-badge-mark') failures.push('toolkit badges are not using the restored shared verification symbol');

  const workBadge = page.locator('[data-verification-item="apps-script"] .verification-badge[aria-label="WORK VERIFIED"]');
  const workTooltip = workBadge.locator('.verification-badge__tooltip');
  await workBadge.hover();
  await page.waitForTimeout(200);
  if ((await workTooltip.innerText()).trim() !== 'WORK VERIFIED') failures.push('WORK VERIFIED badge tooltip has the wrong label');
  if ((await workTooltip.evaluate((element) => getComputedStyle(element).opacity)) !== '1') {
    failures.push('WORK VERIFIED badge tooltip does not appear on hover');
  }
  await page.mouse.move(0, 0);
  await workBadge.focus();
  await page.waitForTimeout(200);
  if ((await workTooltip.evaluate((element) => getComputedStyle(element).opacity)) !== '1') {
    failures.push('WORK VERIFIED badge tooltip does not appear on keyboard focus');
  }

  await page.getByRole('link', { name: 'Certifications', exact: true }).click();
  await page.waitForURL('**/certifications.html*');
  if (new URL(page.url()).searchParams.get('v') !== internalPageVersion) {
    failures.push('Toolkit did not return to the versioned Certifications page');
  }

  const certificationNavOrder = await page.locator('.header-nav a').allInnerTexts();
  if (certificationNavOrder.join('|') !== 'PORTFOLIO|TOOLKIT|CERTIFICATIONS|RESUME') {
    failures.push('Certifications header navigation order is inconsistent');
  }
  await page.setViewportSize({ width: 320, height: 720 });
  for (const navigationLabel of certificationNavOrder) {
    if (!(await page.getByRole('link', { name: navigationLabel, exact: true }).isVisible())) {
      failures.push(`Certifications mobile header hides ${navigationLabel}`);
    }
  }
  await page.setViewportSize({ width: 1024, height: 900 });
  const udemyCourseIcons = [
    ['udemy-sql', 'SQL course', 'file-type-sql.svg'],
    ['udemy-excel', 'Microsoft Excel course', 'file-type-excel.svg'],
  ];
  for (const [courseName, topicLabel, topicIcon] of udemyCourseIcons) {
    const course = page.locator(`[data-course="${courseName}"]`);
    const providerIcon = course.locator('.course-provider-logo');
    if ((await providerIcon.count()) !== 1 || !(await providerIcon.getAttribute('src')).includes('simple-icons:udemy.svg')) {
      failures.push(`${courseName} is missing the Udemy provider symbol`);
    }
    const topic = course.getByRole('img', { name: topicLabel, exact: true });
    if ((await topic.count()) !== 1 || !(await topic.locator('img').getAttribute('src')).includes(topicIcon)) {
      failures.push(`${courseName} is missing its technology symbol beside Udemy`);
    }
  }

  await page.getByRole('link', { name: 'RESUME', exact: true }).click();
  await page.waitForURL('**/resume.html');

  await page.getByRole('link', { name: '← Portfolio', exact: true }).click();
  await page.waitForURL('**/index.html');

  const localLinks = new Set();
  for (const pageName of pages) {
    await page.goto(`${baseUrl}/${pageName}`, { waitUntil: 'networkidle' });
    const hrefs = await page.locator('a[href]').evaluateAll((anchors) => anchors.map((anchor) => anchor.href));
    for (const href of hrefs) {
      const url = new URL(href);
      if (url.origin === baseUrl && /^https?:$/.test(url.protocol)) {
        url.hash = '';
        localLinks.add(url.href);
      }
    }
  }

  for (const href of localLinks) {
    const linkedResponse = await context.request.get(href);
    if (!linkedResponse.ok()) failures.push(`local link returned ${linkedResponse.status()}: ${href}`);
  }

  const pdfResponse = await context.request.get(`${baseUrl}/Om%27s%20Resume.pdf`);
  if (!pdfResponse.ok()) failures.push(`resume PDF returned ${pdfResponse.status()}`);
  if (!pdfResponse.headers()['content-type']?.includes('application/pdf')) failures.push('resume PDF content type is not application/pdf');

  await context.close();
  return failures;
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath });
  const results = [];

  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    for (const pageName of pages) {
      const page = await context.newPage();
      const result = await inspect(page, pageName, viewport);
      results.push(result);
      printResult(result);
      await page.close();
    }
    await context.close();
  }

  if (!process.env.QA_SKIP_REDUCED_MOTION) {
    for (const pageName of pages) {
      const reduced = await reducedMotionCheck(browser, pageName);
      const failures = [];
      if (!reduced.preference) failures.push('reduced-motion preference was not applied');
      if (reduced.activeAnimations) failures.push(`${reduced.activeAnimations} animation(s) still running`);
      const result = { page: pageName, viewport: 'reduced-motion', failures, report: reduced };
      results.push(result);
      printResult(result);
    }
  }

  if (!process.env.QA_SKIP_NAVIGATION) {
    const failures = await navigationCheck(browser);
    const result = { page: 'cross-page-navigation', viewport: 'desktop-1024', failures, report: {} };
    results.push(result);
    printResult(result);
  }

  await browser.close();

  const failureCount = results.reduce((count, result) => count + result.failures.length, 0);
  console.log(`\n${results.length} checks, ${failureCount} finding(s).`);
  process.exitCode = failureCount ? 1 : 0;
})().catch((error) => {
  console.error(error);
  process.exit(2);
});
