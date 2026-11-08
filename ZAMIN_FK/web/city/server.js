// ZAMIN FK: one page (stadium + city) for every entrance, plus the Telegram Mini App API on Postgres (Neon).
//   Instagram/web  -> https://zaminfk.onrender.com (static build of the same page) opens on the stadium
//   Telegram       -> this server, opens on the city: take a seat, build a home, apply for work
const express = require("express");
const crypto = require("crypto");
const path = require("path");

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const MINIAPP_URL = process.env.MINIAPP_URL || "";          // e.g. https://t.me/<bot>/<app> — shown to web visitors
const PAGE = path.join(__dirname, "..", "stadium", "dist", "index.html");
const COLORS = 6, MAX_LEVEL = 7;
const ROLES = ["Quruvchi (3D)", "Dizayner", "Video montaj", "SMM", "Dasturchi", "Boshqa"];
const app = express();
app.use(express.json({ limit: "256kb" }));
const bot = require("./bot");
bot.mount(app);                                            // Telegram webhook: /start -> welcome + Mini App button

// --- storage: Postgres when DATABASE_URL is set, otherwise memory (local testing only)
let db = null, DB_READY = Promise.resolve();
const mem = { homes: [], seats: [], apps: [] };
if (process.env.DATABASE_URL) {
  const { Pool } = require("pg");
  db = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === "off" ? false : { rejectUnauthorized: false } });
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
  if (lot !== null && (!Number.isInteger(lot) || lot < 0 || lot > 1e6)) return res.status(400).json({ error: "lot" });
  const nick = nickOf(user);
  try {
    if (!db) { const ex = mem.homes.find(h => String(h.tg_id) === String(user.id));
      if (lot !== null && mem.homes.some(h => h.lot === lot && h !== ex)) return res.status(409).json({ error: "taken" });
      if (ex) Object.assign(ex, { nick, color, lot: ex.lot ?? lot }); else mem.homes.push({ tg_id: user.id, nick, style: 0, color, level: 1, car: 0, lot, up: Date.now(), created_at: Date.now() }); }
    else {
      try {
        await q(`insert into homes (tg_id, nick, style, color, level, lot) values ($1,$2,0,$3,1,$4)
          on conflict (tg_id) do update set nick = excluded.nick, color = excluded.color, lot = coalesce(homes.lot, excluded.lot), updated_at = now()`, [user.id, nick, color, lot]);
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
app.get(["/", "/index.html"], (req, res) => { res.set("Cache-Control", "no-cache"); res.sendFile(PAGE); });
app.use("/map", express.static(path.join(path.dirname(PAGE), "map"), { maxAge: "1d" }));   // real-town OpenStreetMap data
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("zamin fk on", port, db ? "postgres" : "memory", BOT_TOKEN ? "bot ok" : "NO BOT_TOKEN");
  bot.setup().catch(e => console.error("bot setup", e.message));
});
