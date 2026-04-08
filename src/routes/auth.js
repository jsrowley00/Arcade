const express = require("express");
const { registerUser, loginUser, logoutUser, getUserByToken } = require("../db/store");

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !username.trim()) return res.status(400).json({ error: "Username is required" });
  if (!password || password.length < 4) return res.status(400).json({ error: "Password must be at least 4 characters" });
  if (username.trim().length > 32) return res.status(400).json({ error: "Username too long (max 32 chars)" });

  try {
    const { token, user } = await registerUser(username.trim(), password);
    res.status(201).json({ ok: true, token, username: user.username });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password are required" });

  try {
    const { token, user } = await loginUser(username.trim(), password);
    res.json({ ok: true, token, username: user.username });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  const token = req.headers["x-arcade-token"];
  if (token) logoutUser(token);
  res.json({ ok: true });
});

// GET /api/auth/me  — verify a token, return username
router.get("/me", (req, res) => {
  const token = req.headers["x-arcade-token"];
  if (!token) return res.status(401).json({ error: "No token" });
  const user = getUserByToken(token);
  if (!user) return res.status(401).json({ error: "Invalid or expired token" });
  res.json({ ok: true, username: user.username });
});

module.exports = router;
