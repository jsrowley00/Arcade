const express = require("express");
const { getTournaments, addTournament, getGameBySlug } = require("../db/store");

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({ tournaments: getTournaments() });
});

router.post("/", (req, res) => {
  const { title, gameId, description, status, startAt, endAt } = req.body;

  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }

  if (!gameId || !getGameBySlug(gameId)) {
    return res.status(400).json({ error: "Valid gameId is required" });
  }

  const tournament = addTournament({ title, gameId, description, status, startAt, endAt });
  res.status(201).json({ ok: true, tournament });
});

module.exports = router;
