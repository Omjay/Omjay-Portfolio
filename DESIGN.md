# Om Jay Mishra Portfolio Design System

> A sober, evidence-first portfolio for recruiters and engineering leaders. Locked system: every page built on `tokens.css`, `base.css` and `site.css` follows this file.

Redesigned with [Hallmark](https://github.com/nutlope/hallmark) v2.0.0 at full depth: shape **Stat-Led**, genre **editorial**, job **hire**, brand **kept** (the blue accent, Source Serif 4 and Public Sans).

## 1. What the site argues

The first screen states one real result, set big: a 500M+ record pipeline cut from 6 hours to 30 minutes, drawn to scale. Everything after it supports that claim with more real figures, the work itself and the stack. Every number on the site comes from the resume or the case pages; nothing is invented, rounded up or derived.

## 2. Files

| File | Role |
| --- | --- |
| `tokens.css` | Every colour, font, size, space, radius, easing and duration. The only place a literal colour or `font-family` may appear. |
| `base.css` | Element defaults: overflow clipping, type, links, focus ring, skip link, reduced motion. |
| `site.css` | Components and page layouts. Starts with the Hallmark stamp and critique lines. |
| `site.js` | Progressive enhancement for figures only. Every figure is complete in the HTML without it. |
| `index.html`, `work/*/index.html` | The homepage and the three case pages, static HTML. |

Older pages (`toolkit.html`, `certifications.html`, `resume.html`, the agent pages) keep their own styles for now; they share the palette and faces.

## 3. Colour

OKLCH tokens, tinted toward hue 240. Restrained posture: the accent is a signal (links, the primary button, the after-state of a figure, focus), under 5% of any screen.

- Paper `--color-paper`, wells `--color-paper-2` and `--color-paper-3`, never pure white.
- Ink `--color-ink`, secondary `--color-ink-2`, muted `--color-muted` (4.5:1 or better on paper).
- Rules `--color-rule` and `--color-rule-strong`.
- Accent `--color-accent` with `--color-accent-ink` for text on it, `--color-accent-soft` for quiet fills, `--color-focus` for rings.
- Data marks: `--color-mark` for the slow run, `--color-warn` for the straggler partition.
- Code: `--color-code-*`, used only for code blocks.

## 4. Type

- Display: Source Serif 4, 600, tracking -0.02 to -0.03em. Body: Public Sans 400 and 600, 16px minimum. Mono (JetBrains Mono) only for code and stage numbers.
- Sizes from the tokens: display, display-s, section, title, lead, md, sm.
- Labels, captions, tags, nav links and meta are the body face, one step smaller, sentence case, untracked. No tracked capitals, no eyebrows above headings.
- Unit pairs keep a non-breaking space (`6 h 00 m`, `270+ h`).

## 5. Layout

- One container, 1440px max, fluid gutters; layouts use `minmax(0, 1fr)` tracks so nothing overflows from 320px to 1920px.
- Homepage order: hero with the run drawn to scale and the credentials; four figures; the work index (one row per role, the current role leads); the skew explainer with a before/after switch; the stack as rows; the close; the footer.
- Case pages: a head with the company, lead and facts; one article per project, text beside its figure; previous and next links.
- Sections part by space and hairlines; wells (`paper-2`) for figures; no card inside a card.

## 6. Figures and motion

- **Race** (`[data-race]`): runs drawn on one time axis; plays once when 50% visible, longest run in six seconds, then offers "Run it again".
- **Switch** (`[data-switch]`): two real states of one figure behind a segmented control; the reader chooses.
- **Steps** (`[data-steps]`): every stage readable at rest; "Walk through it" moves a highlight and announces each stage.
- **Vignettes** (`[data-ambient]`): the ExaQube ship, the Azimuth check line and the PlanetSpark sheet. Each loop pauses when the reader clicks or taps the art (it becomes a labelled button), stops off-screen, and holds a still frame under reduced motion.
- Only `transform`, `opacity` and colour animate. Under `prefers-reduced-motion` nothing moves and figures show their result.
- Illustrative parts (task lengths, table names) are labelled as illustrative beside the figure.

## 7. Copy

Specific and plain: the real numbers, places and tools. Headlines seven words or fewer, section heads six or fewer. No middle-dot meta strings, no arrows glued to link text, no em or en dashes in running copy, no buzzwords.

## 8. Do not

- Invent a metric, testimonial, logo or count.
- Add looping or decorative motion, parallax or scroll hijacking.
- Use colour or `font-family` literals outside `tokens.css`.
- Hide content until JavaScript runs.
- Publish, create a pull request, or merge without explicit approval.
