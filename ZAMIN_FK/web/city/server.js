// ZAMIN FK: one page (stadium + city) for every entrance, plus the Telegram Mini App API on Postgres (Neon).
//   Instagram/web  -> https://zaminfk.onrender.com (static build of the same page) opens on the stadium
//   Telegram       -> this server, opens on the city: take a seat, build a home, apply for work
const express = require("express");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const MINIAPP_URL = process.env.MINIAPP_URL || "";          // e.g. https://t.me/<bot>/<app> — shown to web visitors
const PAGE = path.join(__dirname, "..", "stadium", "dist", "index.html");
const DIST = path.dirname(PAGE);

// Verify frontend files exist and are valid
const pageExists = fs.existsSync(PAGE);
let pageSize = 0, pageHasThree = false, pageHasCanvas = false;
if (pageExists) {
  const content = fs.readFileSync(PAGE, 'utf8');
  pageSize = content.length;
  pageHasThree = content.includes('three.min.js');
  pageHasCanvas = content.includes('id="c"');
}
if (!pageExists) console.warn("⚠️  Frontend not found at", PAGE);
else console.log(`✓ Frontend ${pageSize} bytes, THREE.js:${pageHasThree}, canvas:${pageHasCanvas}`);
const COLORS = 6, MAX_LEVEL = 7;
const ROLES = ["Quruvchi (3D)", "Dizayner", "Video montaj", "SMM", "Dasturchi", "Boshqa"];
const app = express();
app.use(express.json({ limit: "256kb" }));

// Request logging for debugging frontend issues
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    if (req.path === '/' || req.path === '/index.html' || status >= 400) {
      console.log(`${status} ${req.method} ${req.path} (${ms}ms)`);
    }
  });
  next();
});

const bot = require("./bot");
bot.mount(app);                                            // Telegram webhook: /start -> welcome + Mini App button

// --- storage: Postgres when DATABASE_URL is set, otherwise memory (local testing only)
let db = null, DB_READY = Promise.resolve();
const mem = { homes: [], seats: [], apps: [] };
if (process.env.DATABASE_URL) {
  const { Pool } = require("pg");
  let connStr = process.env.DATABASE_URL;
  if (process.env.PGSSL !== "off") {
    const url = new URL(connStr);
    if (!url.searchParams.has("sslmode")) url.searchParams.set("sslmode", "require");
    connStr = url.toString();
  }
  db = new Pool({ connectionString: connStr, ssl: process.env.PGSSL === "off" ? false : { rejectUnauthorized: false } });
  DB_READY = db.query(`
    create table if not exists homes (
      tg_id bigint primary key, nick text not null, style int not null, color int not null,
      created_at timestamptz not null default now(), updated_at timestamptz not null default now());
    alter table homes add column if not exists level int not null default 1;
    alter table homes add column if not exists upgraded_at timestamptz;
    alter table homes alter column style set default 0;
    alter table homes add column if not exists lot int;
    alter table homes add column if not exists car int not null default 0;
    create unique index if not exists homes_lot_key on homes (lot) where lot is not null;
    create table if not exists seats (
      tg_id bigint primary key, nick text not null, tg_username text, instagram text unique,
      created_at timestamptz not null default now(), updated_at timestamptz not null default now());
    create table if not exists applications (
      id bigserial primary key, tg_id bigint not null, nick text not null, role text not null, note text,
      created_at timestamptz not null default now());`)
    .catch(e => console.error("db init", e.message));
  bot.initFeedback(db);
}
const q = (sql, args) => db.query(sql, args).then(r => r.rows);
async function listHomes() {
  if (!db) return mem.homes.slice().sort((a, b) => a.created_at - b.created_at);
  return q("select tg_id, nick, style, color, level, lot, car, coalesce(upgraded_at, created_at) as up, created_at from homes order by created_at, tg_id");
}
async function listSeats() {
  if (!db) return mem.seats.slice();
  return q("select tg_id, nick, tg_username, instagram, seat_no from seats order by created_at, tg_id");
}
function memUpsert(list, row) {
  const i = list.findIndex(x => String(x.tg_id) === String(row.tg_id));
  if (i >= 0) Object.assign(list[i], row); else list.push({ ...row, created_at: Date.now() });
}

// --- Telegram initData check (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app)
function checkInitData(initData) {
  if (!BOT_TOKEN || !initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");
  const dataCheck = [...params.entries()].map(([k, v]) => `${k}=${v}`).sort().join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const calc = crypto.createHmac("sha256", secret).update(dataCheck).digest("hex");
  if (calc.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(hash))) return null;
  const authDate = Number(params.get("auth_date") || 0);
  if (Date.now() / 1000 - authDate > 86400) return null;            // older than a day
  try { return JSON.parse(params.get("user") || "null"); } catch { return null; }
}
const auth = (req, res) => {
  const user = checkInitData(req.body && req.body.initData);
  if (!user || !user.id) { res.status(401).json({ error: "telegram" }); return null; }
  return user;
};
const nickOf = user => (user.username ? "@" + user.username : (user.first_name || "Muxlis")).slice(0, 32);

// The static stadium site (another origin) reads state; writes only come from the Mini App on this origin.
app.use("/api/state", (req, res, next) => { res.set("Access-Control-Allow-Origin", "*"); next(); });
app.get("/api/state", async (req, res) => {
  try {
    const [homes, seats] = await Promise.all([listHomes(), listSeats()]);
    res.set("Cache-Control", "no-store");
    res.json({
      miniapp: MINIAPP_URL || (bot.info.username ? "https://t.me/" + bot.info.username : ""),
      maxLevel: MAX_LEVEL,
      homes: homes.map(homeOut),
      seats: seats.map(s => ({ tg_id: String(s.tg_id), nick: s.nick.replace(/^@/, ""), tg_username: s.tg_username, instagram: s.instagram, seat_no: s.seat_no ?? null })),
      club: await CLUB.summary().catch(() => null),
    });
  } catch (e) { console.error(e); res.status(500).json({ error: "server" }); }
});
app.get("/api/homes", async (req, res) => {             // kept for older clients
  try { const rows = await listHomes(); res.json(rows.map(homeOut)); }
  catch (e) { console.error(e); res.status(500).json({ error: "server" }); }
});

const homeOut = (r, i) => ({ id: String(r.tg_id), nick: r.nick, style: r.style || 0, color: r.color, level: r.level || 1, lot: r.lot == null ? null : r.lot, car: r.car || 0,
  up: new Date(r.up || r.created_at).toISOString(), n: i + 1 });
async function ensureSeat(user) {                          // every house owner is also a club member with a permanent seat
  const nick = nickOf(user), tgu = user.username || null;
  if (!db) { if (!mem.seats.some(s => String(s.tg_id) === String(user.id))) memUpsert(mem.seats, { tg_id: user.id, nick, tg_username: tgu, instagram: null }); return; }
  await CLUB.ensureMember(user);
}

// Claim my house (starts as a 1-floor house) or change its colour. Also gives a stadium seat.
app.post("/api/home", async (req, res) => {
  const user = auth(req, res); if (!user) return;
  const color = Number(req.body.color);
  if (!Number.isInteger(color) || color < 0 || color >= COLORS) return res.status(400).json({ error: "bad choice" });
  const lot = req.body.lot == null ? null : Number(req.body.lot);           // chosen empty lot on the map
  const style = req.body.style == null ? 0 : Number(req.body.style);       // 0 built-in house, 1..29 model
  if (!Number.isInteger(style) || style < 0 || style > 29) return res.status(400).json({ error: "style" });
  if (lot !== null && (!Number.isInteger(lot) || lot < 0 || lot > 1e6)) return res.status(400).json({ error: "lot" });
  const nick = nickOf(user);
  try {
    if (!db) { const ex = mem.homes.find(h => String(h.tg_id) === String(user.id));
      if (lot !== null && mem.homes.some(h => h.lot === lot && h !== ex)) return res.status(409).json({ error: "taken" });
      if (ex) Object.assign(ex, { nick, color, style, lot: ex.lot ?? lot }); else mem.homes.push({ tg_id: user.id, nick, style, color, level: 1, car: 0, lot, up: Date.now(), created_at: Date.now() }); }
    else {
      try {
        await q(`insert into homes (tg_id, nick, style, color, level, lot) values ($1,$2,$5,$3,1,$4)
          on conflict (tg_id) do update set nick = excluded.nick, color = excluded.color, style = excluded.style, lot = coalesce(homes.lot, excluded.lot), updated_at = now()`, [user.id, nick, color, lot, style]);
      } catch (e) { if (e.code === "23505") return res.status(409).json({ error: "taken" }); throw e; }
    }
    await ensureSeat(user);
    res.json({ ok: true, nick });
  } catch (e) { console.error(e); res.status(500).json({ error: "server" }); }
});

// Coins, jobs, house upgrades and cars live in economy.js (server-authoritative).
require("./economy").init({ app, db, mem, auth, ensureSeat, ready: () => DB_READY });
// Supporter Portal: membership, permanent seats, Fan XP, departments, missions, referrals, admin (club.js)
const CLUB = require("./club").init({ app, db, auth, bot, nickOf, ready: () => Promise.all([DB_READY, mem.econReady]) });

// One stadium seat per Telegram user. An Instagram nick links the seat to that follower (first claim wins).
app.post("/api/seat", async (req, res) => {
  const user = auth(req, res); if (!user) return;
  const ig = String(req.body.instagram || "").trim().toLowerCase().replace(/^@/, "") || null;
  if (ig && !/^[a-z0-9._]{1,30}$/.test(ig)) return res.status(400).json({ error: "instagram" });
  const nick = nickOf(user), tgu = user.username || null;
  try {
    if (!db) {
      if (ig && mem.seats.some(s => s.instagram === ig && String(s.tg_id) !== String(user.id))) return res.status(409).json({ error: "taken" });
      memUpsert(mem.seats, { tg_id: user.id, nick, tg_username: tgu, instagram: ig });
    } else {
      const taken = ig ? await q("select tg_id from seats where instagram = $1 and tg_id <> $2", [ig, user.id]) : [];
      if (taken.length) return res.status(409).json({ error: "taken" });
      await q(`insert into seats (tg_id, nick, tg_username, instagram) values ($1,$2,$3,$4)
        on conflict (tg_id) do update set nick = excluded.nick, tg_username = excluded.tg_username,
          instagram = coalesce(excluded.instagram, seats.instagram), updated_at = now()`, [user.id, nick, tgu, ig]);
    }
    res.json({ ok: true, nick: ig || nick.replace(/^@/, "") });
  } catch (e) { console.error(e); res.status(500).json({ error: "server" }); }
});

app.get("/healthz", (req, res) => res.send("ok"));
app.get("/debug", (req, res) => res.json({
  frontend: { file: PAGE, exists: pageExists, dist: DIST },
  models: fs.existsSync(path.join(DIST, "models")),
  vendor: fs.existsSync(path.join(DIST, "vendor")),
  map: fs.existsSync(path.join(DIST, "map"))
}));
app.get(["/", "/index.html"], (req, res) => {
  res.set("Cache-Control", "no-cache");
  if (!pageExists) return res.status(500).send("<h1>Frontend not built</h1><p>dist/index.html missing. Run: cd web/stadium && python3 build.py fans_instagram.json</p>");
  res.sendFile(PAGE, (err) => err && console.error("sendFile error:", err.message));
});
// Static assets with error tracking
const serveStatic = (route, dir, maxAge = "1d") => {
  app.use(route, (req, res, next) => {
    const file = path.join(dir, req.path);
    if (!fs.existsSync(file) && !fs.existsSync(file + '/')) {
      console.warn(`404 ${route}${req.path} - file not in`, dir);
    }
    next();
  }, express.static(dir, { maxAge }));
};
serveStatic("/models", path.join(DIST, "models"));
serveStatic("/vendor", path.join(DIST, "vendor"));
serveStatic("/map", path.join(DIST, "map"));
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🌍 ZAMIN FK City Server Ready");
  console.log("=".repeat(60));
  console.log(`📡 Port: ${port}`);
  console.log(`📂 Root: ${process.cwd()}`);
  console.log(`📄 Frontend: ${PAGE}`);
  console.log(`   Size: ${pageSize} bytes`);
  console.log(`   THREE.js: ${pageHasThree ? "✓" : "❌"}`);
  console.log(`   Canvas: ${pageHasCanvas ? "✓" : "❌"}`);
  console.log(`💾 Database: ${db ? "Postgres ✓" : "Memory"}`);
  console.log(`🤖 Bot: ${BOT_TOKEN ? "Configured ✓" : "❌ NO BOT_TOKEN"}`);
  console.log(`📁 Assets:`);
  console.log(`   /models: ${fs.existsSync(path.join(DIST, "models")) ? "✓" : "❌"}`);
  console.log(`   /vendor: ${fs.existsSync(path.join(DIST, "vendor")) ? "✓" : "❌"}`);
  console.log(`   /map: ${fs.existsSync(path.join(DIST, "map")) ? "✓" : "❌"}`);
  console.log(`🔍 Debug: https://zaminfk-city.onrender.com/debug`);
  console.log("=".repeat(60) + "\n");
  bot.setup().catch(e => console.error("bot setup", e.message));
});
