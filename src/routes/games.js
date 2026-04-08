const express = require("express");
const { getGames, getGameBySlug, addGame } = require("../db/store");

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({ games: getGames() });
});

router.get("/:slug", (req, res) => {
  const game = getGameBySlug(req.params.slug);
  if (!game) return res.status(404).json({ error: "Game not found" });
  res.json(game);
});

router.post("/", (req, res) => {
  const { title, slug, path, description, thumbnail, scoringType, status } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "title is required" });
  }
  if (!slug || !slug.trim()) {
    return res.status(400).json({ error: "slug is required" });
  }
  if (!path || !path.trim()) {
    return res.status(400).json({ error: "path is required" });
  }

  try {
    const game = addGame({ title, slug, path, description, thumbnail, scoringType, status });
    res.status(201).json({ ok: true, game });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
