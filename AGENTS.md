# AGENTS.md

Guidance for AI coding agents working in this repo.

## What this project is

A static GitHub Pages site showing IMAX showtimes at Cineplex's Scotiabank
Theatre Toronto. No backend, no build step. See `README.md` for the full
architecture.

## Layout

- `index.html`, `style.css`, `app.js` — the frontend. Plain HTML/CSS/vanilla
  JS on purpose; don't introduce a build step or framework for this.
- `scripts/scrape.mjs` — Node script (built-in `fetch` only, no
  dependencies) that hits Cineplex's undocumented theatrical API and writes
  `data/showtimes.json`.
- `data/showtimes.json` — generated data, committed to the repo so the page
  has content without a build/deploy step. Treat it as an artifact, not
  something to hand-edit.
- `.github/workflows/scrape.yml` — runs the scraper daily and on
  `workflow_dispatch`, commits `data/showtimes.json` when it changes.

## Constraints to respect

- **The Cineplex API is unofficial and reverse-engineered** (no public
  docs, key lives in Cineplex's own JS bundle). Don't assume its shape is
  stable — the scraper is written to skip bad/missing dates rather than
  overwrite good data with empty results, and to exit non-zero without
  writing the file if every date fails. Preserve that fail-soft behavior in
  any changes.
- Showtimes aren't published on a contiguous rolling window — big releases
  get scattered advance-sale dates far in the future (see `DAYS_AHEAD` in
  `scripts/scrape.mjs`). Don't "optimize" the scraper to stop at the first
  empty date; it has to probe the whole window.
- No build step. Don't add bundlers, TypeScript compilation, or frameworks
  unless explicitly asked — the site is meant to stay simple enough to
  deploy by just pushing to `master`.
- GitHub Pages serves the `master` branch root directly. Any file at repo
  root is publicly served as-is.

## Testing changes

- Run `node scripts/scrape.mjs` locally to regenerate `data/showtimes.json`
  and sanity-check the output.
- Serve the repo root with any static file server (e.g. `npx serve` or
  `python -m http.server`) and open it in a browser to check the UI.
- There is no automated test suite.
