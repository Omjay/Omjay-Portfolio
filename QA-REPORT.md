# Portfolio QA report

Date: 2026-11-02
Scope: the redesign branch, served locally as static files
Status: passed, with the gaps listed at the end

## What this release contains

- A static homepage (about 20 KB of HTML) that replaces the 1 MB bundled page. Content is readable without JavaScript.
- Three case pages under `work/` (ExaQube Technologies, Azimuth GRC, PlanetSpark). Old `#exaqube`, `#azimuth-grc` and `#planetspark` links redirect to them.
- Toolkit, Certifications, About, Contact, Privacy, Developers and 404 rebuilt on the shared design system (`tokens.css`, `base.css`, `site.css`, `site.js`).
- Self-hosted SVG logos in `icons/` in place of the Iconify API, which now returns 404.
- A one-page resume PDF published as `OmJayMishra-DataEngineer-Resume.pdf`; the old `Om's Resume.pdf` is kept for existing links.

## Checks run

| Check | Tool | Result |
| --- | --- | --- |
| Accessibility, WCAG 2.2 AA and best practice | axe-core 4.10.2 in Chromium, 1280 px viewport, every page | 0 violations |
| Horizontal overflow | Chromium at 320 px and 375 px, every page | none |
| Internal links and fragment anchors | crawler over every page | all resolve |
| External links | crawler plus a real browser for sites that block bots | all resolve; Udemy and LinkedIn block automated checks but load in a browser |
| HTML validity | W3C Nu validator on the deployed pages | favicon data URI and stray attribute errors fixed |
| Agent readiness (`npm test`) | line-for-line Python port of `scripts/agent-readiness.test.cjs` | passed |
| Resume PDF | headless Edge print of `resume.html` | one Letter page, 9 working links, searchable text |
| Reduced motion | Chromium with `prefers-reduced-motion: reduce` | every figure shows its final state; vignettes hold a still frame |
| Em and en dashes | byte scan of every HTML, CSS, JS, Markdown and text file | none |

## Interactive figures

- Runtime race: bars fill on one clock, then offer "Run it again".
- Before and after switch: the segmented control updates the bars and the announced total.
- Walk-through: highlights each stage and announces it to screen readers; every stage is readable at rest.
- Vignettes: click or tap the art to pause (it becomes a labelled button); they also stop off-screen.

## Known gaps

- `npm test` itself was not run because Node is not installed on the QA machine; the Python port covers the same assertions.
- `scripts/portfolio-qa.cjs` and `scripts/deployment-qa.cjs` (Playwright) still target the old bundled homepage and need rewriting for the static pages before they are useful again.
- Edge cannot render narrower than about 500 px in headless mode, so phone widths were checked in Chromium device emulation instead.
