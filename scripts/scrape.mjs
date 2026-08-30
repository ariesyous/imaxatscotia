// Scrapes Cineplex's undocumented theatrical API for IMAX showtimes at
// Scotiabank Theatre Toronto and writes data/showtimes.json.
//
// The API is unofficial (reverse-engineered from Cineplex's own JS bundle).
// If it starts failing entirely, we skip writing the file so we never
// clobber the last known-good data with empty/broken output.

const THEATRE_ID = 7402; // Scotiabank Theatre Toronto
const THEATRE_NAME = "Scotiabank Theatre Toronto";
const SUBSCRIPTION_KEY =
  process.env.CINEPLEX_SUBSCRIPTION_KEY || "dcdac5601d864addbc2675a2e96cb1f8";
const API_BASE = "https://apis.cineplex.com/prod/cpx/theatrical/api/v1";
// Cineplex publishes a contiguous ~10-day window of regular showtimes, but
// also opens advance ticket sales for big releases (e.g. tentpole IMAX
// events) on scattered dates many months out. There's no way to know where
// those advance-sale dates are without probing, so we scan a full year
// ahead and just keep whatever comes back non-empty.
const DAYS_AHEAD = 365;
const CONCURRENCY = 8;
const OUTPUT_PATH = new URL("../data/showtimes.json", import.meta.url);

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

async function fetchShowtimesForDate(dateStr) {
  const url = `${API_BASE}/showtimes?language=en&locationId=${THEATRE_ID}&date=${dateStr}`;
  const res = await fetch(url, {
    headers: { "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${dateStr}`);
  }
  const text = await res.text();
  if (!text) return null; // no data published for this date yet
  return JSON.parse(text);
}

function extractImaxMovies(theatreEntry) {
  const dateEntry = theatreEntry?.dates?.[0];
  if (!dateEntry) return [];

  const movies = [];
  for (const movie of dateEntry.movies ?? []) {
    const sessions = [];
    for (const experience of movie.experiences ?? []) {
      const experienceTypes = experience.experienceTypes ?? [];
      if (!experienceTypes.includes("IMAX")) continue;
      const format = experienceTypes.join(" ");
      for (const session of experience.sessions ?? []) {
        if (session.isInThePast) continue;
        const time = session.showStartDateTime?.slice(11, 16); // HH:MM
        if (!time) continue;
        sessions.push({
          time,
          format,
          ticketUrl: session.deeplinkUrl || session.ticketingUrl || null,
        });
      }
    }
    if (sessions.length === 0) continue;
    sessions.sort((a, b) => a.time.localeCompare(b.time));
    movies.push({
      title: movie.name,
      poster: movie.mediumPosterImageUrl || movie.smallPosterImageUrl || null,
      runtimeMinutes: movie.runtimeInMinutes ?? null,
      sessions,
    });
  }
  return movies;
}

async function processDate(dateStr) {
  try {
    const payload = await fetchShowtimesForDate(dateStr);
    if (!payload) return { dateStr, ok: true, movies: [] };
    const theatreEntry = Array.isArray(payload) ? payload[0] : payload;
    const movies = extractImaxMovies(theatreEntry);
    return { dateStr, ok: true, movies };
  } catch (err) {
    console.warn(`Skipping ${dateStr}: ${err.message}`);
    return { dateStr, ok: false, movies: [] };
  }
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

async function main() {
  const today = new Date();
  const dateStrs = Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    return formatDate(date);
  });

  const results = await mapWithConcurrency(dateStrs, CONCURRENCY, processDate);

  const successCount = results.filter((r) => r.ok).length;
  if (successCount === 0) {
    console.error("Every date request failed; leaving existing data untouched.");
    process.exit(1);
  }

  const days = results
    .filter((r) => r.movies.length > 0)
    .map((r) => ({ date: r.dateStr, movies: r.movies }));

  const output = {
    updatedAt: new Date().toISOString(),
    theatre: { id: THEATRE_ID, name: THEATRE_NAME },
    days,
  };

  await import("node:fs/promises").then(({ mkdir, writeFile }) =>
    mkdir(new URL("../data", import.meta.url), { recursive: true }).then(() =>
      writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n")
    )
  );

  console.log(
    `Wrote ${days.length} day(s) with IMAX showtimes to data/showtimes.json`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
