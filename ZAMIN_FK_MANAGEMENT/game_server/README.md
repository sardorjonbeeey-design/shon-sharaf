# ZAMIN FK Management — isolated game server

Independent Node.js API and PostgreSQL schema for the management-game candidate. This directory is not mounted into the existing Mini App, bot, city server or stadium.

## Runtime
- Node.js 22+
- PostgreSQL (a separate Neon project is suitable)
- Install dependencies, configure environment, run migrations, seed the market, then start the server.
- No production credentials are included.

## First setup
1. Create a new, separate database/project. Do not use the existing Mini App database.
2. Copy .env.example to .env and set DATABASE_URL.
3. Set TELEGRAM_BOT_TOKEN only when ready to enable Telegram Mini App authentication.
4. Run npm install, npm run db:migrate, npm run db:seed, npm test, then npm start.
5. Set WEB_ORIGIN to the exact game origin before production use.

## Authentication
Production requests use Telegram Mini App initData sent as JSON to POST /api/auth/telegram. The server validates Telegram's HMAC signature and freshness, then issues a short-lived signed bearer token. Never put the bot token or session secret in browser code. For isolated local testing only, ALLOW_DEV_AUTH=true permits x-dev-user-id; this is rejected outside NODE_ENV=development.

## API
- GET /health
- POST /api/auth/telegram
- GET /api/market
- POST /api/clubs
- GET /api/clubs/:clubId
- GET /api/clubs/:clubId/squad
- POST /api/clubs/:clubId/lineup
- POST /api/clubs/:clubId/players/sign
- POST /api/clubs/:clubId/players/sell
- POST /api/clubs/:clubId/players/upgrade
- GET /api/clubs/:clubId/missions
- POST /api/clubs/:clubId/leagues/ensure
- GET /api/clubs/:clubId/fixtures
- POST /api/fixtures/:fixtureId/play

All mutation routes require authentication and ownership checks. Money and match results are calculated server-side. Transfers and match settlement use database transactions and row locks.

## Configuration notes
- Starting budget defaults to 0 UZS because the owner has not approved an opening amount.
- Starting squad size defaults to 18 as a provisional implementation setting, not a frozen game-design decision.
- Player ratings, attribute costs, transfer values, match probabilities and mission rewards are initial balancing defaults and should be tuned after playtesting.
- The league is created only after at least 10 clubs exist. League size and season format are provisionally set to a 10-club round-robin.
- This is a deployment candidate, not production-approved. Security review, backups, rate limiting, monitoring, load testing and cloud configuration remain required before launch.
