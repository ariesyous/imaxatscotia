const calendarEl = document.getElementById("calendar");
const updatedEl = document.getElementById("updated");

let auditoriums = {};
let updatedAtLabel = "";

const seatPopover = document.createElement("div");
seatPopover.className = "seat-popover";
seatPopover.hidden = true;
document.body.appendChild(seatPopover);

function hideSeatPopover() {
  seatPopover.hidden = true;
}

function renderSeatPopover(session, chipEl) {
  const layout = auditoriums[session.areaCode];
  if (!layout || !session.seats) return;

  seatPopover.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "seat-grid";
  grid.style.gridTemplateColumns = `repeat(${layout.totalColumns}, 1fr)`;
  for (const rowStr of session.seats) {
    for (const ch of rowStr) {
      const cell = document.createElement("span");
      cell.className =
        "seat " +
        (ch === "A" ? "seat-available" : ch === "O" ? "seat-occupied" : "seat-none");
      grid.appendChild(cell);
    }
  }
  seatPopover.appendChild(grid);

  const legend = document.createElement("div");
  legend.className = "seat-legend";
  legend.innerHTML = `
    <span><span class="seat-swatch seat-available"></span> Available</span>
    <span><span class="seat-swatch seat-occupied"></span> Occupied</span>
  `;
  seatPopover.appendChild(legend);

  if (updatedAtLabel) {
    const caption = document.createElement("p");
    caption.className = "seat-caption";
    caption.textContent = `Seats as of ${updatedAtLabel}`;
    seatPopover.appendChild(caption);
  }

  seatPopover.hidden = false;

  const chipRect = chipEl.getBoundingClientRect();
  const popRect = seatPopover.getBoundingClientRect();
  let left = chipRect.left + window.scrollX;
  let top = chipRect.bottom + window.scrollY + 6;
  if (left + popRect.width > window.scrollX + document.documentElement.clientWidth - 8) {
    left = window.scrollX + document.documentElement.clientWidth - popRect.width - 8;
  }
  if (left < window.scrollX + 8) left = window.scrollX + 8;
  seatPopover.style.left = `${left}px`;
  seatPopover.style.top = `${top}px`;
}

document.addEventListener("click", (e) => {
  if (!seatPopover.hidden && !seatPopover.contains(e.target) && !e.target.closest(".session")) {
    hideSeatPopover();
  }
});

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
    if (session.seats && auditoriums[session.areaCode]) {
      chip.classList.add("has-seats");
      chip.addEventListener("mouseenter", () => renderSeatPopover(session, chip));
      chip.addEventListener("focus", () => renderSeatPopover(session, chip));
      chip.addEventListener("mouseleave", hideSeatPopover);
      chip.addEventListener("blur", hideSeatPopover);
      chip.addEventListener("click", (e) => {
        if (seatPopover.hidden) {
          e.preventDefault();
          renderSeatPopover(session, chip);
        }
      });
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
    auditoriums = data.auditoriums || {};

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
      updatedAtLabel = formatted;
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
