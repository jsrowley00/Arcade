const express = require("express");
const { getGames, getGameBySlug } = require("../db/store");

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({ games: getGames() });
});

router.get("/:slug", (req, res) => {
  const game = getGameBySlug(req.params.slug);
  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }
  res.json(game);
});

module.exports = router;
