const express = require("express");
const path = require("path");

const gamesRouter = require("./src/routes/games");
const scoresRouter = require("./src/routes/scores");
const tournamentsRouter = require("./src/routes/tournaments");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "online-arcade" });
});

app.use("/api/games", gamesRouter);
app.use("/api/scores", scoresRouter);
app.use("/api/tournaments", tournamentsRouter);

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/games", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "games.html"));
});

app.get("/leaderboards", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "leaderboards.html"));
});

app.get("/tournaments", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "tournaments.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Online Arcade running on port ${PORT}`);
});
