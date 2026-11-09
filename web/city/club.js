// ZAMIN FK Supporter Portal: membership card, permanent stadium seat, Fan XP, departments, contributions,
// missions, referrals, club dashboard and admin controls. Server-authoritative; Postgres only.
//
// Four separate values (never converted into each other except the explicit, logged donation):
//   coins      — personal money (wallets, economy.js)
//   Fan XP     — personal supporter progress (members.xp)
//   Influence  — personal standing inside the club / departments (members.influence)
//   Club Funds — the club's shared money (club.funds), raised by donations and approved contributions
const crypto = require("crypto");

const TIERS = [["🟢", "Havaskor", 0], ["🥉", "Bronza", 100], ["🥈", "Kumush", 400], ["🥇", "Oltin", 1200], ["💎", "Platina", 3000], ["👑", "Afsona", 8000]];
const tierOf = xp => { let i = 0; TIERS.forEach((t, k) => { if (xp >= t[2]) i = k; }); return { i, emoji: TIERS[i][0], name: TIERS[i][1], next: TIERS[i + 1] ? TIERS[i + 1][2] : null, from: TIERS[i][2] }; };
const DEPTS = [
  ["fan", "📣", "Muxlislar jamoasi", "Uchrashuvlar, bannerlar, qo‘shiqlar va yangi muxlislarni jalb qilish."],
  ["media", "🎬", "Media", "Videolar, postlar, dizayn va fotosuratlar."],
  ["scouting", "🔭", "Skauting", "Iqtidorli futbolchilarni topish va raqiblarni tahlil qilish."],
  ["stadium", "🏟", "Stadion", "Stadion va shahar infratuzilmasi g‘oyalari."],
  ["academy", "🎓", "Akademiya", "Yosh futbolchilar va mashg‘ulot g‘oyalari."],
];
const KINDS = {
  fan: ["Muxlislar uchrashuvi", "Banner yoki qo‘shiq g‘oyasi", "Yangi muxlis jalb qilish"],
  media: ["Video yoki montaj", "Post yoki dizayn", "Fotosurat"],
  scouting: ["O‘yinchi tavsiyasi", "Raqib tahlili"],
  stadium: ["Stadion g‘oyasi", "Shahar loyihasi"],
  academy: ["Mashg‘ulot g‘oyasi", "Yosh futbolchi tavsiyasi"],
};
const MISSION_SEED = [
  ["Kunlik tashrif — ilovaga kiring", "daily", "checkin", 1, 10],
  ["10 ta mijozga xizmat qiling", "daily", "serves", 10, 25],
  ["Klub fondiga 50 🪙 xayriya qiling", "daily", "donation", 50, 20],
  ["Haftada 5 ta to‘liq smena", "weekly", "shifts", 5, 80],
  ["Bo‘limga hissa qo‘shing (tasdiqlangan)", "weekly", "contribution", 1, 100],
  ["Do‘stingizni taklif qiling (faol bo‘lsa)", "weekly", "referral", 1, 150],
];
const ACTIONS = ["checkin", "serves", "shifts", "contribution", "referral", "donation"];
const MILESTONES = {
  supporters: [[25, "Fan-zona ochiladi"], [100, "Yangi tribuna"], [250, "Ikkinchi LED ekran"], [500, "Klub muzeyi"], [1000, "Akademiya binosi"]],
  funds: [[1000, "Yangi forma"], [5000, "Klub avtobusi"], [20000, "Sun’iy maydon"], [100000, "Yopiq tribuna"]],
};
const DEPT_LEVELS = [0, 150, 1000];          // department influence needed for HQ level 1 and 2
const DONATE_MIN = 10, DONATE_DAY_MAX = 500, DONATE_XP_DAY_MAX = 50;
const SHIFT_DONE = 5;                         // a shift with 5+ customers served counts as completed

const tashkentDay = (t = Date.now()) => new Date(t + 5 * 3600e3).toISOString().slice(0, 10);
const weekStart = day => { const d = new Date(day + "T00:00:00Z"), w = (d.getUTCDay() + 6) % 7; return new Date(d.getTime() - w * 864e5).toISOString().slice(0, 10); };
const tkStart = day => day + "T00:00:00+05:00";
const supporterId = no => "ZFK-" + String(no).padStart(5, "0");

function init({ app, db, auth, bot, nickOf, ready: base }) {
  let cache = null, cacheAt = 0;
  const ADMINS = new Set(String(process.env.ADMIN_IDS || "").split(/[\s,]+/).filter(Boolean));
  const isAdmin = id => ADMINS.has(String(id));
  if (!db) {                                  // memory mode (local only): portal disabled, everything else keeps working
    app.use(["/api/club", "/api/admin"], (req, res) => res.status(503).json({ error: "club needs database" }));
    return { ensureMember: async () => null, summary: async () => null, registerReferral: async () => {} };
  }
  const ready = base().then(() => db.query(`
    create table if not exists members (tg_id bigint primary key, member_no serial unique, nick text not null, tg_username text,
      joined_at timestamptz not null default now(), xp int not null default 0, influence int not null default 0,
      dept text, dept_at timestamptz, ref_code text unique);
    alter table seats add column if not exists seat_no int;
    create unique index if not exists seats_seat_no_key on seats (seat_no) where seat_no is not null;
    create table if not exists departments (id text primary key, emoji text not null, name text not null, description text not null default '',
      active boolean not null default true, sort int not null default 0);
    create table if not exists contributions (id bigserial primary key, tg_id bigint not null, dept text not null, kind text not null, body text not null,
      link text, status text not null default 'pending', xp int not null default 0, influence int not null default 0, funds int not null default 0,
      note text, created_at timestamptz not null default now(), decided_at timestamptz, decided_by bigint);
    create index if not exists contributions_status_idx on contributions (status, created_at);
    create table if not exists missions (id serial primary key, title text not null, period text not null check (period in ('daily','weekly')),
      action text not null, target int not null default 1, xp int not null, active boolean not null default true, sort int not null default 0);
    create table if not exists mission_claims (tg_id bigint not null, mission_id int not null, period_key text not null, xp int not null,
      at timestamptz not null default now(), primary key (tg_id, mission_id, period_key));
    create table if not exists referrals (referred_tg bigint primary key, referrer_tg bigint not null, created_at timestamptz not null default now(),
      qualified_at timestamptz, rewarded boolean not null default false);
    create table if not exists xp_log (id bigserial primary key, tg_id bigint not null, xp int not null default 0, influence int not null default 0,
      reason text not null, at timestamptz not null default now());
    create index if not exists xp_log_user_idx on xp_log (tg_id, at desc);
    create table if not exists club (id int primary key default 1 check (id = 1), funds bigint not null default 0);
    insert into club (id) values (1) on conflict do nothing;
    create table if not exists club_funds_log (id bigserial primary key, amount int not null, source text not null, tg_id bigint, at timestamptz not null default now());
  `)).then(async () => {
    for (const [i, [id, emoji, name, desc]] of DEPTS.entries())
      await db.query("insert into departments (id, emoji, name, description, sort) values ($1,$2,$3,$4,$5) on conflict (id) do nothing", [id, emoji, name, desc, i]);
    const n = (await db.query("select count(*)::int as n from missions")).rows[0].n;
    if (!n) for (const [i, m] of MISSION_SEED.entries()) await db.query("insert into missions (title, period, action, target, xp, sort) values ($1,$2,$3,$4,$5,$6)", [...m, i]);
  }).catch(e => console.error("club db init", e.message));

  async function tx(fn) {
    await ready; const c = await db.connect();
    try { await c.query("begin"); const out = await fn(c); await c.query("commit"); return out; }
    catch (e) { await c.query("rollback").catch(() => {}); throw e; } finally { c.release(); }
  }
  const one = async (c, sql, a) => (await c.query(sql, a)).rows[0];
  const fail = (status, error, extra) => Object.assign(new Error(error), { status, extra });

  // Member + permanent seat. Seat numbers are handed out one at a time under an advisory lock, so they are unique and never move.
  async function ensureMemberTx(c, user) {
    const id = String(user.id), nick = nickOf(user), tgu = user.username || null;
    let m = await one(c, "select * from members where tg_id = $1 for update", [id]);
    if (!m) {
      for (let i = 0; i < 5 && !m; i++) {
        const code = crypto.randomBytes(6).toString("base64url").replace(/[-_]/g, "").slice(0, 8).toLowerCase();
        m = await one(c, "insert into members (tg_id, nick, tg_username, ref_code) values ($1,$2,$3,$4) on conflict do nothing returning *", [id, nick, tgu, code]);
        if (m) cache = null;
        if (!m) m = await one(c, "select * from members where tg_id = $1 for update", [id]);
      }
    } else if (m.nick !== nick || m.tg_username !== tgu) await c.query("update members set nick = $2, tg_username = $3 where tg_id = $1", [id, nick, tgu]);
    await c.query("insert into seats (tg_id, nick, tg_username) values ($1,$2,$3) on conflict (tg_id) do nothing", [id, nick, tgu]);
    let seat = await one(c, "select seat_no from seats where tg_id = $1", [id]);
    if (seat.seat_no == null) {
      await c.query("select pg_advisory_xact_lock(7710001)");
      seat = await one(c, "update seats set seat_no = (select coalesce(max(seat_no), 0) + 1 from seats) where tg_id = $1 and seat_no is null returning seat_no", [id])
        || await one(c, "select seat_no from seats where tg_id = $1", [id]);
    }
    return { ...m, seat_no: seat.seat_no };
  }
  const ensureMember = user => tx(c => ensureMemberTx(c, user));

  // Referrals: only brand-new users count, never yourself, one referrer per person, and the reward waits until the
  // new supporter has really played (a completed shift). At most 10 rewarded referrals per referrer per week.
  async function registerReferral(user, code) {
    if (!/^[a-z0-9]{4,12}$/.test(String(code || ""))) return;
    await tx(async c => {
      const id = String(user.id), ref = await one(c, "select tg_id from members where ref_code = $1", [code]);
      if (!ref || String(ref.tg_id) === id) return;
      const known = await one(c, `select (exists(select 1 from members where tg_id = $1) or exists(select 1 from wallets where tg_id = $1)
        or exists(select 1 from homes where tg_id = $1) or exists(select 1 from seats where tg_id = $1)) as known`, [id]);
      if (known.known) return;
      await c.query("insert into referrals (referred_tg, referrer_tg) values ($1,$2) on conflict do nothing", [id, ref.tg_id]);
    }).catch(e => console.error("referral", e.message));
  }
  async function qualifyReferral(c, id) {
    const r = await one(c, "select * from referrals where referred_tg = $1 and qualified_at is null for update", [id]);
    if (!r) return;
    const played = await one(c, "select exists(select 1 from shifts where tg_id = $1 and jsonb_array_length(served) >= $2) as ok", [id, SHIFT_DONE]);
    if (!played.ok) return;
    const wk = await one(c, "select count(*)::int as n from referrals where referrer_tg = $1 and rewarded and qualified_at >= $2::timestamptz",
      [r.referrer_tg, tkStart(weekStart(tashkentDay()))]);
    const reward = wk.n < 10;
    await c.query("update referrals set qualified_at = now(), rewarded = $2 where referred_tg = $1", [id, reward]);
    if (reward) await award(c, r.referrer_tg, 50, 10, "referral");
  }
  async function award(c, id, xp, influence, reason) {
    await c.query("update members set xp = xp + $2, influence = influence + $3 where tg_id = $1", [id, xp, influence]);
    await c.query("insert into xp_log (tg_id, xp, influence, reason) values ($1,$2,$3,$4)", [id, xp, influence, reason]);
  }

  // mission progress — computed from real records only
  async function progress(c, id, action, since) {
    const q = {
      checkin: "select 1 as v",
      serves: "select coalesce(sum(jsonb_array_length(served)), 0)::int as v from shifts where tg_id = $1 and started_at >= $2::timestamptz",
      shifts: `select count(*)::int as v from shifts where tg_id = $1 and started_at >= $2::timestamptz and jsonb_array_length(served) >= ${SHIFT_DONE}`,
      contribution: "select count(*)::int as v from contributions where tg_id = $1 and status = 'approved' and decided_at >= $2::timestamptz",
      referral: "select count(*)::int as v from referrals where referrer_tg = $1 and rewarded and qualified_at >= $2::timestamptz",
      donation: "select coalesce(sum(amount), 0)::int as v from club_funds_log where tg_id = $1 and source = 'donation' and at >= $2::timestamptz",
    }[action];
    if (!q) return 0;
    return (await one(c, q, action === "checkin" ? [] : [id, since])).v;
  }
  const periodOf = (m, day) => m.period === "daily" ? { key: day, since: tkStart(day) } : { key: "W" + weekStart(day), since: tkStart(weekStart(day)) };
  async function missionsFor(c, id) {
    const day = tashkentDay(), ms = (await c.query("select * from missions where active order by period, sort, id")).rows, out = [];
    for (const m of ms) {
      const p = periodOf(m, day), have = await progress(c, id, m.action, p.since);
      const done = await one(c, "select 1 from mission_claims where tg_id = $1 and mission_id = $2 and period_key = $3", [id, m.id, p.key]);
      out.push({ id: m.id, title: m.title, period: m.period, action: m.action, target: m.target, xp: m.xp, progress: Math.min(have, m.target), claimed: !!done });
    }
    return out;
  }

  // club-wide numbers (cached briefly; also shown on the public web page)
  async function summary() {
    if (cache && Date.now() - cacheAt < 30000) return cache;
    await ready;
    const r = await db.query(`select
      (select count(*)::int from members) as supporters, (select count(*)::int from seats where seat_no is not null) as seats,
      (select count(*)::int from homes) as homes, (select funds::int from club where id = 1) as funds, (select coalesce(sum(xp),0)::int from members) as xp`);
    const d = (await db.query(`select d.id, d.emoji, d.name, d.description, d.active, d.sort,
      (select count(*)::int from members m where m.dept = d.id) as members,
      (select count(*)::int from contributions c where c.dept = d.id and c.created_at > now() - interval '7 days') as week,
      (select coalesce(sum(c.influence),0)::int from contributions c where c.dept = d.id and c.status = 'approved') as influence
      from departments d order by d.sort`)).rows;
    for (const x of d) { x.power = x.influence + 10 * x.members; x.level = x.power >= DEPT_LEVELS[2] ? 2 : x.power >= DEPT_LEVELS[1] ? 1 : 0; x.nextAt = DEPT_LEVELS[x.level + 1] || null; }
    const top = (await db.query("select nick, xp from members order by xp desc, member_no asc limit 10")).rows.map(t => ({ ...t, tier: tierOf(t.xp) }));
    const t = r.rows[0], ms = {};
    for (const k in MILESTONES) { const v = k === "supporters" ? t.supporters : t.funds; ms[k] = MILESTONES[k].map(([at, name]) => ({ at, name, done: v >= at })); }
    cache = { ...t, departments: d, top, milestones: ms, deptLevels: DEPT_LEVELS }; cacheAt = Date.now();
    return cache;
  }

  const route = (path, fn, admin) => app.post(path, async (req, res) => {
    const user = auth(req, res); if (!user) return;
    if (admin && !isAdmin(user.id)) return res.status(403).json({ error: "admin only" });
    try { res.json(await fn(user, req.body || {})); }
    catch (e) { if (e.status) return res.status(e.status).json({ error: e.message, ...(e.extra || {}) }); console.error(e); res.status(500).json({ error: "server" }); }
  });

  route("/api/club/me", async (user, body) => {
    const sp = new URLSearchParams(body.initData || "").get("start_param");      // Mini App opened from a ref link
    if (sp && sp.startsWith("ref_")) await registerReferral(user, sp.slice(4));
    const me = await tx(async c => {
      const m = await ensureMemberTx(c, user), id = String(user.id);
      await qualifyReferral(c, id);
      const fresh = await one(c, "select xp, influence, dept, dept_at from members where tg_id = $1", [id]);
      const rank = (await one(c, "select count(*)::int + 1 as r from members where xp > $1", [fresh.xp])).r;
      const missions = await missionsFor(c, id);
      const contributions = (await c.query("select id, dept, kind, body, link, status, xp, influence, note, created_at from contributions where tg_id = $1 order by id desc limit 20", [id])).rows;
      const history = (await c.query("select xp, influence, reason, at from xp_log where tg_id = $1 order by id desc limit 20", [id])).rows;
      const refs = await one(c, "select count(*)::int as invited, count(*) filter (where rewarded)::int as active from referrals where referrer_tg = $1", [id]);
      return { member: { id: supporterId(m.member_no), no: m.member_no, nick: m.nick, joined: m.joined_at, seat_no: m.seat_no, xp: fresh.xp,
        influence: fresh.influence, tier: tierOf(fresh.xp), rank, dept: fresh.dept, deptAt: fresh.dept_at, ref_code: m.ref_code, refs },
        missions, contributions, history };
    });
    return { ...me, admin: isAdmin(user.id), club: await summary(), kinds: KINDS, tiers: TIERS, bot: bot.info.username || "" };
  });

  route("/api/club/dashboard", async () => summary());

  route("/api/club/dept", async (user, body) => tx(async c => {
    const id = String(user.id); await ensureMemberTx(c, user);
    const d = await one(c, "select id from departments where id = $1 and active", [String(body.dept || "")]);
    if (!d) throw fail(400, "dept");
    const m = await one(c, "select dept, dept_at from members where tg_id = $1 for update", [id]);
    if (m.dept === d.id) return { ok: true, dept: d.id };
    if (m.dept && m.dept_at && Date.now() - new Date(m.dept_at).getTime() < 7 * 864e5) throw fail(429, "wait", { next: new Date(new Date(m.dept_at).getTime() + 7 * 864e5) });
    await c.query("update members set dept = $2, dept_at = now() where tg_id = $1", [id, d.id]); cache = null;
    return { ok: true, dept: d.id };
  }));

  route("/api/club/contribute", async (user, body) => tx(async c => {
    const id = String(user.id); await ensureMemberTx(c, user);
    const m = await one(c, "select dept from members where tg_id = $1 for update", [id]);
    if (!m.dept) throw fail(409, "join a department");
    const kind = String(body.kind || ""), text = String(body.body || "").trim().slice(0, 500), link = String(body.link || "").trim();
    if (!(KINDS[m.dept] || []).includes(kind)) throw fail(400, "kind");
    if (text.length < 10) throw fail(400, "too short");
    if (link && (!/^https?:\/\/\S+$/.test(link) || link.length > 200)) throw fail(400, "link");
    const lim = await one(c, `select count(*) filter (where status = 'pending')::int as pending,
      count(*) filter (where created_at >= $2::timestamptz)::int as today from contributions where tg_id = $1`, [id, tkStart(tashkentDay())]);
    if (lim.pending >= 3) throw fail(429, "pending limit");
    if (lim.today >= 5) throw fail(429, "daily limit");
    const dup = await one(c, "select 1 from contributions where tg_id = $1 and body = $2 and created_at > now() - interval '30 days'", [id, text]);
    if (dup) throw fail(409, "duplicate");
    const r = await one(c, "insert into contributions (tg_id, dept, kind, body, link) values ($1,$2,$3,$4,$5) returning id, status", [id, m.dept, kind, text, link || null]);
    cache = null; return { ok: true, ...r };
  }));

  route("/api/club/mission/claim", async (user, body) => tx(async c => {
    const id = String(user.id); await ensureMemberTx(c, user);
    const m = await one(c, "select * from missions where id = $1 and active", [Number(body.id) || 0]);
    if (!m) throw fail(404, "mission");
    const p = periodOf(m, tashkentDay());
    if (await progress(c, id, m.action, p.since) < m.target) throw fail(409, "not done");
    const ins = await one(c, "insert into mission_claims (tg_id, mission_id, period_key, xp) values ($1,$2,$3,$4) on conflict do nothing returning 1 as ok", [id, m.id, p.key, m.xp]);
    if (!ins) throw fail(409, "already");
    await award(c, id, m.xp, 0, "mission:" + m.id); cache = null;
    return { ok: true, xp: m.xp };
  }));

  // coins -> Club Funds (the only bridge between personal money and the club, capped and logged)
  route("/api/club/donate", async (user, body) => tx(async c => {
    const id = String(user.id), amount = Number(body.amount); await ensureMemberTx(c, user);
    if (!Number.isInteger(amount) || amount < DONATE_MIN) throw fail(400, "amount");
    const today = await one(c, "select coalesce(sum(amount),0)::int as v from club_funds_log where tg_id = $1 and source = 'donation' and at >= $2::timestamptz", [id, tkStart(tashkentDay())]);
    if (today.v + amount > DONATE_DAY_MAX) throw fail(429, "daily limit", { left: DONATE_DAY_MAX - today.v });
    const w = await one(c, "update wallets set coins = coins - $2, updated_at = now() where tg_id = $1 and coins >= $2 returning coins", [id, amount]);
    if (!w) throw fail(402, "coins");
    await c.query("insert into ledger (tg_id, delta, reason) values ($1,$2,'donate')", [id, -amount]);
    await c.query("update club set funds = funds + $1 where id = 1", [amount]);
    await c.query("insert into club_funds_log (amount, source, tg_id) values ($1,'donation',$2)", [amount, id]);
    const xp = Math.min(Math.floor((today.v + amount) / 10), DONATE_XP_DAY_MAX) - Math.min(Math.floor(today.v / 10), DONATE_XP_DAY_MAX);
    if (xp > 0) await award(c, id, xp, 0, "donation");
    cache = null; return { ok: true, coins: w.coins, xp };
  }));

  // ---------- admin ----------
  route("/api/admin/contributions", async () => {
    await ready;
    return (await db.query(`select c.*, m.nick, m.member_no from contributions c left join members m on m.tg_id = c.tg_id
      where c.status = 'pending' order by c.created_at limit 100`)).rows;
  }, true);
  route("/api/admin/contribution/decide", async (user, body) => tx(async c => {
    const approve = !!body.approve, clamp = (v, max) => Math.max(0, Math.min(max, Number(v) || 0) | 0);
    const xp = approve ? clamp(body.xp ?? 50, 500) : 0, inf = approve ? clamp(body.influence ?? 20, 500) : 0, funds = approve ? clamp(body.funds, 100000) : 0;
    const r = await one(c, `update contributions set status = $2, xp = $3, influence = $4, funds = $5, note = $6, decided_at = now(), decided_by = $7
      where id = $1 and status = 'pending' returning tg_id, dept`, [Number(body.id) || 0, approve ? "approved" : "rejected", xp, inf, funds, String(body.note || "").slice(0, 200), String(user.id)]);
    if (!r) throw fail(409, "already decided");
    if (approve) {
      await award(c, r.tg_id, xp, inf, "contribution:" + body.id);
      if (funds) { await c.query("update club set funds = funds + $1 where id = 1", [funds]); await c.query("insert into club_funds_log (amount, source, tg_id) values ($1,'contribution',$2)", [funds, r.tg_id]); }
    }
    cache = null; return { ok: true };
  }), true);
  route("/api/admin/missions", async () => { await ready; return { missions: (await db.query("select * from missions order by period, sort, id")).rows, actions: ACTIONS }; }, true);
  route("/api/admin/mission/save", async (user, b) => {
    await ready;
    const title = String(b.title || "").trim().slice(0, 80), period = b.period === "weekly" ? "weekly" : "daily", action = String(b.action || "");
    const target = Math.max(1, Math.min(10000, Number(b.target) | 0)), xp = Math.max(1, Math.min(1000, Number(b.xp) | 0)), active = b.active !== false;
    if (title.length < 3 || !ACTIONS.includes(action)) throw fail(400, "mission");
    if (b.id) await db.query("update missions set title=$2, period=$3, action=$4, target=$5, xp=$6, active=$7 where id=$1", [Number(b.id), title, period, action, target, xp, active]);
    else await db.query("insert into missions (title, period, action, target, xp, active, sort) values ($1,$2,$3,$4,$5,$6,99)", [title, period, action, target, xp, active]);
    return { ok: true };
  }, true);
  route("/api/admin/dept/save", async (user, b) => {
    await ready;
    const r = await db.query("update departments set name = $2, description = $3, active = $4 where id = $1 returning id",
      [String(b.id || ""), String(b.name || "").trim().slice(0, 40) || "?", String(b.description || "").trim().slice(0, 200), b.active !== false]);
    if (!r.rowCount) throw fail(404, "dept");
    cache = null; return { ok: true };
  }, true);

  // ---------- applications: city work (free roles) and club (player / staff) — all come to the admin ----------
  const POSITIONS = ["GK", "DEF", "MID", "FWD"];
  const CITY_ROLES = ["Quruvchi (3D)", "Dizayner", "Video montaj", "SMM", "Dasturchi", "Boshqa"];
  const CLUB_DEPTS = DEPTS.map(d => d[0]);
  const APP_KINDS = ["city", "player", "staff"];
  ready.then(() => db.query(`
    alter table applications add column if not exists kind text not null default 'city';
    alter table applications add column if not exists name text;
    alter table applications add column if not exists age int;
    alter table applications add column if not exists position text;
    alter table applications add column if not exists height int;
    alter table applications add column if not exists link text;
    alter table applications add column if not exists status text not null default 'new';
    alter table applications add column if not exists dept text;
    alter table applications add column if not exists admin_note text;
    alter table applications add column if not exists decided_at timestamptz;
    alter table applications add column if not exists decided_by bigint;
    create index if not exists applications_filter_idx on applications (kind, status, created_at desc);`)).catch(e => console.error("apps init", e.message));

  route("/api/apply", async (user, body) => tx(async c => {
    const id = String(user.id), kind = String(body.kind || "city");
    if (!APP_KINDS.includes(kind)) throw fail(400, "kind");
    const note = String(body.note || "").trim().slice(0, 400);
    const row = { kind, name: null, age: null, position: null, height: null, link: null, dept: null, role: null };
    if (kind === "city") {
      if (!CITY_ROLES.includes(body.role)) throw fail(400, "role");
      row.role = body.role;
    } else {
      row.name = String(body.name || "").trim().slice(0, 40);
      row.age = Number(body.age) | 0;
      if (row.name.length < 2) throw fail(400, "name");
      if (!(row.age >= 8 && row.age <= 80)) throw fail(400, "age");
      if (kind === "player") {
        if (!POSITIONS.includes(body.position)) throw fail(400, "position");
        row.position = body.position;
        row.height = body.height == null || body.height === "" ? null : Math.max(100, Math.min(230, Number(body.height) | 0));
        row.link = String(body.link || "").trim().slice(0, 200) || null;
        if (row.link && !/^https?:\/\/\S+$/.test(row.link)) throw fail(400, "link");
      } else {
        if (!CLUB_DEPTS.includes(body.dept)) throw fail(400, "dept");
        row.dept = body.dept;
      }
    }
    await ensureMemberTx(c, user);                       // applicants become club members (supporter ID + seat) so they can be assigned
    await c.query("select pg_advisory_xact_lock(7710002)");
    const open = await one(c, "select count(*)::int as n from applications where tg_id = $1 and kind = $2 and status = 'new'", [id, kind]);
    if (open.n >= (kind === "city" ? 3 : 1)) throw fail(409, "pending");
    const r = await one(c, `insert into applications (tg_id, nick, role, note, kind, name, age, position, height, link, dept)
      values ($1,$11,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id, status`,
      [id, row.role || row.name || "", note, kind, row.name, row.age, row.position, row.height, row.link, row.dept, nickOf(user)]);
    return { ok: true, id: r.id, status: r.status };
  }));

  // admin list with filters: kind, status, position, dept
  route("/api/admin/applications", async (user, body) => {
    await ready;
    const where = ["1=1"], args = [];
    const add = (sql, v) => { args.push(v); where.push(sql.replace("?", "$" + args.length)); };
    if (APP_KINDS.includes(body.kind)) add("a.kind = ?", body.kind);
    if (["new", "accepted", "rejected"].includes(body.status)) add("a.status = ?", body.status);
    if (POSITIONS.includes(body.position)) add("a.position = ?", body.position);
    if (CLUB_DEPTS.includes(body.dept)) add("a.dept = ?", body.dept);
    const rows = (await db.query(`select a.id, a.kind, a.status, a.name, a.age, a.position, a.height, a.link, a.dept, a.role, a.note, a.admin_note,
        a.created_at, a.tg_id, coalesce(m.nick, a.nick) as nick, m.member_no
      from applications a left join members m on m.tg_id = a.tg_id where ${where.join(" and ")} order by a.created_at desc limit 200`, args)).rows;
    const counts = (await db.query(`select kind, status, count(*)::int as n from applications group by kind, status`)).rows;
    return { rows, counts, positions: POSITIONS, depts: DEPTS.map(d => ({ id: d[0], name: d[2] })), roles: CITY_ROLES };
  }, true);

  // accept / reject / assign to a department (staff, or a player's department role)
  route("/api/admin/application/decide", async (user, body) => tx(async c => {
    const id = Number(body.id) | 0, action = String(body.action || "");
    if (!["accept", "reject", "assign"].includes(action)) throw fail(400, "action");
    const a = await one(c, "select * from applications where id = $1 for update", [id]);
    if (!a) throw fail(404, "application");
    if (action === "assign") {
      if (!CLUB_DEPTS.includes(body.dept)) throw fail(400, "dept");
      await c.query("update applications set dept = $2 where id = $1", [id, body.dept]);
      if (a.tg_id) await c.query("update members set dept = $2, dept_at = now() where tg_id = $1", [a.tg_id, body.dept]);
      cache = null; return { ok: true, dept: body.dept };
    }
    const status = action === "accept" ? "accepted" : "rejected";
    if (a.status !== "new") throw fail(409, "already decided");
    const bodyDept = CLUB_DEPTS.includes(body.dept) ? body.dept : null;
    await c.query("update applications set status = $2, admin_note = $3, decided_at = now(), decided_by = $4, dept = coalesce($5, dept) where id = $1",
      [id, status, String(body.note || "").slice(0, 200), String(user.id), bodyDept]);
    if (status === "accepted" && bodyDept && a.tg_id) await c.query("update members set dept = $2, dept_at = now() where tg_id = $1", [a.tg_id, bodyDept]);
    cache = null;
    // tell the applicant in Telegram (after commit; a failed message never blocks the decision)
    if (a.tg_id) {
      const what = a.kind === "player" ? "futbolchi" : a.kind === "staff" ? "klub xodimi" : (a.role || "ish");
      const text = status === "accepted"
        ? `✅ <b>Tabriklaymiz!</b> Zamin FK ga ${what} sifatida qabul qilindingiz.` + (a.kind === "player" ? "\n⚽ Endi siz jamoa tarkibidasiz — stadionda mashg‘ulotda ko‘rinasiz!" : "") + (body.note ? "\n\n" + String(body.note).slice(0, 200) : "")
        : `ℹ️ Arizangiz ko‘rib chiqildi: bu safar qabul qilinmadi.` + (body.note ? "\n" + String(body.note).slice(0, 200) : "") + "\nKeyingi imkoniyatlarni kuzatib boring!";
      setTimeout(() => bot.api("sendMessage", { chat_id: String(a.tg_id), text, parse_mode: "HTML" }).catch(e => console.error("notify", e.message)), 0);
    }
    return { ok: true, status };
  }), true);

  // accepted players (squad shown on the pitch) and staff — public, no personal data beyond name/position
  app.get("/api/squad", async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    try { await ready;
      const rows = (await db.query(`select a.id, a.kind, case when a.kind = 'city' then coalesce(m.nick, a.nick) else coalesce(nullif(a.name,''), m.nick, a.nick) end as name, a.position, a.dept, case when a.kind = 'city' then a.role end as role
        from applications a left join members m on m.tg_id = a.tg_id where a.status = 'accepted' order by a.decided_at`)).rows;
      res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({ error: "server" }); }
  });

  bot.setStartHook((user, payload) => payload.startsWith("ref_") ? registerReferral(user, payload.slice(4)) : null);
  return { ensureMember, summary, registerReferral };
}

module.exports = { init, tierOf, TIERS, supporterId, weekStart, tashkentDay };
