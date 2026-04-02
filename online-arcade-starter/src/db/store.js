const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DB_FILE = path.join(DATA_DIR, "arcade-data.json");

const defaultData = {
  games: [
    {
      id: "mission-artemis",
      title: "Mission Artemis",
      slug: "mission-artemis",
      description: "Doodle-jump style rocket ascent from Earth through the solar system.",
      path: "/games/mission-artemis/",
      thumbnail: "🚀",
      scoringType: "high-score",
      status: "published"
    }
  ],
  scores: [
    {
      id: "seed-1",
      gameId: "mission-artemis",
      playerName: "Commander Nova",
      score: 4200,
      createdAt: new Date().toISOString(),
      metadata: { planetsReached: 3, altitude: "5.5 Mkm" }
    },
    {
      id: "seed-2",
      gameId: "mission-artemis",
      playerName: "Luna Drift",
      score: 3600,
      createdAt: new Date().toISOString(),
      metadata: { planetsReached: 2, altitude: "2.1 Mkm" }
    }
  ],
  tournaments: [
    {
      id: "weekly-artemis",
      title: "Weekly Artemis Challenge",
      gameId: "mission-artemis",
      description: "Highest score wins this week.",
      status: "active",
      startAt: new Date().toISOString(),
      endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
};

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
  }
}

function readDb() {
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to read DB, resetting:", error);
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
    return JSON.parse(JSON.stringify(defaultData));
  }
}

function writeDb(data) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function getGames() {
  return readDb().games;
}

function getGameBySlug(slug) {
  return readDb().games.find((game) => game.slug === slug) || null;
}

function getScores(gameId) {
  const db = readDb();
  const scores = gameId ? db.scores.filter((score) => score.gameId === gameId) : db.scores;
  return scores.sort((a, b) => b.score - a.score || new Date(a.createdAt) - new Date(b.createdAt));
}

function addScore(entry) {
  const db = readDb();
  const newEntry = {
    id: `score-${Date.now()}`,
    gameId: entry.gameId,
    playerName: String(entry.playerName || "Anonymous").slice(0, 40),
    score: Number(entry.score || 0),
    createdAt: new Date().toISOString(),
    metadata: entry.metadata || {}
  };
  db.scores.push(newEntry);
  writeDb(db);
  return newEntry;
}

function getTournaments() {
  return readDb().tournaments;
}

function addTournament(entry) {
  const db = readDb();
  const newTournament = {
    id: `tournament-${Date.now()}`,
    title: entry.title,
    gameId: entry.gameId,
    description: entry.description || "",
    status: entry.status || "draft",
    startAt: entry.startAt || new Date().toISOString(),
    endAt: entry.endAt || null
  };
  db.tournaments.push(newTournament);
  writeDb(db);
  return newTournament;
}

module.exports = {
  getGames,
  getGameBySlug,
  getScores,
  addScore,
  getTournaments,
  addTournament
};
