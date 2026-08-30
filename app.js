const calendarEl = document.getElementById("calendar");
const updatedEl = document.getElementById("updated");

function formatDayLabel(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function renderMovie(movie) {
  const el = document.createElement("div");
  el.className = "movie";

  const img = document.createElement("img");
  img.src = movie.poster || "";
  img.alt = "";
  img.loading = "lazy";
  el.appendChild(img);

  const info = document.createElement("div");
  info.className = "movie-info";

  const title = document.createElement("p");
  title.className = "movie-title";
  title.textContent = movie.title;
  info.appendChild(title);

  const sessions = document.createElement("div");
  sessions.className = "sessions";
  for (const session of movie.sessions) {
    const chip = session.ticketUrl
      ? document.createElement("a")
      : document.createElement("span");
    chip.className = "session";
    chip.textContent = session.time;
    if (session.ticketUrl) {
      chip.href = session.ticketUrl;
      chip.target = "_blank";
      chip.rel = "noopener";
    }
    sessions.appendChild(chip);
  }
  info.appendChild(sessions);

  el.appendChild(info);
  return el;
}

function renderDay(day) {
  const card = document.createElement("section");
  card.className = "day-card";

  const heading = document.createElement("h2");
  heading.textContent = formatDayLabel(day.date);
  card.appendChild(heading);

  for (const movie of day.movies) {
    card.appendChild(renderMovie(movie));
  }

  return card;
}

async function main() {
  try {
    const res = await fetch("data/showtimes.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    calendarEl.innerHTML = "";

    if (data.updatedAt) {
      const formatted = new Date(data.updatedAt).toLocaleString("en-US", {
        timeZone: "America/Toronto",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      });
      updatedEl.textContent = `Last updated ${formatted}`;
    }

    if (!data.days || data.days.length === 0) {
      calendarEl.innerHTML = '<p class="empty">No IMAX showtimes found right now.</p>';
      return;
    }

    for (const day of data.days) {
      calendarEl.appendChild(renderDay(day));
    }
  } catch (err) {
    calendarEl.innerHTML = `<p class="error">Couldn't load showtimes: ${err.message}</p>`;
  }
}

main();
