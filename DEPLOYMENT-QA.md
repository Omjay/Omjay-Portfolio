# PR 9 deployment review

Reviewed 12 September 2026 against PR head `c64e3701497473191f31404c1b5b7879f6cab14d`.

## Verdict

The corrected static site is suitable for deployment to the existing GitHub Pages project path, subject to the normal post-deployment smoke check. No deployment blocker remains in the tested local version. This is not a guarantee against hosting outages or every browser and crawler variation.

The unmodified PR had usability and recovery gaps. Its main interactive pages worked, but its static test failed on Windows line endings, the new information pages disappeared from homepage navigation after rendering, the fallback was hidden as soon as JavaScript started, the 404 recovery resources were not clickable, and the resume lacked a canonical URL and navigation landmark.

## Corrections

- Keep useful initial HTML visible until the interactive document is ready. Remove the incorrect JavaScript-required notice. A failed bundle retains the fallback and working navigation.
- Add About, Contact details, Privacy, Developer resources and Markdown links to the rendered homepage footer.
- Make 404 recovery links clickable and preserve readable layout on narrow screens and nested missing URLs.
- Add usable navigation target sizes to the static information pages and preserve footer hint contrast.
- Add the resume canonical URL, favicon and navigation landmark. Resume content and the PDF are unchanged.
- Add `.nojekyll` to explicitly publish the static files without Jekyll processing, including the Markdown alternative.
- Normalize line endings in the static regression test and add recovery/image-dimension assertions.
- Add `scripts/deployment-qa.cjs` for JavaScript-on/off, project-path links and broken-bundle coverage.

## Validation evidence

| Check | Result |
| --- | --- |
| Existing portfolio browser suite | 25 checks, zero findings |
| Browser widths | 320, 375, 768, 1024 and 1440 px |
| Additional deployment suite | 48 combinations: six routes, four widths, JavaScript on/off |
| Broken bundle | Visible fallback; About link navigates successfully |
| Nested missing route | HTTP 404 with working recovery links |
| Core flows | Company detail, menu/Escape, Certifications/Toolkit/Resume navigation, PDF endpoint |
| Accessibility checks | Headings, landmarks, names, contrast, overflow, target sizes, reduced motion, duplicate IDs |
| Static tests | Passed, including Windows line-ending handling and 1200 x 630 PNG dimensions |
| Inline JavaScript | Executable inline scripts compile successfully |
| Sitemap | XML parses; eight URLs |
| Local resource checks | Markdown, llms.txt, robots.txt, sitemap, PNG and PDF return 200 with appropriate MIME types |
| Visual inspection | Mobile homepage, no-JavaScript page, About page and nested 404; screenshots retained locally |
| External homepage images | All 12 loaded after scrolling with network access, including three remote company logos |
| Patch hygiene | `git diff --check` passed |

The browser suites used installed Microsoft Edge through Playwright and a local static server mounted at `/Omjay-Portfolio/`. The preview server returned the repository's 404 document with status 404. That validates application behavior, not a completed GitHub Pages deployment. The restricted-network suite ignores sandbox network-denial messages; homepage external-image loading was checked separately with network access. External credential providers were not exhaustively re-audited in this change.

To reproduce, run `npm test`, then `node scripts/portfolio-qa.cjs` and `node scripts/deployment-qa.cjs` against a static preview using `QA_BASE_URL`. Set `PLAYWRIGHT_MODULE` and `PLAYWRIGHT_BROWSER` when using an existing Playwright package/browser. The deployment suite expects the host to return `404.html` with HTTP 404 for missing paths; a plain Python server's default error page does not model that behavior. `QA_OUTPUT` can select an untracked screenshot directory.

## Is Agentic and hosting limits

The stored public report retrieved during this review scored the currently deployed URL **10/100**, scanned at `2026-09-12T14:38:27.723Z`. It does not evaluate this unmerged branch. Some findings are suspect: it searched for the brand “github” and associated GitHub's MCP server with this personal portfolio.

Direct requests to the live homepage returned HTTP 200 for ChatGPT-User, ClaudeBot, Google-Extended, ora-agent and DeepSeekBot. Thus the report's crawler-blocking claim was not reproduced from this network; it may reflect a scanner-specific or transient failure.

The live Pages configuration serves `main` at `/`, through legacy Pages publishing, with HTTPS enforced and no custom domain. Three recent Pages deployments were successful. PR 9 had no configured status checks.

Remaining scoring limits are not fixed by inventing product APIs:

- `https://omjay.github.io/robots.txt` returns 404. The project-level `/Omjay-Portfolio/robots.txt` is informative but cannot establish origin-wide crawler policy. That requires the account-root site or a suitable custom-domain/hosting setup.
- GitHub Pages does not implement request-time `Accept: text/markdown` negotiation or `Vary: Accept`. The linked `index.md` is an alternative resource, not negotiated content.
- Search indexing, brand recognition and scanner treatment of project subpaths are outside this patch's control. No new numeric score is promised.
- A personal portfolio has no need to fabricate MCP, authentication, commerce or API capabilities for a score.

After deployment, verify the homepage, information pages, `index.md`, sitemap, image and a nested nonexistent URL on the public host, then rescan the exact portfolio URL. Only that scan can establish the post-deployment score.

Sources: [stored report](https://is-agentic.com/scan/omjay.github.io/Omjay-Portfolio), [scoring methodology](https://is-agentic.com/methodology), [report API documentation](https://is-agentic.com/docs), [GitHub Pages publishing](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site), [robots.txt scope](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec).
