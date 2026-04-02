async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return response.json();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function loadHome() {
  const [gamesData, scoresData, tournamentsData] = await Promise.all([
    fetchJson("/api/games"),
    fetchJson("/api/scores"),
    fetchJson("/api/tournaments")
  ]);

  const games = gamesData.games || [];
  const scores = scoresData.scores || [];
  const tournaments = tournamentsData.tournaments || [];

  document.querySelector("[data-kpi='games']").textContent = games.length;
  document.querySelector("[data-kpi='scores']").textContent = scores.length;
  document.querySelector("[data-kpi='tournaments']").textContent = tournaments.length;

  const gamesGrid = document.getElementById("featured-games");
  gamesGrid.innerHTML = games.map((game) => `
    <article class="game-card">
      <div class="game-thumb">${escapeHtml(game.thumbnail || "🎮")}</div>
      <div class="badge">${escapeHtml(game.scoringType || "high-score")}</div>
      <h3>${escapeHtml(game.title)}</h3>
      <p class="muted">${escapeHtml(game.description || "")}</p>
      <div class="btn-row">
        <a class="btn primary" href="${escapeHtml(game.path)}">Play now</a>
      </div>
    </article>
  `).join("");

  const topScores = scores.slice(0, 5);
  const lb = document.getElementById("home-leaderboard");
  lb.innerHTML = topScores.length ? topScores.map((item, index) => `
    <div class="list-row">
      <div>#${index + 1} · ${escapeHtml(item.playerName)}</div>
      <div><b>${escapeHtml(item.score)}</b></div>
    </div>
  `).join("") : `<div class="empty">No scores yet.</div>`;

  const tournamentsWrap = document.getElementById("home-tournaments");
  tournamentsWrap.innerHTML = tournaments.length ? tournaments.map((t) => `
    <article class="tournament-card">
      <div class="badge">${escapeHtml(t.status)}</div>
      <h3>${escapeHtml(t.title)}</h3>
      <p class="muted">${escapeHtml(t.description || "")}</p>
      <p class="meta">Game: ${escapeHtml(t.gameId)}</p>
    </article>
  `).join("") : `<div class="empty">No tournaments yet.</div>`;
}

async function loadGamesPage() {
  const { games } = await fetchJson("/api/games");
  const container = document.getElementById("games-list");
  container.innerHTML = games.map((game) => `
    <article class="game-card">
      <div class="game-thumb">${escapeHtml(game.thumbnail || "🎮")}</div>
      <div class="badge">${escapeHtml(game.status)}</div>
      <h3>${escapeHtml(game.title)}</h3>
      <p class="muted">${escapeHtml(game.description || "")}</p>
      <p class="meta">Slug: ${escapeHtml(game.slug)}</p>
      <div class="btn-row">
        <a class="btn primary" href="${escapeHtml(game.path)}">Launch game</a>
      </div>
    </article>
  `).join("");
}

async function loadLeaderboardsPage() {
  const { scores } = await fetchJson("/api/scores?gameId=mission-artemis");
  const container = document.getElementById("leaderboard-list");
  container.innerHTML = scores.length ? scores.map((score, index) => `
    <div class="list-row">
      <div>
        <b>#${index + 1}</b> ${escapeHtml(score.playerName)}
        <div class="muted">${new Date(score.createdAt).toLocaleString()}</div>
      </div>
      <div><b>${escapeHtml(score.score)}</b></div>
    </div>
  `).join("") : `<div class="empty">No scores yet.</div>`;
}

async function loadTournamentsPage() {
  const { tournaments } = await fetchJson("/api/tournaments");
  const container = document.getElementById("tournaments-list");
  container.innerHTML = tournaments.length ? tournaments.map((tournament) => `
    <article class="tournament-card">
      <div class="badge">${escapeHtml(tournament.status)}</div>
      <h3>${escapeHtml(tournament.title)}</h3>
      <p class="muted">${escapeHtml(tournament.description || "")}</p>
      <p class="meta">Game: ${escapeHtml(tournament.gameId)}</p>
      <p class="meta">Start: ${new Date(tournament.startAt).toLocaleString()}</p>
      ${tournament.endAt ? `<p class="meta">End: ${new Date(tournament.endAt).toLocaleString()}</p>` : ""}
    </article>
  `).join("") : `<div class="empty">No tournaments yet.</div>`;
}

window.ArcadeApp = {
  loadHome,
  loadGamesPage,
  loadLeaderboardsPage,
  loadTournamentsPage
};
