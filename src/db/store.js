const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DB_FILE = path.join(DATA_DIR, "arcade-data.json");

const defaultData = {
  games: [
    {
      id: "mission-artemis",
      title: "Mission Artemis",
      slug: "mission-artemis",
      description: "Doodle-jump style rocket ascent from Earth through the solar system.",
      path: "/play.html?game=mission-artemis",
      thumbnail: "🚀",
      scoringType: "high-score",
      status: "published"
    },
    {
      id: "diamond-blaster",
      title: "Diamond Blaster",
      slug: "diamond-blaster",
      description: "Time your swing and blast for the fences — arcade baseball!",
      path: "/play.html?game=diamond-blaster",
      thumbnail: "⚾",
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
  ],
  users: [],
  sessions: []
};

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
}

function readDb() {
  ensureDb();
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    if (!data.users) data.users = [];
    if (!data.sessions) data.sessions = [];
    return data;
  } catch (err) {
    console.error("Failed to read DB, resetting:", err);
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
    return JSON.parse(JSON.stringify(defaultData));
  }
}

function writeDb(data) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ── Password hashing (Node built-in crypto, no extra deps) ──

function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    const s = salt || crypto.randomBytes(16).toString("hex");
    crypto.pbkdf2(password, s, 100_000, 64, "sha512", (err, key) => {
      if (err) return reject(err);
      resolve({ hash: key.toString("hex"), salt: s });
    });
  });
}

function verifyPassword(password, hash, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100_000, 64, "sha512", (err, key) => {
      if (err) return reject(err);
      resolve(crypto.timingSafeEqual(Buffer.from(hash, "hex"), key));
    });
  });
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// ── Auth ─────────────────────────────────────────────────────

async function registerUser(username, password) {
  const db = readDb();
  if (db.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Username already taken");
  }
  const { hash, salt } = await hashPassword(password);
  const user = {
    id: `user-${Date.now()}`,
    username,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  const token = generateToken();
  db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  writeDb(db);
  return { token, user: { id: user.id, username: user.username } };
}

async function loginUser(username, password) {
  const db = readDb();
  const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) throw new Error("Invalid username or password");
  const valid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
  if (!valid) throw new Error("Invalid username or password");
  const token = generateToken();
  db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  writeDb(db);
  return { token, user: { id: user.id, username: user.username } };
}

function logoutUser(token) {
  const db = readDb();
  db.sessions = db.sessions.filter(s => s.token !== token);
  writeDb(db);
}

function getUserByToken(token) {
  if (!token) return null;
  const db = readDb();
  const session = db.sessions.find(s => s.token === token);
  if (!session) return null;
  const user = db.users.find(u => u.id === session.userId);
  return user ? { id: user.id, username: user.username } : null;
}

// ── Games ─────────────────────────────────────────────────────

function getGames() { return readDb().games; }

function getGameBySlug(slug) {
  return readDb().games.find(g => g.slug === slug) || null;
}

function addGame(entry) {
  const db = readDb();
  const slug = String(entry.slug || "").toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 40);
  if (!slug) throw new Error("Invalid slug");
  if (db.games.find(g => g.slug === slug)) throw new Error("A game with that slug already exists");
  const newGame = {
    id: slug,
    title: String(entry.title || "Untitled").slice(0, 60),
    slug,
    description: String(entry.description || "").slice(0, 300),
    path: String(entry.path || `/play.html?game=${slug}`).slice(0, 300),
    thumbnail: String(entry.thumbnail || "🎮").slice(0, 8),
    scoringType: String(entry.scoringType || "high-score"),
    status: String(entry.status || "published"),
    createdAt: new Date().toISOString()
  };
  db.games.push(newGame);
  writeDb(db);
  return newGame;
}

// ── Scores ────────────────────────────────────────────────────

function getScores(gameId) {
  const db = readDb();
  const scores = gameId ? db.scores.filter(s => s.gameId === gameId) : db.scores;
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

// ── Tournaments ───────────────────────────────────────────────

function getTournaments() { return readDb().tournaments; }

function addTournament(entry) {
  const db = readDb();
  const t = {
    id: `tournament-${Date.now()}`,
    title: entry.title,
    gameId: entry.gameId,
    description: entry.description || "",
    status: entry.status || "draft",
    startAt: entry.startAt || new Date().toISOString(),
    endAt: entry.endAt || null
  };
  db.tournaments.push(t);
  writeDb(db);
  return t;
}

module.exports = {
  registerUser, loginUser, logoutUser, getUserByToken,
  getGames, getGameBySlug, addGame,
  getScores, addScore,
  getTournaments, addTournament
};
