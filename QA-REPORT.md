# Portfolio local release candidate

Date: 2026-09-04
Scope: local files only
Status: passed

## What changed

- Added `DESIGN.md` as the source of truth for visual direction, typography, color, spacing, motion, accessibility, and responsive behavior.
- Refined the homepage into a clearer editorial portfolio with a concise introduction, evidence-led impact metrics, consistent career cards, and a compact toolkit preview.
- Rebuilt `toolkit.html` as a lightweight, semantic page instead of a generated bundle.
- Consolidated the duplicate Engineering map into the clearer capability map, keeping Om's data stack as a full-width foundation and Databricks and Spark directly below it.
- Added restrained platform-color surfaces, technology symbols, status labels, and a subtle green binary texture to the consolidated map.
- Restored the original Git verification badge shape, colors, and hover/focus tooltips inside the capability map.
- Applied gold provider-certification badges to Databricks, Delta Lake, and Azure; applied blue work-verification badges to all 19 displayed technologies, including Apps Script, Google Sheets, and Excel.
- Versioned both Toolkit and Certifications navigation targets so the full Portfolio → Certifications → Toolkit path cannot reopen either browser-cached legacy page.
- Standardized Toolkit and Certifications navigation as Portfolio → Toolkit → Certifications → Resume, including the 320px mobile layout.
- Corrected both Udemy course rows to show the Udemy provider symbol first and the SQL or Excel subject symbol beside it.
- Improved certification navigation, labels, color contrast, timeline behavior, touch targets, and graceful icon fallbacks.
- Improved resume metadata, semantic navigation, color variables, and consistency with the rest of the portfolio.
- Standardized the PlanetSpark title as `Data Analytics Engineer`, matching the resume and earlier portfolio history.
- Added `scripts/portfolio-qa.cjs` as a repeatable browser QA harness.

## Automated browser QA

All 25 automated checks passed with zero findings.

| Coverage | Result |
| --- | --- |
| 4 pages at 320 x 720 | Pass |
| 4 pages at 375 x 812 | Pass |
| 4 pages at 768 x 900 | Pass |
| 4 pages at 1024 x 900 | Pass |
| 4 pages at 1440 x 1000 | Pass |
| Reduced-motion behavior on all 4 pages | Pass |
| Cross-page navigation and homepage menu behavior | Pass |

The browser suite checks:

- responsive overflow and layout integrity
- document title, description, canonical URL, language, and heading structure
- semantic header, navigation, main, and footer landmarks
- duplicate IDs and broken local image references
- accessible names and minimum mobile touch-target sizes
- internal fragment destinations
- successful responses for every rendered same-origin link
- safe external-link behavior
- rendered text contrast against WCAG AA thresholds
- console failures and failed local resources
- homepage menu opening and Escape-key dismissal
- one persistent Resume link, plus muted Blogs and Personality placeholders in the menu
- the exact Portfolio → Certifications → Toolkit route, including cache-safe page versions and current-page heading
- consolidated capability hierarchy, six status labels, six category symbols, and binary background texture
- exact Git badge-symbol provenance, 3 gold/19 blue badge distribution, and tooltip behavior on mouse hover and keyboard focus
- consistent Toolkit/Certifications navigation order and fully visible Certifications navigation at 320px
- Udemy provider and SQL/Excel subject-icon placement
- PlanetSpark title consistency between the homepage detail view and resume
- reduced-motion overrides
- the local resume PDF response and MIME type

## Resume PDF QA

`Om's Resume.pdf` passed the local PDF inspection.

- one Letter-size page
- 78,096 bytes
- searchable text present
- no encryption
- no visible clipping or overlap after rendering at 144 DPI
- required terms found: Om Jay Mishra, Azure Databricks, PySpark, Delta Lake, Unity Catalog, Liquid Clustering, and Professional
- 8 working-format link annotations with no duplicates

## Static QA

- JavaScript syntax check: pass
- `git diff --check`: pass
- generated QA artifacts kept outside the repository
- pre-existing untracked `output/` folder left untouched

## Known local limitation

This sandbox blocks the third-party Iconify and Simple Icons network requests. Text labels remain available and broken icons now hide cleanly, so the pages degrade without layout damage. Public deployment and external credential destinations were not changed or published in this pass.

## Repeat the browser suite

Run a local server on port 4173, provide the Playwright module and installed browser paths, then execute:

```powershell
& $nodePath scripts\portfolio-qa.cjs
```

The script also supports `QA_PAGE`, `QA_VIEWPORT`, `QA_SKIP_REDUCED_MOTION`, and `QA_SKIP_NAVIGATION` environment filters for targeted checks.
