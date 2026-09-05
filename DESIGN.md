# Om Jay Mishra Portfolio Design System

> A calm, evidence-first editorial portfolio for technical recruiters and engineering leaders.

## 1. Visual Theme & Atmosphere

**Style:** Technical editorial minimalism

**Keywords:** sober, precise, credible, open, structured, accessible, human

**Tone:** Quiet confidence with engineering depth. Not futuristic, glossy, gamified, or template-like.

**Feel:** A concise engineering case study on a clean white page.

**Interaction tier:** L1 refined static

**Dependencies:** Native HTML, CSS, and small progressive-enhancement scripts only.

The system adapts three references without imitating them: Notion for content clarity and restrained geometry, IBM for technical authority and disciplined blue, and Linear for spacing precision and scarce accent use. Om's existing typography, content, and identity remain primary.

## 2. Color Palette & Roles

```css
:root {
  --canvas: #ffffff;
  --surface: #fbfbf9;
  --surface-alt: #f5f7f8;
  --surface-hover: #f1f5f7;
  --border: #e2e5e6;
  --border-strong: #c8cdd0;
  --ink: #1c1e21;
  --ink-secondary: #45484d;
  --ink-tertiary: #747981;
  --accent: #1f6791;
  --accent-hover: #164b6a;
  --accent-soft: #e8f2f8;
  --brand-databricks: #9f2b23;
  --brand-azure: #005b96;
  --brand-sql: #8e4450;
  --brand-delta: #0b6b47;
  --brand-language: #6f500c;
  --brand-devops: #45515c;
  --matrix-green: #69e6a6;
  --verification-certified: #e9a115;
  --verification-work: #0078d4;
  --success: #2f6f4f;
  --warning: #8a6419;
  --error: #9d3b3b;
  --canvas-rgb: 255, 255, 255;
  --ink-rgb: 28, 30, 33;
  --accent-rgb: 31, 103, 145;
}
```

Color rules:

- True white is the primary canvas and is an established portfolio convention.
- Muted blue is the primary decorative accent. Restrained platform colors may appear only on the consolidated Toolkit capability cards as identity cues.
- Verification marks reproduce the original portfolio system: gold denotes relevant provider certification and blue denotes work-verified experience. Tooltips identify the evidence source on hover and keyboard focus.
- The dark stack-foundation card may use a low-opacity green binary texture to reinforce the data-engineering context without reducing readability.
- Use neutral surface changes and hairline borders before adding shadows.
- New component CSS references variables instead of embedding color literals.

## 3. Typography Rules

Font source:

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Public+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap');
```

| Role | Font | Size | Weight | Line height | Letter spacing |
|---|---|---:|---:|---:|---:|
| Hero H1 | Source Serif 4 | clamp(2.75rem, 6vw, 5.25rem) | 600 | 1.04 | -0.025em |
| Section H2 | Source Serif 4 | clamp(2rem, 4vw, 3.25rem) | 600 | 1.1 | -0.02em |
| H3 | Source Serif 4 | 1.35rem | 600 | 1.25 | -0.01em |
| Body | Public Sans | 1rem | 400 | 1.65 | 0 |
| Small body | Public Sans | 0.875rem | 400 | 1.55 | 0 |
| Label | JetBrains Mono | 0.72rem | 500 | 1.45 | 0.06em |
| Data | Source Serif 4 | clamp(2.5rem, 5vw, 4.5rem) | 600 | 1 | -0.03em |

Typography rules:

- Source Serif 4 is justified by the portfolio's established editorial identity.
- Use sentence case for headings and labels unless an external product name requires different casing.
- Mono labels describe real technical metadata. They do not number sections.
- Body copy stays below 70 characters per line where practical.
- Never use decorative gradient text, text shadows, or mixed-family emphasis.
- Never use Inter, novelty display faces, or all-caps paragraphs.

Text decoration: no gradients or shadows on H1, H2, or H3. Links use color and underline offset only.

## 4. Component Stylings

### Buttons

```css
.button {
  align-items: center;
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 6px;
  color: var(--canvas);
  cursor: pointer;
  display: inline-flex;
  font: 600 0.82rem/1.2 'Public Sans', sans-serif;
  justify-content: center;
  min-height: 44px;
  padding: 0.75rem 1rem;
  text-decoration: none;
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
}
.button:hover { background: var(--accent-hover); border-color: var(--accent-hover); }
.button:active { transform: translateY(1px); }
.button:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.button[aria-disabled='true'], .button:disabled { cursor: not-allowed; opacity: 0.5; }
```

### Cards

```css
.card {
  background: var(--canvas);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1.5rem;
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}
.card:hover { border-color: var(--border-strong); transform: translateY(-1px); }
.card:focus-within { box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.14); }
```

### Navigation

```css
.site-nav {
  background: rgba(var(--canvas-rgb), 0.94);
  border-bottom: 1px solid var(--border);
  min-height: 64px;
}
.site-nav a { align-items: center; display: inline-flex; min-height: 44px; }
.site-nav a:hover { color: var(--accent-hover); }
.site-nav a:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
```

### Links

```css
.text-link {
  color: var(--accent);
  text-decoration-color: transparent;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.22em;
  transition: color 160ms ease, text-decoration-color 160ms ease;
}
.text-link:hover { color: var(--accent-hover); text-decoration-color: currentColor; }
.text-link:active { color: var(--ink); }
.text-link:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.text-link[aria-disabled='true'] { color: var(--ink-tertiary); pointer-events: none; }
```

### Tags and badges

```css
.tag {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--ink-secondary);
  display: inline-flex;
  font: 500 0.72rem/1.4 'JetBrains Mono', monospace;
  padding: 0.32rem 0.5rem;
}
```

### Impact rail

```css
.impact-rail { display: grid; gap: 1rem; grid-template-columns: 1.6fr 1fr; }
.impact-rail__primary { grid-row: span 2; min-height: 100%; }
```

## 5. Layout Principles

**Container:**

- Maximum width: 1180px
- Desktop inline padding: 32px
- Mobile inline padding: 20px
- Reading width: 68ch

**Spacing scale:** 4, 8, 12, 16, 24, 32, 48, 72, and 96px.

**Grid:**

```css
.page-shell { margin-inline: auto; max-width: 1180px; padding-inline: 32px; }
.two-column { display: grid; gap: 32px; grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr); }
.capability-grid { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
```

Pages should alternate layout families by purpose: editorial hero, asymmetric impact rail, stacked career narrative, work rows, and compact toolkit preview. Cards are reserved for bounded evidence or navigable items.

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| Flat | Canvas plus whitespace | Hero, section introductions, footer |
| Bounded | Hairline border, no shadow | Skill groups, architecture notes |
| Interactive | Hairline border plus subtle hover lift | Career and project links |
| Focus | 2px accent outline with offset | Keyboard focus |

No atmospheric glow, glass effects, heavy shadows, or section-wide gradients.

## 7. Animation & Interaction

**Motion philosophy:** Movement confirms interaction and clarifies hierarchy. It never competes with content.

**Tier:** L1 refined static

**Dependencies:** None.

Entrance behavior:

```css
@keyframes page-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.page-enter { animation: page-enter 420ms cubic-bezier(0.16, 1, 0.3, 1) both; }
```

Hover and focus behavior:

```css
a, button { transition-duration: 160ms; transition-timing-function: ease; }
a:active, button:active { transform: translateY(1px); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
```

Reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

No parallax, scroll hijacking, cursor replacement, WebGL, marquee, or perpetual decorative motion.

## 8. Do's and Don'ts

### Do

- Lead with verified outcomes and concrete project evidence.
- Preserve the white canvas, serif display face, sans body, and mono metadata hierarchy.
- Keep one clear next action per section.
- Use sentence case and concise labels.
- Make every interactive target at least 44px tall on touch screens.
- Keep company identity in small accents and the existing bespoke illustrations.
- Keep detailed skill and architecture content on `toolkit.html`.
- Maintain visible keyboard focus and useful link text.

### Don't

- Do not use three equal statistic cards.
- Do not number section labels.
- Do not add decorative dots, fake status indicators, or ornamental metadata strips.
- Do not introduce purple glows, glassmorphism, mesh gradients, or dark section flips.
- Do not add custom cursors, WebGL, parallax, marquees, or scroll hijacking.
- Do not use progress bars to score skills.
- Do not hide detailed evidence behind hover-only interactions.
- Do not use multiple decorative accent colors across one page; keep platform identity colors localized to the Toolkit capability map.
- Do not let homepage skills duplicate the Toolkit page.
- Do not open new tabs without `rel="noopener"`.
- Do not expose certification assessment percentages.
- Do not publish, create a pull request, or merge without explicit approval.

## 9. Responsive Behavior

| Name | Width | Key changes |
|---|---:|---|
| Desktop | 1024px and above | Asymmetric two-column layouts, full navigation |
| Tablet | 768px to 1023px | Reduced gaps, flexible two-column layouts |
| Mobile | Below 768px | Single column, 20px gutters, compact typography |

**Touch targets:** 44 by 44px minimum.

**Collapsing strategy:**

- The impact rail becomes one column, with the primary outcome first.
- Career cards retain a linear reading order and place decorative visuals after copy.
- Toolkit capability and architecture grids become one column.
- Navigation preserves the existing mobile menu behavior.
- No element may cause horizontal page overflow at 320px.

```css
@media (max-width: 767px) {
  .page-shell { padding-inline: 20px; }
  .two-column, .capability-grid, .impact-rail { grid-template-columns: 1fr; }
  .impact-rail__primary { grid-row: auto; }
  h1 { font-size: clamp(2.35rem, 12vw, 3.25rem); }
}
```
