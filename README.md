# Ben Hungerford — Portfolio
Greenville, SC web developer crafting clean, performance-first sites for values-driven brands.

## What’s on the site
- Hero with clear positioning, two CTAs (start a conversation, see recent work), and a theme toggle.
- Selected Work grid linking out to recent WordPress/Shopify builds.
- About section with personal backstory and quick lists (EDC, favorite books).
- Services (“Ways We Can Work Together”) outlining new builds, refinements, and ongoing partnership.
- Contact footer with mailto CTA, LinkedIn link, and dynamic copyright year.

## Tech stack
- Static HTML, CSS, and vanilla JS (`index.html`, `styles.css`, `main.js`).
- GSAP + ScrollTrigger/ScrollSmoother (local vendor builds in `js/vendor`) for smooth scrolling and fades.
- Normalize.css baseline, Google Fonts (Inter + DM Mono), and lightweight image assets in `images/`.
- Structured data (Person, Website, ProfessionalService) and social meta tags tuned for previews.

## Local preview
- Open `index.html` directly in a browser, or run a lightweight server: `python -m http.server 8000` and visit `http://localhost:8000`.
- Theme toggle and smooth scrolling degrade gracefully if ScrollSmoother isn’t available (e.g., mobile/reduced motion).

## Quick checks with Playwright
- Dev dependency: `playwright@1.33.0` (Node 16 compatible).
- Example: capture a live screenshot `npx playwright screenshot --wait-for-timeout 3000 --full-page https://benhungerford.dev shot.png`.
- To exercise anchors/buttons locally: run a small script against `file://.../index.html` to verify CTAs scroll to `#work` and `#contact`.
