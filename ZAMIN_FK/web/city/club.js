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
// Squad proposal rules. Applied group has priority; XP ranks players within that
// group. Only genuine group vacancies can be filled by overflow from other groups.
const SQUAD_GROUPS = Object.freeze({
  GK:  { quota: 2, positions: ["GK", "GK"], starters: 1 },
  DEF: { quota: 8, positions: ["LB", "CB", "CB", "RB", "LB", "CB", "CB", "RB"], starters: 4 },
  MID: { quota: 6, positions: ["CDM", "CM", "CAM", "CDM", "CM", "CAM"], starters: 3 },
  FWD: { quota: 6, positions: ["LW", "ST", "RW", "LW", "ST", "RW"], starters: 3 },
});
const SQUAD_GROUP_ORDER = ["GK", "DEF", "MID", "FWD"];
const SQUAD_APPLIED_POSITIONS = SQUAD_GROUP_ORDER;
const SQUAD_ACTIVE_LIMIT = 22;
const SQUAD_RESERVE_LIMIT = 2;

function squadXpRank(a, b) {
  const xp = (Number(b.xp) || 0) - (Number(a.xp) || 0);
  if (xp) return xp;
  const atA = Date.parse(a.decided_at || a.created_at || "") || 0;
  const atB = Date.parse(b.decided_at || b.created_at || "") || 0;
  if (atA !== atB) return atA - atB;
  return String(a.tg_id).localeCompare(String(b.tg_id), "en", { numeric: true });
}

// Pure calculation: no database writes and no changes to application position or XP.
function buildSquadProposal(input = []) {
  const unique = new Map();
  for (const row of input) {
    const group = String(row.applied_position || row.position || "").toUpperCase();
    const tgId = String(row.tg_id || "");
    if (!tgId || !SQUAD_GROUPS[group]) continue;
    const candidate = {
      application_id: row.application_id || row.id || null,
      tg_id: tgId,
      name: String(row.name || row.nick || "Player"),
      xp: Math.max(0, Number(row.xp) || 0),
      applied_position: group,
      created_at: row.created_at || null,
      decided_at: row.decided_at || null,
    };
    const prior = unique.get(tgId);
    if (!prior || (Date.parse(candidate.decided_at || candidate.created_at || "") || 0) >
                  (Date.parse(prior.decided_at || prior.created_at || "") || 0)) unique.set(tgId, candidate);
  }

  const pools = Object.fromEntries(SQUAD_GROUP_ORDER.map(g => [g, []]));
  for (const player of unique.values()) pools[player.applied_position].push(player);
  for (const group of SQUAD_GROUP_ORDER) pools[group].sort(squadXpRank);

  const assigned = {}, overflow = [];
  for (const group of SQUAD_GROUP_ORDER) {
    assigned[group] = pools[group].slice(0, SQUAD_GROUPS[group].quota)
      .map(player => ({ ...player, assigned_group: group, reassigned: false }));
    overflow.push(...pools[group].slice(SQUAD_GROUPS[group].quota));
  }
  overflow.sort(squadXpRank);

  // A surplus player can transfer only into an under-filled group; XP ranks transfers.
  for (const group of SQUAD_GROUP_ORDER) {
    const vacancies = SQUAD_GROUPS[group].quota - assigned[group].length;
    for (let i = 0; i < vacancies && overflow.length; i++) {
      const player = overflow.shift();
      assigned[group].push({ ...player, assigned_group: group, reassigned: true });
    }
  }

  const byGroup = {};
  for (const group of SQUAD_GROUP_ORDER) {
    const ranked = assigned[group].slice().sort(squadXpRank); // once reassigned, XP competes across the destination group
    byGroup[group] = ranked.map((player, index) => {
      const starter = index < SQUAD_GROUPS[group].starters;
      return {
        ...player,
        stadium_position: SQUAD_GROUPS[group].positions[index],
        squad_role: starter ? "starter" : "substitute",
        position_rank: index + 1,
        reason: player.reassigned
          ? "Applied " + player.applied_position + "; its quota was full. Reassigned to " + group + " by XP ranking."
          : "Applied " + player.applied_position + "; selected in that group by XP ranking.",
      };
    });
  }

  const starters = [
    byGroup.GK[0], ...byGroup.DEF.slice(0, 4), ...byGroup.MID.slice(0, 3), ...byGroup.FWD.slice(0, 3),
  ].filter(Boolean);
  const substitutes = [
    byGroup.GK[1], ...byGroup.DEF.slice(4, 8), ...byGroup.MID.slice(3, 6), ...byGroup.FWD.slice(3, 6),
  ].filter(Boolean);
  const active = [...starters, ...substitutes].slice(0, SQUAD_ACTIVE_LIMIT)
    .map((player, index) => ({ ...player, squad_order: index + 1, squad_role: index < starters.length ? "starter" : "substitute" }));
  const reserves = overflow.slice(0, SQUAD_RESERVE_LIMIT).map((player, index) => ({
    ...player, assigned_group: null, stadium_position: null, squad_role: "reserve",
    reserve_rank: index + 1, reassigned: false,
    reason: "Outside the active 22; highest remaining XP reserve.",
  }));

  return {
    rules: { group_quotas: Object.fromEntries(SQUAD_GROUP_ORDER.map(g => [g, SQUAD_GROUPS[g].quota])),
      active_limit: SQUAD_ACTIVE_LIMIT, reserve_limit: SQUAD_RESERVE_LIMIT,
      xp_source: "members.xp", priority: "applied_position_then_xp" },
    eligible_count: unique.size,
    active_count: active.length,
    reserve_count: reserves.length,
    shortfall: Math.max(0, SQUAD_ACTIVE_LIMIT - active.length),
    active,
    reserves,
  };
}


function init({ app, db, auth, bot, nickOf, ready: base }) {
  let cache = null, cacheAt = 0;
  const ADMINS = new Set(String(process.env.ADMIN_IDS || "").split(/[\s,]+/).filter(Boolean));
  const isAdmin = id => ADMINS.has(String(id));
  if (!db) {                                  // memory mode (local only): portal disabled, everything else keeps working
    app.use(["/api/club", "/api/admin"], (req, res) => res.status(503).json({ error: "club needs database" }));
    return { ensureMember: async () => null, summary: async () => null, registerReferral: async () => {}, isAdmin, tierOf, DEPTS, supporterId };
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
    create table if not exists squad_proposals (
      id bigserial primary key,
      status text not null default 'pending' check (status in ('pending','approved','rejected')),
      payload jsonb not null,
      created_by bigint not null,
      created_at timestamptz not null default now(),
      decided_by bigint,
      decided_at timestamptz
    );
    create index if not exists squad_proposals_status_idx on squad_proposals (status, created_at desc);
    create table if not exists squad_approved_roster (
      id int primary key default 1 check (id = 1),
      proposal_id bigint not null references squad_proposals(id),
      payload jsonb not null,
      approved_by bigint not null,
      approved_at timestamptz not null default now()
    );
  `)).then(async () => {
    for (const [i, [id, emoji, name, desc]] of DEPTS.entries())
      await db.query("insert into departments (id, emoji, name, description, sort) values ($1,$2,$3,$4,$5) on conflict (id) do nothing", [id, emoji, name, desc, i]);
    const n = (await db.query("select count(*)::int as n from missions")).rows[0].n;
    if (!n) for (const [i, m] of MISSION_SEED.entries()) await db.query("insert into missions (title, period, action, target, xp, sort) values ($1,$2,$3,$4,$5,$6)", [...m, i]);
  }).catch(e => console.error("club db init", e.message));

  async function tx(fn) {
    await ready; const c = await db.connect();
    c.after = [];                                          // admin-channel logs, sent only once the transaction is committed
    try { await c.query("begin"); const out = await fn(c); await c.query("commit"); for (const f of c.after) { try { f(); } catch (e) { console.error("after", e.message); } } return out; }
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
        if (m) { cache = null; c.after.push(() => bot.log("🆕 Yangi muxlis", { "Kim": bot.who(user), "ID": supporterId(m.member_no) })); }
        if (!m) m = await one(c, "select * from members where tg_id = $1 for update", [id]);
      }
    } else if (m.nick !== nick || m.tg_username !== tgu) await c.query("update members set nick = $2, tg_username = $3 where tg_id = $1", [id, nick, tgu]);
    await c.query("insert into seats (tg_id, nick, tg_username) values ($1,$2,$3) on conflict (tg_id) do nothing", [id, nick, tgu]);
    let seat = await one(c, "select seat_no from seats where tg_id = $1", [id]);
    if (seat.seat_no == null) {
      await c.query("select pg_advisory_xact_lock(7710001)");
      seat = await one(c, "update seats set seat_no = (select coalesce(max(seat_no), 0) + 1 from seats) where tg_id = $1 and seat_no is null returning seat_no", [id])
        || await one(c, "select seat_no from seats where tg_id = $1", [id]);
      if (seat.seat_no != null) { const no = seat.seat_no; c.after.push(() => bot.log("🎟 O‘rindiq berildi", { "Kim": bot.who(user), "O‘rindiq": "№" + no })); }
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
      const fresh = await one(c, "select xp, influence, dept, dept_at, profession, profession_at from members where tg_id = $1", [id]);
      const rank = (await one(c, "select count(*)::int + 1 as r from members where xp > $1", [fresh.xp])).r;
      const missions = await missionsFor(c, id);
      const contributions = (await c.query("select id, dept, kind, body, link, status, xp, influence, note, created_at from contributions where tg_id = $1 order by id desc limit 20", [id])).rows;
      const history = (await c.query("select xp, influence, reason, at from xp_log where tg_id = $1 order by id desc limit 20", [id])).rows;
      const refs = await one(c, "select count(*)::int as invited, count(*) filter (where rewarded)::int as active from referrals where referrer_tg = $1", [id]);
      return { member: { id: supporterId(m.member_no), no: m.member_no, nick: m.nick, joined: m.joined_at, seat_no: m.seat_no, xp: fresh.xp,
        influence: fresh.influence, tier: tierOf(fresh.xp), rank, dept: fresh.dept, deptAt: fresh.dept_at, ref_code: m.ref_code, refs,
        profession: fresh.profession || null, professionAt: fresh.profession_at || null },
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
    c.after.push(() => bot.log("🏢 Bo‘limga qo‘shildi", { "Kim": bot.who(user), "Bo‘lim": d.id, "Avvalgi": m.dept || "" }));
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
    cache = null;
    c.after.push(() => bot.log("💡 Yangi hissa #" + r.id, { "Kim": bot.who(user), "Bo‘lim": m.dept, "Turi": kind, "Matn": text, "Havola": link }));
    return { ok: true, ...r };
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
    cache = null;
    c.after.push(() => bot.log("💰 Klub fondiga xayriya", { "Kim": bot.who(user), "Summa": amount + " 🪙", "XP": xp }));
    return { ok: true, coins: w.coins, xp };
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
      where id = $1 and status = 'pending' returning tg_id, dept, kind`, [Number(body.id) || 0, approve ? "approved" : "rejected", xp, inf, funds, String(body.note || "").slice(0, 200), String(user.id)]);
    if (!r) throw fail(409, "already decided");
    if (approve) {
      await award(c, r.tg_id, xp, inf, "contribution:" + body.id);
      if (funds) { await c.query("update club set funds = funds + $1 where id = 1", [funds]); await c.query("insert into club_funds_log (amount, source, tg_id) values ($1,'contribution',$2)", [funds, r.tg_id]); }
    }
    cache = null;
    c.after.push(() => bot.log((approve ? "✅ Hissa tasdiqlandi #" : "❌ Hissa rad etildi #") + body.id, { "Admin": bot.who(user), "Muallif ID": r.tg_id, "Bo‘lim": r.dept, "XP": approve ? xp : "", "Ta’sir": approve ? inf : "", "Fond": funds || "" }));
    return { ok: true };
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
    create index if not exists applications_filter_idx on applications (kind, status, created_at desc);
    alter table members add column if not exists profession text;
    alter table members add column if not exists profession_at timestamptz;
    update members m set profession = a.role, profession_at = a.decided_at from (select distinct on (tg_id) tg_id, role, decided_at from applications
      where kind = 'city' and status = 'accepted' and role is not null order by tg_id, decided_at desc nulls last) a
      where m.tg_id = a.tg_id and m.profession is null;`)).catch(e => console.error("apps init", e.message));

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
    if (open.n >= 1) throw fail(409, "pending");                 // one open application per kind
    if (kind === "city") {                                       // one profession per user: applying again means switching
      const cur = await one(c, "select profession from members where tg_id = $1", [id]);
      if (cur && cur.profession === row.role) throw fail(409, "already");
    }
    const r = await one(c, `insert into applications (tg_id, nick, role, note, kind, name, age, position, height, link, dept)
      values ($1,$11,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id, status`,
      [id, row.role || row.name || "", note, kind, row.name, row.age, row.position, row.height, row.link, row.dept, nickOf(user)]);
    const KIND_UZ = { city: "🏙 Shahar ishi (kasb)", player: "🏃 Futbolchi", staff: "🧑‍💼 Klub xodimi" };
    c.after.push(() => bot.log("📋 Yangi ariza #" + r.id, { "Kim": bot.who(user), "Turi": KIND_UZ[kind], "Kasb": row.role, "Ism": row.name, "Yosh": row.age,
      "Pozitsiya": row.position, "Bo‘y": row.height, "Bo‘lim": row.dept, "Havola": row.link, "Izoh": note }));
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
  const decideApp = (user, body) => tx(async c => {        // used by the mini app admin panel and the bot admin buttons
    const id = Number(body.id) | 0, action = String(body.action || "");
    if (!["accept", "reject", "assign"].includes(action)) throw fail(400, "action");
    const a = await one(c, "select * from applications where id = $1 for update", [id]);
    if (!a) throw fail(404, "application");
    if (action === "assign") {
      if (!CLUB_DEPTS.includes(body.dept)) throw fail(400, "dept");
      await c.query("update applications set dept = $2 where id = $1", [id, body.dept]);
      if (a.tg_id) await c.query("update members set dept = $2, dept_at = now() where tg_id = $1", [a.tg_id, body.dept]);
      cache = null;
      c.after.push(() => bot.log("🏢 Bo‘limga tayinlandi #" + id, { "Admin": bot.who(user), "Kim": `${a.nick || ""} (${a.tg_id})`, "Bo‘lim": body.dept }));
      return { ok: true, dept: body.dept };
    }
    const status = action === "accept" ? "accepted" : "rejected";
    if (a.status !== "new") throw fail(409, "already decided");
    const bodyDept = CLUB_DEPTS.includes(body.dept) ? body.dept : null;
    await c.query("update applications set status = $2, admin_note = $3, decided_at = now(), decided_by = $4, dept = coalesce($5, dept) where id = $1",
      [id, status, String(body.note || "").slice(0, 200), String(user.id), bodyDept]);
    if (status === "accepted" && bodyDept && a.tg_id) await c.query("update members set dept = $2, dept_at = now() where tg_id = $1", [a.tg_id, bodyDept]);
    let prevProf = null;
    if (status === "accepted" && a.kind === "city" && a.tg_id) {      // one profession per user: the new one replaces the old one
      prevProf = (await one(c, "select profession from members where tg_id = $1", [a.tg_id]) || {}).profession || null;
      await c.query("update applications set status = 'replaced' where tg_id = $1 and kind = 'city' and status = 'accepted' and id <> $2", [a.tg_id, id]);
      await c.query("update members set profession = $2, profession_at = now() where tg_id = $1", [a.tg_id, a.role]);
    }
    cache = null;
    c.after.push(() => bot.log((status === "accepted" ? "✅ Ariza qabul qilindi #" : "❌ Ariza rad etildi #") + id, { "Admin": bot.who(user),
      "Arizachi": `${a.nick || ""} (${a.tg_id})`, "Turi": a.kind, "Kasb": a.kind === "city" ? a.role : "", "Avvalgi kasb": prevProf || "", "Bo‘lim": bodyDept || a.dept || "", "Izoh": body.note || "" }));
    // tell the applicant in Telegram (after commit; a failed message never blocks the decision)
    if (a.tg_id) {
      const what = a.kind === "player" ? "futbolchi" : a.kind === "staff" ? "klub xodimi" : (a.role || "ish");
      const text = status === "accepted"
        ? `✅ <b>Tabriklaymiz!</b> Zamin FK ga ${what} sifatida qabul qilindingiz.` + (a.kind === "player" ? "\n⚽ Endi siz jamoa tarkibidasiz — stadionda mashg‘ulotda ko‘rinasiz!" : "") + (body.note ? "\n\n" + String(body.note).slice(0, 200) : "")
        : `ℹ️ Arizangiz ko‘rib chiqildi: bu safar qabul qilinmadi.` + (body.note ? "\n" + String(body.note).slice(0, 200) : "") + "\nKeyingi imkoniyatlarni kuzatib boring!";
      setTimeout(() => bot.api("sendMessage", { chat_id: String(a.tg_id), text, parse_mode: "HTML" }).catch(e => console.error("notify", e.message)), 0);
    }
    return { ok: true, status };
  });
  route("/api/admin/application/decide", decideApp, true);

  // ---------- admin: users, activity, mission completions, manual grants ----------
  const DAY0 = "(date_trunc('day', now() at time zone 'Asia/Tashkent') at time zone 'Asia/Tashkent')";
  const LAST = `greatest(m.joined_at, w.updated_at, h.updated_at,
    (select max(at) from xp_log where tg_id = m.tg_id), (select max(at) from ledger where tg_id = m.tg_id), (select max(at) from mission_claims where tg_id = m.tg_id))`;
  const USERS_FROM = `from members m left join wallets w on w.tg_id = m.tg_id left join homes h on h.tg_id = m.tg_id`;
  const bad = (msg, status = 400) => Object.assign(new Error(msg), { status });
  // everyone who applied, by profession (players with position), newest last within a group
  route("/api/admin/professions", async () => {
    await ready;
    return (await db.query(`select a.id, a.kind, a.status, coalesce(nullif(a.name,''), m.nick, a.nick) as name, coalesce(m.nick, a.nick) as nick, m.tg_username,
        a.age, a.position, a.height, a.dept, a.role, m.member_no, a.tg_id, a.created_at
      from applications a left join members m on m.tg_id = a.tg_id where a.status <> 'rejected' order by a.kind, a.position nulls last, (a.status = 'accepted') desc, a.created_at`)).rows;
  }, true);

  // admin sets a role directly (no application needed), edits it, or removes it.
  // body: { tg_id, kind: player|staff|city, action: set|remove, position, name, dept, role }
  route("/api/admin/role", async (user, b) => tx(async c => {
    const tg = String(Number(b.tg_id) || 0), kind = String(b.kind || ""), action = b.action === "remove" ? "remove" : "set";
    if (!APP_KINDS.includes(kind)) throw fail(400, "kind");
    const m = await one(c, "select tg_id, nick from members where tg_id = $1", [tg]);
    if (!m) throw fail(404, "user");
    const cur = await one(c, "select * from applications where tg_id = $1 and kind = $2 and status = 'accepted' order by decided_at desc nulls last, id desc limit 1 for update", [tg, kind]);
    if (action === "remove") {
      if (!cur) throw fail(404, "role");
      await c.query("update applications set status = 'removed', decided_at = now(), decided_by = $3 where tg_id = $1 and kind = $2 and status = 'accepted'", [tg, kind, String(user.id)]);
      if (kind === "city") await c.query("update members set profession = null, profession_at = now() where tg_id = $1", [tg]);
      cache = null;
      c.after.push(() => bot.log("🚫 Rol olib tashlandi", { "Admin": bot.who(user), "Kim": `${m.nick} (${tg})`, "Turi": kind }));
      return { ok: true };
    }
    const position = kind === "player" ? (POSITIONS.includes(b.position) ? b.position : (cur && cur.position) || "MID") : null;
    const dept = CLUB_DEPTS.includes(b.dept) ? b.dept : (cur && cur.dept) || null;
    const name = String(b.name || "").trim().slice(0, 40) || (cur && cur.name) || m.nick.replace(/^@/, "");
    const role = kind === "city" ? String(b.role || (cur && cur.role) || "").trim().slice(0, 40) : kind === "player" ? "Futbolchi" : "Xodim";
    if (kind === "city" && !role) throw fail(400, "role");
    let id;
    if (cur) {
      await c.query("update applications set position = $2, dept = $3, name = $4, role = $5 where id = $1", [cur.id, position, dept, name, role]);
      id = cur.id;
    } else {
      id = (await one(c, `insert into applications (tg_id, nick, role, note, kind, name, position, dept, status, decided_at, decided_by)
        values ($1, $2, $3, 'admin', $4, $5, $6, $7, 'accepted', now(), $8) returning id`, [tg, m.nick, role, kind, name, position, dept, String(user.id)])).id;
    }
    if (kind === "city") {
      await c.query("update applications set status = 'replaced' where tg_id = $1 and kind = 'city' and status = 'accepted' and id <> $2", [tg, id]);
      await c.query("update members set profession = $2, profession_at = now() where tg_id = $1", [tg, role]);
    }
    if (dept && kind !== "city") await c.query("update members set dept = $2, dept_at = now() where tg_id = $1", [tg, dept]);
    cache = null;
    c.after.push(() => bot.log(cur ? "✏️ Rol o‘zgartirildi" : "⭐ Rol berildi", { "Admin": bot.who(user), "Kim": `${m.nick} (${tg})`, "Turi": kind, "Ism": name, "Pozitsiya": position || "", "Bo‘lim": dept || "", "Kasb": kind === "city" ? role : "" }));
    if (!cur) {
      const what = kind === "player" ? "futbolchi" : kind === "staff" ? "klub xodimi" : role;
      const text = `✅ <b>Tabriklaymiz!</b> Zamin FK ga ${what} sifatida qabul qilindingiz.` + (kind === "player" ? "\n⚽ Endi siz jamoa tarkibidasiz — stadionda mashg‘ulotda ko‘rinasiz!" : "");
      c.after.push(() => bot.api("sendMessage", { chat_id: tg, text, parse_mode: "HTML" }).catch(e => console.error("notify", e.message)));
    }
    return { ok: true, id };
  }), true);

  route("/api/admin/users", async (user, b) => {
    await ready;
    const q = String(b.q || "").trim().slice(0, 40), f = String(b.filter || "all"), off = Math.max(0, Number(b.offset) | 0);
    const args = [], where = [];
    if (q) { args.push("%" + q.toLowerCase().replace(/^@/, "") + "%"); where.push(`(lower(m.nick) like $${args.length} or lower(coalesce(m.tg_username,'')) like $${args.length} or m.tg_id::text like $${args.length} or ('zfk-' || lpad(m.member_no::text, 5, '0')) like $${args.length})`); }
    if (f === "active") where.push(`${LAST} > now() - interval '7 days'`);
    if (f === "today") where.push(`${LAST} > now() - interval '24 hours'`);
    if (f === "inactive") where.push(`${LAST} <= now() - interval '7 days'`);
    if (f === "nohome") where.push("h.tg_id is null");
    const order = { coins: "coalesce(w.coins,0) desc", xp: "m.xp desc", new: "m.joined_at desc", level: "coalesce(h.level,0) desc" }[b.sort] || `${LAST} desc nulls last`;
    const rows = (await db.query(`select m.tg_id, m.member_no, m.nick, m.tg_username, m.xp, m.joined_at, coalesce(w.coins,0)::int as coins, h.level as home, ${LAST} as last_at,
      (select count(*)::int from mission_claims mc where mc.tg_id = m.tg_id and mc.at >= ${DAY0}) as today
      ${USERS_FROM} ${where.length ? "where " + where.join(" and ") : ""} order by ${order} limit 30 offset ${off}`, args)).rows;
    const stats = (await db.query(`select count(*)::int as total,
      count(*) filter (where ${LAST} > now() - interval '24 hours')::int as d1,
      count(*) filter (where ${LAST} > now() - interval '7 days')::int as d7,
      count(*) filter (where ${LAST} <= now() - interval '7 days')::int as idle,
      count(*) filter (where m.joined_at > now() - interval '24 hours')::int as new1,
      coalesce(sum(w.coins),0)::bigint as coins ${USERS_FROM}`)).rows[0];
    const doneToday = (await db.query(`select count(distinct tg_id)::int as n from mission_claims where at >= ${DAY0}`)).rows[0].n;
    return { rows, stats: { ...stats, doneToday }, more: rows.length === 30 };
  }, true);

  route("/api/admin/user", async (user, b) => {
    await ready; const id = String(Number(b.id) || 0);
    const m = (await db.query(`select m.*, w.coins, w.streak, w.earned, h.level as home, h.car, ${LAST} as last_at ${USERS_FROM} where m.tg_id = $1`, [id])).rows[0];
    if (!m) throw bad("not found", 404);
    const rank = (await db.query("select count(*)::int + 1 as r from members where xp > $1", [m.xp])).rows[0].r;
    const claims = (await db.query("select mc.at, mc.xp, ms.title from mission_claims mc left join missions ms on ms.id = mc.mission_id where mc.tg_id = $1 order by mc.at desc limit 15", [id])).rows;
    const ledger = (await db.query("select delta, reason, at from ledger where tg_id = $1 order by id desc limit 12", [id])).rows;
    const shifts = (await db.query("select count(*)::int as n, coalesce(sum(earned),0)::int as earned from shifts where tg_id = $1", [id])).rows[0];
    const apps = (await db.query("select kind, role, status, created_at from applications where tg_id = $1 order by id desc limit 5", [id]).catch(() => ({ rows: [] }))).rows;
    const roles = (await db.query("select distinct on (kind) id, kind, name, position, dept, role from applications where tg_id = $1 and status = 'accepted' order by kind, decided_at desc nulls last, id desc", [id]).catch(() => ({ rows: [] }))).rows;
    return { member: { id: supporterId(m.member_no), tg_id: m.tg_id, nick: m.nick, username: m.tg_username, joined: m.joined_at, xp: m.xp, influence: m.influence, tier: tierOf(m.xp), rank, dept: m.dept, seat_no: m.seat_no,
      coins: m.coins || 0, streak: m.streak || 0, earned: m.earned || 0, home: m.home || 0, car: m.car || 0, last_at: m.last_at }, claims, ledger, shifts, apps, roles, depts: DEPTS.map(d => ({ id: d[0], name: d[2] })) };
  }, true);

  // who finished which mission (today / last 7 days)
  route("/api/admin/missions/status", async () => {
    await ready;
    const rows = (await db.query(`select ms.id, ms.title, ms.period, ms.xp,
      count(mc.tg_id) filter (where mc.at >= ${DAY0})::int as today, count(mc.tg_id) filter (where mc.at >= now() - interval '7 days')::int as week,
      coalesce(json_agg(json_build_object('nick', m.nick, 'tg_id', m.tg_id, 'at', mc.at) order by mc.at desc) filter (where mc.at >= now() - interval '2 days'), '[]') as recent
      from missions ms left join mission_claims mc on mc.mission_id = ms.id left join members m on m.tg_id = mc.tg_id where ms.active group by ms.id order by ms.period, ms.sort, ms.id`)).rows;
    return { missions: rows, total: (await db.query("select count(*)::int as n from members")).rows[0].n };
  }, true);

  // manual grant: coins (+/-), home level, Fan XP — logged, and the user is told in the bot
  route("/api/admin/grant", async (user, b) => {
    await ready; const id = String(Number(b.id) || 0);
    const coins = Math.trunc(Number(b.coins) || 0), xp = Math.trunc(Number(b.xp) || 0), level = b.level === "" || b.level == null ? null : Math.trunc(Number(b.level));
    if (Math.abs(coins) > 100000 || Math.abs(xp) > 100000) throw bad("too big");
    if (level != null && (level < 1 || level > 7)) throw bad("level 1-7");
    if (!coins && !xp && level == null) throw bad("nothing to grant");
    const out = await tx(async c => {
      const m = await one(c, "select tg_id, nick from members where tg_id = $1 for update", [id]);
      if (!m) throw bad("not found", 404);
      const res = { nick: m.nick, lines: [] };
      if (coins) {
        const w = await one(c, "insert into wallets (tg_id, coins) values ($1, greatest($2::int, 0)) on conflict (tg_id) do update set coins = greatest(wallets.coins + $2::int, 0), updated_at = now() returning coins", [id, coins]);
        await c.query("insert into ledger (tg_id, delta, reason) values ($1,$2,$3)", [id, coins, "admin:" + user.id]);
        res.coins = w.coins; res.lines.push(`${coins > 0 ? "+" : ""}${coins} 🪙`);
      }
      if (xp) { await c.query("update members set xp = greatest(xp + $2, 0) where tg_id = $1", [id, xp]); await c.query("insert into xp_log (tg_id, xp, reason) values ($1,$2,$3)", [id, xp, "admin:" + user.id]); res.lines.push(`${xp > 0 ? "+" : ""}${xp} Fan XP ⭐`); }
      if (level != null) {
        const h = await one(c, "update homes set level = $2, updated_at = now(), upgraded_at = now() where tg_id = $1 returning level", [id, level]);
        if (!h) throw bad("user has no house", 409);
        res.level = h.level; res.lines.push(`🏠 uy ${level}-daraja`);
      }
      return res;
    });
    cache = null;
    const note = b.note ? "\n\n" + bot.esc(String(b.note).slice(0, 200)) : "";
    bot.api("sendMessage", { chat_id: id, text: "🎁 <b>ZAMIN FK sizga sovg‘a yubordi!</b>\n" + out.lines.join("\n") + note, parse_mode: "HTML" }).catch(() => {});
    try { bot.log && bot.log("🎁 Admin grant", { Admin: String(user.id), Kimga: out.nick + " (" + id + ")", Berildi: out.lines.join(", ") }); } catch (e) {}
    return { ok: true, ...out };
  }, true);

  // feedback sent to the bot (/feedback)
  route("/api/admin/feedback", async (user, body) => {
    await ready;
    if (body.id && ["new", "done"].includes(body.status)) await db.query("update feedback set status = $2 where id = $1", [Number(body.id) | 0, body.status]);
    return (await db.query("select id, tg_id, username, message, status, created_at from feedback order by id desc limit 200")).rows;
  }, true);

  // Admin squad workflow: generating stores a pending snapshot; only explicit approval publishes it.
  route("/api/admin/squad/proposal", async (user) => tx(async c => {
    const rows = (await c.query(`select distinct on (a.tg_id)
        a.id as application_id, a.tg_id,
        coalesce(nullif(a.name,''), m.nick, a.nick) as name,
        a.position as applied_position, m.xp, a.created_at, a.decided_at
      from applications a join members m on m.tg_id = a.tg_id
      where a.kind = 'player' and a.status = 'accepted' and a.position = any($1::text[])
      order by a.tg_id, a.decided_at desc nulls last, a.id desc`, [SQUAD_APPLIED_POSITIONS])).rows;
    const proposal = buildSquadProposal(rows);
    const saved = await one(c, "insert into squad_proposals (payload, created_by) values ($1::jsonb, $2) returning id, status, created_at",
      [JSON.stringify(proposal), String(user.id)]);
    return { ...saved, proposal };
  }), true);

  route("/api/admin/squad/status", async () => {
    await ready;
    const pending = await one(db, "select id, status, payload, created_by, created_at from squad_proposals where status = 'pending' order by id desc limit 1");
    const approved = await one(db, "select proposal_id, payload, approved_by, approved_at from squad_approved_roster where id = 1");
    return { pending, approved };
  }, true);

  route("/api/admin/squad/decide", async (user, body) => tx(async c => {
    const id = Math.max(0, Math.trunc(Number(body.id) || 0));
    const action = String(body.action || "");
    if (!id || !["approve", "reject"].includes(action)) throw fail(400, "proposal id and approve/reject action required");
    const proposal = await one(c, "select id, status, payload from squad_proposals where id = $1 for update", [id]);
    if (!proposal) throw fail(404, "proposal not found");
    if (proposal.status !== "pending") throw fail(409, "proposal already decided");
    if (action === "approve") {
      const payload = typeof proposal.payload === "string" ? JSON.parse(proposal.payload) : proposal.payload;
      if (!payload || !Array.isArray(payload.active) || !Array.isArray(payload.reserves) ||
          payload.active.length > SQUAD_ACTIVE_LIMIT || payload.reserves.length > SQUAD_RESERVE_LIMIT)
        throw fail(409, "invalid proposal snapshot");
      const ids = [...payload.active, ...payload.reserves].map(p => String(p.tg_id));
      if (new Set(ids).size !== ids.length) throw fail(409, "duplicate player in proposal");
      await c.query(`insert into squad_approved_roster (id, proposal_id, payload, approved_by, approved_at)
        values (1, $1, $2::jsonb, $3, now())
        on conflict (id) do update set proposal_id = excluded.proposal_id, payload = excluded.payload,
          approved_by = excluded.approved_by, approved_at = excluded.approved_at`,
        [id, JSON.stringify(payload), String(user.id)]);
    }
    await c.query("update squad_proposals set status = $2, decided_by = $3, decided_at = now() where id = $1",
      [id, action === "approve" ? "approved" : "rejected", String(user.id)]);
    return { ok: true, id, status: action === "approve" ? "approved" : "rejected" };
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
  return { ensureMember, summary, registerReferral, decideApp, isAdmin, tierOf, ready, DEPTS, TIERS, supporterId };
}

module.exports = { init, tierOf, TIERS, supporterId, weekStart, tashkentDay, buildSquadProposal, SQUAD_GROUPS };
