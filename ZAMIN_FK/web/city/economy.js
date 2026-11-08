// ZAMIN FK economy: coins (🪙) earned slowly by roleplay jobs + a daily bonus, spent on house upgrades and cars.
// Everything is decided on the server: the client only shows what the server allows, so nobody can earn faster.
const crypto = require("crypto");

// ---------- catalogue (prices in coins) ----------
// A full day of work (3 shifts) pays ~400 🪙; the 7th level takes about two months of daily play.
const UPGRADE_COST = [0, 0, 300, 700, 1500, 3000, 6000, 12000];      // cost to reach level i
const CARS = [null,
  { id: 1, name: "Mini-furgon", price: 400, color: 0xf2f2f2 },
  { id: 2, name: "Sedan", price: 1200, color: 0xb8bcc2 },
  { id: 3, name: "Krossover", price: 2500, color: 0x2a4f8a },
  { id: 4, name: "Biznes sedan", price: 8000, color: 0x1d1f24 },
  { id: 5, name: "Sport xetchbek", price: 3500, color: 0x2e9e4f },
  { id: 6, name: "Sport sedan", price: 5000, color: 0xd94848 },
  { id: 7, name: "Taksi", price: 1500, color: 0xf2c230 },
  { id: 8, name: "Xetchbek", price: 900, color: 0xd93030 },
  { id: 9, name: "Politsiya", price: 6000, color: 0x1d1f24 },
  { id: 10, name: "Klassik sedan", price: 1800, color: 0x2a4f8a },
  { id: 11, name: "Universal", price: 2200, color: 0x2e8b3c },
  { id: 12, name: "Sariq taksi", price: 1600, color: 0xf2c230 },
];
const JOBS = {
  coffee: {
    id: "coffee", name: "Kofexona sotuvchisi", place: "Zamin Kofe",
    menu: ["☕ Kofe", "🍵 Choy", "🥐 Kruassan", "🍰 Tort"],
    shiftSec: 480,            // 8-minute shift
    everySec: 25,             // a customer roughly every 25-35 s (≈ 16 per shift)
    jitterSec: 10,
    patienceSec: 45,          // a customer leaves after waiting this long
    pay: 5, tipFast: 3, tipSlow: 1, fastSec: 15,
    minGapSec: 2,             // no machine-gun serving
    shiftsPerDay: 3,
  },
};
const BONUS = streak => Math.min(50, 20 + 5 * Math.max(0, streak - 1));   // 20, 25, 30 ... up to 50 a day
const MAX_LEVEL = 7;

// Deterministic per-shift customers (same function runs in the browser to draw the queue)
function h32(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function customer(job, seed, k) {
  const r = h32(`${seed}:${k}`);
  return { k, at: k * job.everySec + (r % (job.jitterSec + 1)), order: (r >>> 8) % job.menu.length, face: (r >>> 16) % 12 };
}
const tashkentDay = (t = Date.now()) => new Date(t + 5 * 3600e3).toISOString().slice(0, 10);

function init({ app, db, mem, auth, ensureSeat, ready }) {
  mem.wallets = mem.wallets || new Map(); mem.shifts = mem.shifts || []; mem.ledger = mem.ledger || [];
  const econReady = !db ? Promise.resolve() : ready().then(() => db.query(`
    create table if not exists wallets (tg_id bigint primary key, coins int not null default 0, streak int not null default 0,
      last_bonus date, earned int not null default 0, updated_at timestamptz not null default now());
    create table if not exists shifts (id bigserial primary key, tg_id bigint not null, job text not null, seed int not null,
      started_at timestamptz not null default now(), served jsonb not null default '[]', earned int not null default 0, last_serve_at timestamptz);
    create index if not exists shifts_user_idx on shifts (tg_id, started_at desc);
    create table if not exists ledger (id bigserial primary key, tg_id bigint not null, delta int not null, reason text not null, at timestamptz not null default now());`)).catch(e => console.error("economy db init", e.message));
  mem.econReady = econReady;

  // Run fn on one user's state inside a transaction (row locks) — or a per-user lock in memory mode.
  const locks = new Map();
  async function withUser(tgId, fn) {
    const now = Date.now(), day = tashkentDay(now);
    if (!db) {
      const prev = locks.get(tgId) || Promise.resolve(); let release; const p = new Promise(r => release = r); locks.set(tgId, prev.then(() => p));
      await prev;
      try {
        if (!mem.wallets.has(tgId)) mem.wallets.set(tgId, { coins: 0, streak: 0, last_bonus: null, earned: 0 });
        const home = mem.homes.find(h => String(h.tg_id) === tgId) || null;
        const mine = mem.shifts.filter(s => s.tg_id === tgId);
        const ctx = { now, day, w: mem.wallets.get(tgId), home, shift: mine[mine.length - 1] || null,
          shiftsToday: mine.filter(s => tashkentDay(s.started_at) === day).length, log: [] };
        const out = await fn(ctx);
        if (ctx.newShift) { ctx.newShift.id = mem.shifts.length + 1; ctx.newShift.tg_id = tgId; mem.shifts.push(ctx.newShift); ctx.shift = ctx.newShift; }
        ctx.log.forEach(l => mem.ledger.push({ tg_id: tgId, ...l }));
        if (ctx.newShift && out && out.shift) out.shift.id = ctx.newShift.id;
        return out;
      } finally { release(); }
    }
    const c = await db.connect();
    try {
      await c.query("begin");
      await c.query("insert into wallets (tg_id) values ($1) on conflict do nothing", [tgId]);
      const w = (await c.query("select coins, streak, to_char(last_bonus, 'YYYY-MM-DD') as last_bonus, earned from wallets where tg_id = $1 for update", [tgId])).rows[0];
      const home = (await c.query("select tg_id, level, car, profession from homes where tg_id = $1 for update", [tgId])).rows[0] || null;
      const shiftRow = (await c.query("select id, job, seed, started_at, served, earned, last_serve_at from shifts where tg_id = $1 order by id desc limit 1 for update", [tgId])).rows[0] || null;
      const shift = shiftRow && { ...shiftRow, id: Number(shiftRow.id), started_at: new Date(shiftRow.started_at).getTime(), last_serve_at: shiftRow.last_serve_at && new Date(shiftRow.last_serve_at).getTime() };
      const cnt = (await c.query("select count(*)::int as n from shifts where tg_id = $1 and (started_at at time zone 'Asia/Tashkent')::date = $2::date", [tgId, day])).rows[0].n;
      const before = JSON.stringify([w, home, shift]);
      const ctx = { now, day, w, home, shift, shiftsToday: cnt, log: [] };
      const out = await fn(ctx);
      if (JSON.stringify([w, home, shift]) !== before || ctx.newShift || ctx.log.length) {
        await c.query("update wallets set coins = $2, streak = $3, last_bonus = $4, earned = $5, updated_at = now() where tg_id = $1", [tgId, w.coins, w.streak, w.last_bonus, w.earned]);
        if (home) await c.query("update homes set level = $2, car = $3, updated_at = now() where tg_id = $1", [tgId, home.level, home.car]);
        if (shift && !ctx.newShift) await c.query("update shifts set served = $2, earned = $3, last_serve_at = to_timestamp($4 / 1000.0) where id = $1",
          [shift.id, JSON.stringify(shift.served), shift.earned, shift.last_serve_at || null]);
        if (ctx.newShift) { const r = await c.query("insert into shifts (tg_id, job, seed, started_at) values ($1,$2,$3,to_timestamp($4 / 1000.0)) returning id", [tgId, ctx.newShift.job, ctx.newShift.seed, ctx.newShift.started_at]);
          ctx.newShift.id = Number(r.rows[0].id); ctx.shift = ctx.newShift; }
        for (const l of ctx.log) await c.query("insert into ledger (tg_id, delta, reason) values ($1,$2,$3)", [tgId, l.delta, l.reason]);
      }
      await c.query("commit");
      if (ctx.newShift && out && out.shift) out.shift.id = ctx.newShift.id;
      return out;
    } catch (e) { await c.query("rollback").catch(() => {}); throw e; } finally { c.release(); }
  }
  const fail = (status, error, extra) => Object.assign(new Error(error), { status, extra });
  const pay = (ctx, delta, reason) => { ctx.w.coins += delta; if (delta > 0) ctx.w.earned += delta; ctx.log.push({ delta, reason }); };
  const activeShift = ctx => { const s = ctx.shift, job = s && JOBS[s.job]; return s && job && ctx.now < s.started_at + job.shiftSec * 1000 ? s : null; };
  const yesterday = day => new Date(new Date(day + "T00:00:00Z").getTime() - 864e5).toISOString().slice(0, 10);
  function view(ctx) {
    const s = activeShift(ctx);
    return {
      coins: ctx.w.coins, streak: ctx.w.streak, earned: ctx.w.earned,
      bonus: ctx.w.last_bonus === ctx.day ? 0 : BONUS(ctx.w.last_bonus === yesterday(ctx.day) ? ctx.w.streak + 1 : 1),
      home: ctx.home && { level: ctx.home.level, car: ctx.home.car || 0 },
      shiftsToday: ctx.shiftsToday, serverNow: ctx.now,
      shift: s && { id: s.id, job: s.job, seed: s.seed, started: s.started_at, served: s.served, earned: s.earned },
      catalog: { upgrade: UPGRADE_COST, cars: CARS.filter(Boolean), jobs: Object.values(JOBS), maxLevel: MAX_LEVEL },
    };
  }
  const route = (path, fn) => app.post(path, async (req, res) => {
    const user = auth(req, res); if (!user) return;
    try { res.json(await withUser(String(user.id), ctx => fn(ctx, req.body || {}, user))); }
    catch (e) { if (e.status) return res.status(e.status).json({ error: e.message, ...(e.extra || {}) }); console.error(e); res.status(500).json({ error: "server" }); }
  });

  route("/api/me", ctx => view(ctx));

  route("/api/bonus", ctx => {
    if (ctx.w.last_bonus === ctx.day) throw fail(409, "already");
    ctx.w.streak = ctx.w.last_bonus === yesterday(ctx.day) ? ctx.w.streak + 1 : 1;
    ctx.w.last_bonus = ctx.day;
    const amount = BONUS(ctx.w.streak); pay(ctx, amount, "bonus");
    return { ...view(ctx), got: amount };
  });

  route("/api/home/upgrade", ctx => {
    if (!ctx.home) throw fail(404, "no home");
    if (ctx.home.level >= MAX_LEVEL) throw fail(409, "max");
    const cost = UPGRADE_COST[ctx.home.level + 1];
    if (ctx.w.coins < cost) throw fail(402, "coins", { need: cost });
    pay(ctx, -cost, "upgrade:" + (ctx.home.level + 1)); ctx.home.level++;
    return { ...view(ctx), level: ctx.home.level };
  });

  route("/api/buy", (ctx, body) => {
    if (body.item !== "car") throw fail(400, "item");
    const car = CARS[Number(body.id)];
    if (!car) throw fail(400, "car");
    if (!ctx.home) throw fail(404, "no home");                       // the car is parked at your house
    if ((ctx.home.car || 0) === car.id) throw fail(409, "owned");
    if (ctx.w.coins < car.price) throw fail(402, "coins", { need: car.price });
    pay(ctx, -car.price, "car:" + car.id); ctx.home.car = car.id;
    return view(ctx);
  });

  route("/api/job/start", (ctx, body) => {
    const job = JOBS[body.job]; if (!job) throw fail(400, "job");
    if (!ctx.home) throw fail(404, "no home");                       // residents only
    if (!ctx.home.profession) throw fail(403, "profession");         // must have approved profession
    if (activeShift(ctx)) return view(ctx);
    if (ctx.shiftsToday >= job.shiftsPerDay) throw fail(429, "tired");
    ctx.newShift = { job: job.id, seed: crypto.randomInt(1, 2 ** 31 - 1), started_at: ctx.now, served: [], earned: 0, last_serve_at: null };
    ctx.shift = ctx.newShift; ctx.shiftsToday++;
    return view(ctx);
  });

  route("/api/job/serve", (ctx, body) => {
    const s = activeShift(ctx); if (!s || s.id !== Number(body.shift)) throw fail(409, "no shift");
    const job = JOBS[s.job], k = Number(body.k), item = Number(body.item);
    if (!Number.isInteger(k) || k < 0 || k > 200 || s.served.includes(k)) throw fail(409, "gone");
    if (s.last_serve_at && ctx.now - s.last_serve_at < job.minGapSec * 1000) throw fail(429, "slow down");
    const c = customer(job, s.seed, k), waited = (ctx.now - s.started_at) / 1000 - c.at;
    if (waited < 0) throw fail(409, "not here");
    if (waited > job.patienceSec) throw fail(409, "left");
    s.last_serve_at = ctx.now;
    if (item !== c.order) { s.served = [...s.served, k]; return { ...view(ctx), wrong: true, got: 0 }; }   // wrong order: customer leaves unhappy
    const got = job.pay + (waited <= job.fastSec ? job.tipFast : job.tipSlow);
    s.served = [...s.served, k]; s.earned += got; pay(ctx, got, "job:" + job.id);
    return { ...view(ctx), got };
  });
}

module.exports = { init, customer, h32, JOBS, CARS, UPGRADE_COST };
