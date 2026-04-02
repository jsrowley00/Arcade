const express = require("express");
const { getScores, addScore, getGameBySlug } = require("../db/store");

const router = express.Router();

router.get("/", (req, res) => {
  const scores = getScores(req.query.gameId);
  res.json({ scores });
});

router.post("/submit", (req, res) => {
  const { gameId, playerName, score, metadata } = req.body;

  if (!gameId || !getGameBySlug(gameId)) {
    return res.status(400).json({ error: "Valid gameId is required" });
  }

  if (typeof score === "undefined" || Number.isNaN(Number(score))) {
    return res.status(400).json({ error: "Numeric score is required" });
  }

  const entry = addScore({ gameId, playerName, score, metadata });
  res.status(201).json({ ok: true, entry });
});

module.exports = router;
