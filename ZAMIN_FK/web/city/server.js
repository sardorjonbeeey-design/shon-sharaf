// ZAMIN FK city: Telegram Mini App backend. Anyone who opens the app can build one home.
const express = require("express");
const crypto = require("crypto");
const path = require("path");

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const STYLES = 4, COLORS = 6;
const app = express();
app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname, "public"), { maxAge: "5m" }));

// --- storage: Postgres when DATABASE_URL is set, otherwise memory (local testing only)
let db = null;
const mem = [];
if (process.env.DATABASE_URL) {
  const { Pool } = require("pg");
  db = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === "off" ? false : { rejectUnauthorized: false } });
  db.query(`create table if not exists homes (
      tg_id bigint primary key, nick text not null, style int not null, color int not null,
      created_at timestamptz not null default now(), updated_at timestamptz not null default now())`)
    .catch(e => console.error("db init", e.message));
}
async function listHomes() {
  if (!db) return mem.slice().sort((a, b) => a.created_at - b.created_at);
  const r = await db.query("select tg_id, nick, style, color, created_at from homes order by created_at, tg_id");
  return r.rows;
}
async function upsertHome(h) {
  if (!db) {
    const i = mem.findIndex(x => String(x.tg_id) === String(h.tg_id));
    if (i >= 0) Object.assign(mem[i], h); else mem.push({ ...h, created_at: Date.now() });
    return;
  }
  await db.query(`insert into homes (tg_id, nick, style, color) values ($1,$2,$3,$4)
    on conflict (tg_id) do update set nick = excluded.nick, style = excluded.style, color = excluded.color, updated_at = now()`,
    [h.tg_id, h.nick, h.style, h.color]);
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

app.get("/api/homes", async (req, res) => {
  try {
    const rows = await listHomes();
    res.set("Cache-Control", "no-store");
    res.json(rows.map((r, i) => ({ id: String(r.tg_id), nick: r.nick, style: r.style, color: r.color, n: i + 1 })));
  } catch (e) { console.error(e); res.status(500).json({ error: "server" }); }
});

app.post("/api/home", async (req, res) => {
  const user = checkInitData(req.body && req.body.initData);
  if (!user || !user.id) return res.status(401).json({ error: "telegram" });
  const style = Number(req.body.style), color = Number(req.body.color);
  if (!Number.isInteger(style) || style < 0 || style >= STYLES || !Number.isInteger(color) || color < 0 || color >= COLORS)
    return res.status(400).json({ error: "bad choice" });
  const nick = (user.username ? "@" + user.username : (user.first_name || "Muxlis")).slice(0, 32);
  try { await upsertHome({ tg_id: user.id, nick, style, color }); res.json({ ok: true, nick }); }
  catch (e) { console.error(e); res.status(500).json({ error: "server" }); }
});

app.get("/healthz", (req, res) => res.send("ok"));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("city on", port, db ? "postgres" : "memory", BOT_TOKEN ? "bot ok" : "NO BOT_TOKEN"));
