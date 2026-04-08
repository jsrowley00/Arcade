const express = require("express");
const { getScores, addScore, getGameBySlug, getUserByToken } = require("../db/store");

const router = express.Router();

router.get("/", (req, res) => {
  const scores = getScores(req.query.gameId);
  res.json({ scores });
});

router.post("/submit", (req, res) => {
  const token = req.headers["x-arcade-token"];
  const user = getUserByToken(token);

  if (!user) {
    return res.status(401).json({ error: "You must be logged in to submit scores" });
  }

  const { gameId, score, metadata } = req.body;

  if (!gameId || !getGameBySlug(gameId)) {
    return res.status(400).json({ error: "Valid gameId is required" });
  }
  if (typeof score === "undefined" || Number.isNaN(Number(score))) {
    return res.status(400).json({ error: "Numeric score is required" });
  }

  const entry = addScore({ gameId, playerName: user.username, score, metadata });
  res.status(201).json({ ok: true, entry });
});

module.exports = router;
