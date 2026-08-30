# IMAX at Scotiabank Toronto

A tiny static site showing what's currently playing in IMAX at Cineplex's
Scotiabank Theatre Toronto, and on which days.

Live at: https://ariesyous.github.io/imaxatscotia/

## How it works

- `scripts/scrape.mjs` queries Cineplex's (undocumented) theatrical API,
  probing a full year ahead for the theatre (`theatreId: 7402`), and keeps
  only sessions with an `IMAX` experience type. Cineplex normally only
  publishes a contiguous ~10-day window of regular showtimes, but also opens
  advance ticket sales for big releases on scattered dates much further out
  — probing the whole year catches those too. Results are written to
  `data/showtimes.json`.
- `.github/workflows/scrape.yml` runs that script once a day (~11:30am ET)
  via GitHub Actions, and commits `data/showtimes.json` when it changes.
  It can also be triggered manually (`workflow_dispatch`) from the Actions
  tab or via `gh workflow run scrape.yml`.
- `index.html` / `style.css` / `app.js` are a plain static page (no build
  step) that fetches `data/showtimes.json` and renders it as a responsive
  calendar. Past days and past showtimes drop off automatically since the
  scraper's window always starts at "today."
- GitHub Pages deploys straight from the `master` branch root, so a push
  (including the scraper's own automated commits) redeploys the live site.

Since the Cineplex API is unofficial and reverse-engineered, it may change
or break without notice — the scraper is written to skip bad/missing days
rather than overwrite good data with empty results, and to leave
`data/showtimes.json` untouched entirely if every request in a run fails.

## License

MIT — see [LICENSE](LICENSE).
