# AGENTS.md

Guidance for AI coding agents working in this repo.

## What this project is

A static GitHub Pages site showing IMAX showtimes at four Cineplex theatres
in the GTA (Scotiabank Theatre Toronto, Winston Churchill & VIP, Mississauga
Square One, Vaughan). No backend, no build step. See `README.md` for the
full architecture.

## Layout

- `index.html`, `style.css`, `app.js` — the frontend. Plain HTML/CSS/vanilla
  JS on purpose; don't introduce a build step or framework for this. `app.js`
  builds a theatre tab bar from `data/theatres.json` (Scotiabank Theatre
  Toronto is the default shown on load) and re-renders the calendar from the
  selected theatre's data file when a tab is clicked.
- `scripts/scrape.mjs` — Node script (built-in `fetch` only, no
  dependencies) that hits Cineplex's undocumented theatrical API once per
  theatre listed in `data/theatres.json` and writes each theatre's own
  `data/<slug>.json` file.
- `data/theatres.json` — checked-in manifest of tracked theatres (Cineplex
  `theatreId`, slug, display name, output file). Add an entry here to track
  a new theatre; both the scraper and the frontend read from it.
- `data/*.json` (one per theatre, e.g. `data/vaughan.json`) — generated
  data, committed to the repo so the page has content without a build/deploy
  step. Treat these as artifacts, not something to hand-edit.
- `.github/workflows/scrape.yml` — runs the scraper daily and on
  `workflow_dispatch`, commits the `data/*.json` files when they change.

## Constraints to respect

- **The Cineplex API is unofficial and reverse-engineered** (no public
  docs, key lives in Cineplex's own JS bundle). Don't assume its shape is
  stable — the scraper is written to skip bad/missing dates rather than
  overwrite good data with empty results, and to skip writing a theatre's
  file (leaving its last known-good data untouched) if every date fails for
  that theatre, without aborting the other theatres. It only exits non-zero
  if every theatre fails entirely. Preserve that fail-soft behavior in any
  changes.
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
