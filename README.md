# IMAX at Scotiabank Toronto

A tiny static site showing what's currently playing in IMAX at four Cineplex
theatres in the GTA, and on which days: Scotiabank Theatre Toronto, Cineplex
Cinemas Winston Churchill & VIP (Oakville), Cineplex Cinemas Mississauga
Square One, and Cineplex Cinemas Vaughan.

Live at: https://ariesyous.github.io/imaxatscotia/

## How it works

- `data/theatres.json` is a checked-in manifest listing each theatre's
  Cineplex `theatreId`, a slug, its display name, and its output data file.
  Add a theatre here to have the scraper and frontend pick it up.
- `scripts/scrape.mjs` queries Cineplex's (undocumented) theatrical API once
  per theatre in `data/theatres.json`, probing a full year ahead, and keeps
  only sessions with an `IMAX` experience type. Cineplex normally only
  publishes a contiguous ~10-day window of regular showtimes, but also opens
  advance ticket sales for big releases on scattered dates much further out
  — probing the whole year catches those too. Each theatre's results are
  written to its own file under `data/` (e.g. `data/vaughan.json`); a
  theatre that fails entirely for a run is skipped, leaving its last
  known-good file untouched, without blocking the others.
- `.github/workflows/scrape.yml` runs that script once a day (~11:30am ET)
  via GitHub Actions, and commits the `data/*.json` files when they change.
  It can also be triggered manually (`workflow_dispatch`) from the Actions
  tab or via `gh workflow run scrape.yml`.
- `index.html` / `style.css` / `app.js` are a plain static page (no build
  step) that fetches `data/theatres.json` to build a theatre tab bar
  (Scotiabank Theatre Toronto shown by default), then fetches the selected
  theatre's data file and renders it as a responsive calendar. Past days and
  past showtimes drop off automatically since the scraper's window always
  starts at "today."
- GitHub Pages deploys straight from the `master` branch root, so a push
  (including the scraper's own automated commits) redeploys the live site.

Since the Cineplex API is unofficial and reverse-engineered, it may change
or break without notice — the scraper is written to skip bad/missing days
rather than overwrite good data with empty results, and to leave
`data/showtimes.json` untouched entirely if every request in a run fails.

## License

MIT — see [LICENSE](LICENSE).
