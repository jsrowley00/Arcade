# Online Arcade Starter

A Railway-ready starter project for an arcade shell that can host multiple HTML games.

## Included
- Express server
- Static arcade pages
- Game library API
- Score submission API
- Tournament API
- Mission Artemis game installed under `/public/games/mission-artemis/`

## Run locally
```bash
npm install
npm start
```

Open `http://localhost:8080`

## Current routes
- `/` home
- `/games` game library
- `/leaderboards` leaderboard page
- `/tournaments` tournament page
- `/games/mission-artemis/` playable game
- `/api/games`
- `/api/scores`
- `/api/scores/submit`
- `/api/tournaments`

## Important note
This starter uses a JSON file in `/data/arcade-data.json` for simplicity.
On Railway, the filesystem is ephemeral, so for production you should move scores and tournaments to Postgres or Supabase.
