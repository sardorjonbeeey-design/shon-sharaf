// Bot screens: /karta (player card or VIP member card) and /admin (applications, feedback, stats) with inline buttons.
// Data comes from the same Postgres as the mini app. Everything runs after the webhook has answered (async).
const cards = require("./cards");

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const POS = { GK: "Darvozabon", DEF: "Himoyachi", MID: "Yarim himoyachi", FWD: "Hujumchi" };
const ovrOf = xp => Math.min(99, 50 + Math.floor(Math.sqrt(Math.max(0, xp))));

function init({ db, bot, club, led }) {
  const { api, esc, who, WEBAPP_URL, BOT_TOKEN, TG_API } = bot;
  const q = (sql, a) => db.query(sql, a).then(r => r.rows);
  const one = async (sql, a) => (await q(sql, a))[0];
  const isAdmin = id => club.isAdmin && club.isAdmin(id);
  const appBtn = WEBAPP_URL.startsWith("https://") ? [{ text: "📱 Ilovani ochish", web_app: { url: WEBAPP_URL } }] : [];

  // multipart upload (sendPhoto / editMessageMedia) — Node 18+ has FormData and Blob built in
  async function apiFile(method, fields, fileField, buf) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) if (v !== undefined && v !== null) fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    fd.append(fileField, new Blob([buf], { type: "image/png" }), "card.png");
    const r = await fetch(`${TG_API}/bot${BOT_TOKEN}/${method}`, { method: "POST", body: fd });
    const d = await r.json().catch(() => ({}));
    if (!d.ok) throw new Error(`${method}: ${d.description || r.status}`);
    return d.result;
  }

  // Telegram profile photo -> data URI (cached 6 h; the bot token never leaves the server)
  const photoCache = new Map();
  async function profilePhoto(userId) {
    const c = photoCache.get(userId);
    if (c && Date.now() - c.at < 6 * 3600e3) return c.data;
    let data = null;
    try {
      const ph = await api("getUserProfilePhotos", { user_id: userId, limit: 1 });
      const sizes = ph.photos && ph.photos[0];
      if (sizes && sizes.length) {
        const s = sizes.reduce((b, x) => Math.abs(x.width - 640) < Math.abs(b.width - 640) ? x : b);
        const f = await api("getFile", { file_id: s.file_id });
        const r = await fetch(`${TG_API}/file/bot${BOT_TOKEN}/${f.file_path}`);
        if (r.ok) data = "data:image/jpeg;base64," + Buffer.from(await r.arrayBuffer()).toString("base64");
      }
    } catch (e) { console.error("profile photo", e.message); }
    photoCache.set(userId, { at: Date.now(), data });
    return data;
  }

  // ---------- card data ----------
  async function cardFor(user) {
    await club.ensureMember(user);                               // same as opening the app: member number + permanent seat
    const id = String(user.id);
    const m = await one(`select m.*, coalesce(w.coins, 0)::int as coins from members m left join wallets w on w.tg_id = m.tg_id where m.tg_id = $1`, [id]);
    const p = await one(`select * from applications where tg_id = $1 and kind = 'player' and status in ('new','accepted')
      order by (status = 'accepted') desc, id desc limit 1`, [id]);
    const tgName = [user.first_name, user.last_name].filter(Boolean).join(" ") || m.nick.replace(/^@/, "");
    const photo = await profilePhoto(user.id);
    const sid = club.supporterId(m.member_no);
    if (p) {
      const xp = m.xp || 0;
      const wk = await one(`select coalesce(sum(xp), 0)::int as v from xp_log where tg_id = $1 and at > now() - interval '7 days'`, [id]);
      const days = await one(`select count(distinct (at at time zone 'Asia/Tashkent')::date)::int as v from
        (select at from xp_log where tg_id = $1 union all select at from ledger where tg_id = $1) x`, [id]);
      const rank = await one(`select count(distinct a.tg_id)::int + 1 as v from applications a join members mm on mm.tg_id = a.tg_id
        where a.kind = 'player' and a.status in ('new','accepted') and mm.xp > $1`, [xp]);
      const t = club.tierOf(xp);
      return { kind: "player", png: cards.playerPng({
        name: p.name || tgName, pos: p.position || "—", ovr: ovrOf(xp), ovrDelta: ovrOf(xp) - ovrOf(xp - wk.v), stage: p.status,
        rank: rank.v, weekXp: wk.v, totalXp: xp, days: days.v, id: sid, photo,
        goal: t.next ? t.next - t.from : 1, goalHave: t.next ? xp - t.from : 1,
        goalText: t.next ? `Keyingi daraja (${club.TIERS[t.i + 1][1]}): ${t.next - xp} XP` : "Eng yuqori daraja!" }),
        caption: `⚽ <b>${esc(p.name || tgName)}</b> — futbolchi kartangiz\n${p.status === "accepted" ? "✅ Asosiy tarkibda" : "⏳ Sinovda — ariza ko‘rib chiqilmoqda"} · ${POS[p.position] || ""}\n\nXP ilovada ishlash, missiyalar va hissalar orqali yig‘iladi.` };
    }
    const rk = await one(`select (select count(*)::int from members where xp > $1 or (xp = $1 and member_no < $2)) + 1 as rank,
      (select count(*)::int from members) as total`, [m.xp || 0, m.member_no]);
    const dept = m.dept && (club.DEPTS.find(d => d[0] === m.dept) || [])[2];
    const role = m.profession || dept || "Muxlis";
    const j = new Date(m.joined_at);
    return { kind: "vip", png: cards.vipPng({
      name: tgName, username: user.username ? "@" + user.username : "", role: `${role} · ${club.tierOf(m.xp || 0).name}`,
      balance: m.coins, rank: rk.rank, of: rk.total, id: sid, since: `A’zo: ${j.getDate()}-${MONTHS[j.getMonth()]} ${j.getFullYear()}`, photo }),
      caption: `🪪 <b>${esc(tgName)}</b> — Zamin FK a’zolik kartangiz\n🪙 Balans: <b>${m.coins}</b> tanga\n🏆 Reyting: <b>#${rk.rank}</b> / ${rk.total} (XP bo‘yicha)` };
  }
  const cardKb = { inline_keyboard: [[{ text: "🔄 Yangilash", callback_data: "card:re" }, { text: "🏆 Reyting", callback_data: "top" }], ...(appBtn.length ? [appBtn] : [])] };

  // leaderboard: top 10 members by XP + my place
  const MEDAL = ["🥇", "🥈", "🥉"];
  async function topText(user) {
    const top = await q("select tg_id, nick, xp from members order by xp desc, member_no asc limit 10");
    const me = await one(`select m.xp, (select count(*)::int from members x where x.xp > m.xp or (x.xp = m.xp and x.member_no < m.member_no)) + 1 as rank,
      (select count(*)::int from members) as total from members m where m.tg_id = $1`, [String(user.id)]);
    const lines = top.map((t, i) => `${MEDAL[i] || (i + 1) + "."} ${String(t.tg_id) === String(user.id) ? "<b>" + esc(t.nick) + " (siz)</b>" : esc(t.nick)} — ${t.xp} XP`);
    return `🏆 <b>Zamin FK reytingi</b> (XP bo‘yicha)\n\n${lines.join("\n") || "Hali hech kim yo‘q"}` +
      (me ? `\n\n📍 Sizning o‘rningiz: <b>#${me.rank}</b> / ${me.total} · ${me.xp} XP` : "") +
      `\n\nXP: ilovada ishlash, missiyalar, hissalar va do‘st taklif qilish orqali.`;
  }

  async function sendCard(chatId, user) {
    if (!cards.ok()) return api("sendMessage", { chat_id: chatId, text: "Karta hozircha mavjud emas." });
    const c = await cardFor(user);
    return apiFile("sendPhoto", { chat_id: chatId, caption: c.caption, parse_mode: "HTML", reply_markup: cardKb }, "photo", c.png);
  }
  async function refreshCard(cb) {
    const c = await cardFor(cb.from);
    await apiFile("editMessageMedia", { chat_id: cb.message.chat.id, message_id: cb.message.message_id, reply_markup: cardKb,
      media: { type: "photo", media: "attach://card", caption: c.caption, parse_mode: "HTML" } }, "card", c.png)
      .catch(e => { if (!/not modified/.test(e.message)) throw e; });
  }

  // ---------- broadcast: tell existing users about new features (admin only, preview -> test -> confirm, each text once) ----------
  db.query(`create table if not exists broadcasts (id serial primary key, text_hash text unique not null, text text not null,
    total int not null, sent int not null default 0, failed int not null default 0, by_admin bigint, created_at timestamptz not null default now(), done boolean not null default false)`)
    .catch(e => console.error("broadcast init", e.message));
  const pendingBc = new Map(), sleep = ms => new Promise(r => setTimeout(r, ms));
  let liveBc = null;
  const BC_SAMPLE = "🔥 ZAMIN FK: yangi yangilanishlar!\n\n🪪 /karta — endi shaxsiy VIP kartangiz rasm ko‘rinishida, o‘rningiz va reytingingiz bilan.\n🏆 /reyting — eng faol muxlislar ro‘yxati. O‘z o‘rningizni ko‘ring!\n🛡 Stadionda yangi himoyachilar: Doston va Sherzod.\n🌙 Kechasi uylarning derazalari yonadi.\n🌐 Til tugmasi yangilandi — bayroqni suring.\n📬 /feedback — taklif va fikrlaringizni yozing.\n\nKo‘rish uchun pastdagi tugmani bosing 👇";
  const bcRecipients = async () => (await q(`select distinct tg_id from (select tg_id from members union select tg_id from homes union select tg_id from seats union select tg_id from wallets) x`)).map(r => String(r.tg_id));
  const bcSend = (chat, text) => api("sendMessage", { chat_id: chat, text: esc(text), parse_mode: "HTML", ...(appBtn.length ? { reply_markup: { inline_keyboard: [appBtn] } } : {}) });
  async function bcPreview(chat, adminId, text) {
    pendingBc.set(String(adminId), text);
    const n = (await bcRecipients()).length;
    return api("sendMessage", { chat_id: chat, text: `📣 Xabar ko‘rinishi:\n\n${esc(text)}\n\nQabul qiluvchilar: ${n} ta`, parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: "🧪 Menga test", callback_data: "bc:test" }, { text: "✅ Hammasiga yuborish", callback_data: "bc:all" }], [{ text: "❌ Bekor", callback_data: "bc:no" }]] } });
  }
  async function onBroadcast(cb, data) {
    const chat = cb.message.chat.id, text = pendingBc.get(String(cb.from.id));
    if (data === "bc:sample") return bcPreview(chat, cb.from.id, BC_SAMPLE);
    if (data === "bc:no") { pendingBc.delete(String(cb.from.id)); return api("sendMessage", { chat_id: chat, text: "❌ Bekor qilindi." }); }
    if (!text) return api("sendMessage", { chat_id: chat, text: "Matn topilmadi. /xabar matn bilan qaytadan boshlang." });
    if (data === "bc:test") { await bcSend(chat, text); return api("sendMessage", { chat_id: chat, text: "🧪 Test yuborildi (faqat sizga)." }); }
    if (data === "bc:all") {
      if (liveBc && !liveBc.done) return api("sendMessage", { chat_id: chat, text: "⏳ Oldingi xabar hali yuborilmoqda." });
      const ids = await bcRecipients(), hash = require("crypto").createHash("sha256").update(text).digest("hex");
      const ins = await q("insert into broadcasts (text_hash, text, total, by_admin) values ($1,$2,$3,$4) on conflict do nothing returning id", [hash, text, ids.length, String(cb.from.id)]);
      if (!ins.length) return api("sendMessage", { chat_id: chat, text: "⚠️ Bu matn avval yuborilgan. Matnni o‘zgartiring." });
      pendingBc.delete(String(cb.from.id));
      const bid = ins[0].id; liveBc = { id: bid, total: ids.length, sent: 0, failed: 0, done: false };
      await api("sendMessage", { chat_id: chat, text: `📤 Yuborish boshlandi: ${ids.length} ta foydalanuvchi.` });
      (async () => {
        for (const id of ids) {
          try { await bcSend(id, text); liveBc.sent++; } catch (e) { liveBc.failed++; if (/Too Many Requests/i.test(e.message)) await sleep(3000); }
          await sleep(60);                                          // ~16 messages/second, under Telegram's limit
        }
        liveBc.done = true;
        await q("update broadcasts set sent = $2, failed = $3, done = true where id = $1", [bid, liveBc.sent, liveBc.failed]).catch(() => {});
        await api("sendMessage", { chat_id: chat, text: `✅ Tugadi. Yetkazildi: ${liveBc.sent}, yetib bormadi (botni bloklaganlar va h.k.): ${liveBc.failed}.` }).catch(() => {});
      })();
    }
  }

  // ---------- admin ----------
  const adminMenu = async () => {
    const n = await one(`select (select count(*)::int from applications where status = 'new') as apps,
      (select count(*)::int from feedback where status = 'new') as fb`).catch(() => ({ apps: 0, fb: 0 }));
    return { text: "🛠 <b>Admin panel</b>\nKerakli bo‘limni tanlang:", parse_mode: "HTML", reply_markup: { inline_keyboard: [
      [{ text: `📋 Yangi arizalar (${n.apps})`, callback_data: "adm:apps" }],
      [{ text: `📬 Feedback (${n.fb})`, callback_data: "adm:fb" }],
      [{ text: "📊 Statistika", callback_data: "adm:stats" }],
      [{ text: "📣 Yangiliklar yuborish", callback_data: "adm:bc" }], ...(led ? [[{ text: "📺 LED reklama", callback_data: "adm:led" }]] : []), ...(appBtn.length ? [appBtn] : [])] } };
  };
  const KIND = { city: "🏙 Shahar ishi", player: "⚽ Futbolchi", staff: "🧑‍💼 Klub xodimi" };
  const appText = a => [`📋 <b>Ariza #${a.id}</b> — ${KIND[a.kind] || a.kind}`,
    `<b>Kim:</b> ${esc(a.nick)} (<code>${a.tg_id}</code>)`, a.name && `<b>Ism:</b> ${esc(a.name)}`, a.age && `<b>Yosh:</b> ${a.age}`,
    a.position && `<b>Pozitsiya:</b> ${esc(POS[a.position] || a.position)}`, a.height && `<b>Bo‘y:</b> ${a.height}`,
    a.kind === "city" && a.role && `<b>Kasb:</b> ${esc(a.role)}`, a.dept && `<b>Bo‘lim:</b> ${esc(a.dept)}`,
    a.link && `<b>Havola:</b> ${esc(a.link)}`, a.note && `<b>Izoh:</b> ${esc(a.note)}`,
    `<i>${new Date(a.created_at).toISOString().slice(0, 16).replace("T", " ")}</i>`].filter(Boolean).join("\n");

  async function onAdmin(cb, data) {
    const chat = cb.message.chat.id;
    if (data === "adm:led") return ledMenu(chat);
    if (data === "adm:bc") return api("sendMessage", { chat_id: chat, parse_mode: "HTML", text: "📣 <b>Foydalanuvchilarga xabar</b>\n\nTayyor namunani yuborish uchun tugmani bosing. O‘zingizning matningiz uchun: <code>/xabar</code> va keyin matn.", reply_markup: { inline_keyboard: [[{ text: "📨 Tayyor namunani yuborish", callback_data: "bc:sample" }]] } });
    if (data === "adm:menu") return api("editMessageText", { chat_id: chat, message_id: cb.message.message_id, ...(await adminMenu()) });
    if (data === "adm:apps") {
      const rows = await q("select * from applications where status = 'new' order by created_at limit 5");
      if (!rows.length) return api("sendMessage", { chat_id: chat, text: "✅ Yangi ariza yo‘q." });
      for (const a of rows) await api("sendMessage", { chat_id: chat, text: appText(a), parse_mode: "HTML", disable_web_page_preview: true,
        reply_markup: { inline_keyboard: [[{ text: "✅ Qabul qilish", callback_data: "ap:accept:" + a.id }, { text: "❌ Rad etish", callback_data: "ap:reject:" + a.id }]] } });
      const left = await one("select count(*)::int as n from applications where status = 'new'");
      if (left.n > rows.length) await api("sendMessage", { chat_id: chat, text: `Yana ${left.n - rows.length} ta ariza bor — ko‘rib chiqqach, qayta bosing.`,
        reply_markup: { inline_keyboard: [[{ text: "📋 Keyingi arizalar", callback_data: "adm:apps" }]] } });
      return;
    }
    if (data.startsWith("ap:")) {
      const [, action, id] = data.split(":");
      try { await club.decideApp(cb.from, { id: Number(id), action }); }
      catch (e) { return api("answerCallbackQuery", { callback_query_id: cb.id, text: e.message === "already decided" ? "Bu ariza allaqachon ko‘rib chiqilgan" : "Xato: " + e.message, show_alert: true }); }
      const mark = action === "accept" ? "✅ <b>Qabul qilindi</b>" : "❌ <b>Rad etildi</b>";
      return api("editMessageText", { chat_id: chat, message_id: cb.message.message_id, parse_mode: "HTML", disable_web_page_preview: true,
        text: `${esc(cb.message.text || "")}\n\n${mark} — ${esc(who(cb.from))}` });
    }
    if (data === "adm:fb") {
      const rows = await q("select * from feedback where status = 'new' order by id desc limit 10");
      if (!rows.length) return api("sendMessage", { chat_id: chat, text: "✅ Yangi feedback yo‘q." });
      for (const f of rows.reverse()) await api("sendMessage", { chat_id: chat, parse_mode: "HTML",
        text: `📬 <b>Feedback #${f.id}</b>\n<b>Kimdan:</b> ${esc(f.username || "")} (<code>${f.tg_id}</code>)\n\n${esc(f.message)}`,
        reply_markup: { inline_keyboard: [[{ text: "✔️ Ko‘rildi", callback_data: "fb:done:" + f.id }]] } });
      return;
    }
    if (data.startsWith("fb:done:")) {
      await q("update feedback set status = 'done' where id = $1", [Number(data.split(":")[2]) | 0]);
      return api("editMessageText", { chat_id: chat, message_id: cb.message.message_id, text: `${cb.message.text || ""}\n\n✔️ Ko‘rildi` });
    }
    if (data === "adm:stats") {
      const s = await one(`select (select count(*)::int from members) as members,
        (select count(*)::int from members where joined_at > now() - interval '1 day') as m1,
        (select count(*)::int from members where joined_at > now() - interval '7 days') as m7,
        (select count(*)::int from homes) as homes, (select count(*)::int from seats where seat_no is not null) as seats,
        (select count(*)::int from applications where status = 'new') as apps_new,
        (select count(*)::int from applications where kind = 'player' and status = 'accepted') as players,
        (select count(*)::int from feedback where status = 'new') as fb, (select funds::int from club where id = 1) as funds,
        (select coalesce(sum(coins), 0)::int from wallets) as coins`);
      return api("sendMessage", { chat_id: chat, parse_mode: "HTML", text: [`📊 <b>Statistika</b>`, ``,
        `👥 A’zolar: <b>${s.members}</b> (bugun +${s.m1}, hafta +${s.m7})`, `🏠 Uylar: <b>${s.homes}</b>`, `🎟 O‘rindiqlar: <b>${s.seats}</b>`,
        `⚽ Tarkibdagi futbolchilar: <b>${s.players}</b>`, `📋 Yangi arizalar: <b>${s.apps_new}</b>`, `📬 Yangi feedback: <b>${s.fb}</b>`,
        `💰 Klub fondi: <b>${s.funds}</b> 🪙`, `🪙 Muxlislardagi tangalar: <b>${s.coins}</b>`].join("\n"),
        reply_markup: { inline_keyboard: [[{ text: "⬅️ Menyu", callback_data: "adm:menu" }]] } });
    }
  }


  // ---------- LED ads on the pitch-side boards (admin only) ----------
  const LED_HELP = "📺 <b>LED reklama</b> — stadion maydoni atrofidagi ekranlar.\n\n"
    + "✍️ Matnli reklama:\n<code>/reklama Matn | #fon | #rang</code>\nMasalan: <code>/reklama Coca-Cola | #e41e26 | #ffffff</code>\n\n"
    + "🖼 Rasmli reklama: rasmni <b>/reklama</b> izohi bilan yuboring (eng yaxshisi 4:1, masalan 1024×256).\n\n"
    + "Reklama bo‘lmasa, ekranlarda ZAMIN FK xabarlari ko‘rinadi.";
  async function ledMenu(chat) {
    const ads = await led.list();
    const rows = ads.map(a => [{ text: `🗑 ${a.kind === "image" ? "🖼 Rasm #" + a.id : a.text}`.slice(0, 60), callback_data: "led:del:" + a.id }]);
    if (ads.length) rows.push([{ text: "♻️ Hammasini o‘chirish", callback_data: "led:clear" }]);
    rows.push([{ text: "⬅️ Menyu", callback_data: "adm:menu" }]);
    return api("sendMessage", { chat_id: chat, parse_mode: "HTML", text: `${LED_HELP}\n\nHozir: ${ads.length}/${led.MAX_ADS} ta reklama. O‘chirish uchun bosing:`, reply_markup: { inline_keyboard: rows } });
  }
  const ledErr = e => e.message === "full" ? `Ko‘pi bilan ${led.MAX_ADS} ta reklama. Avval bittasini o‘chiring: /reklamalar` : e.message === "empty" ? "Matn bo‘sh. Masalan: /reklama Coca-Cola | #e41e26 | #ffffff" : "Xato: " + e.message;
  async function ledPhoto(msg) {
    const p = msg.photo.reduce((b, x) => Math.abs(x.width - 1280) < Math.abs(b.width - 1280) ? x : b);
    const f = await api("getFile", { file_id: p.file_id });
    const r = await fetch(`${TG_API}/file/bot${BOT_TOKEN}/${f.file_path}`);
    if (!r.ok) throw new Error("download " + r.status);
    return led.addImage(msg.from.id, Buffer.from(await r.arrayBuffer()), "image/jpeg");
  }
  async function onLed(cb, data) {
    const chat = cb.message.chat.id;
    if (data === "led:clear") { await led.clear(); return api("sendMessage", { chat_id: chat, text: "♻️ Barcha reklamalar o‘chirildi. Ekranlarda ZAMIN FK xabarlari." }); }
    const id = data.split(":")[2];
    await led.remove(id);
    return api("editMessageText", { chat_id: chat, message_id: cb.message.message_id, parse_mode: "HTML", text: `🗑 Reklama #${esc(id)} o‘chirildi.`, reply_markup: { inline_keyboard: [[{ text: "📺 Reklamalar", callback_data: "adm:led" }]] } });
  }


  // FIFA card of an accepted player, for taps on the pitch (public: only accepted players, cached 10 min)
  const pubCards = new Map();
  async function playerCardPng(appId) {
    const k = Number(appId) | 0, c = pubCards.get(k);
    if (c && Date.now() - c.at < 10 * 60e3) return c.png;
    const p = await one(`select * from applications where id = $1 and kind = 'player' and status = 'accepted'`, [k]);
    if (!p) return null;
    const m = await one(`select * from members where tg_id = $1`, [String(p.tg_id)]);
    const xp = (m && m.xp) || 0, id = String(p.tg_id);
    const wk = await one(`select coalesce(sum(xp), 0)::int as v from xp_log where tg_id = $1 and at > now() - interval '7 days'`, [id]);
    const days = await one(`select count(distinct (at at time zone 'Asia/Tashkent')::date)::int as v from
      (select at from xp_log where tg_id = $1 union all select at from ledger where tg_id = $1) x`, [id]);
    const rank = await one(`select count(distinct a.tg_id)::int + 1 as v from applications a join members mm on mm.tg_id = a.tg_id
      where a.kind = 'player' and a.status in ('new','accepted') and mm.xp > $1`, [xp]);
    const t = club.tierOf(xp);
    const png = await cards.playerPng({
      name: p.name || (m ? m.nick.replace(/^@/, "") : p.nick), pos: p.position || "—", ovr: ovrOf(xp), ovrDelta: ovrOf(xp) - ovrOf(xp - wk.v), stage: p.status,
      rank: rank.v, weekXp: wk.v, totalXp: xp, days: days.v, id: m ? club.supporterId(m.member_no) : "", photo: await profilePhoto(p.tg_id),
      goal: t.next ? t.next - t.from : 1, goalHave: t.next ? xp - t.from : 1,
      goalText: t.next ? `Keyingi daraja (${club.TIERS[t.i + 1][1]}): ${t.next - xp} XP` : "Eng yuqori daraja!" });
    pubCards.set(k, { at: Date.now(), png });
    return png;
  }

  // Returns an async job for updates this module handles, or null (then the normal bot reply runs).
  function match(update) {
    const msg = update && update.message, cb = update && update.callback_query;
    if (msg && msg.from && msg.chat && msg.chat.type === "private") {
      const t = String(msg.text || "").trim();
      if (/^\/(karta|card)(@\w+)?$/i.test(t)) return () => sendCard(msg.chat.id, msg.from);
      if (/^\/(reyting|top)(@\w+)?$/i.test(t)) return async () => api("sendMessage", { chat_id: msg.chat.id, parse_mode: "HTML", text: await topText(msg.from) });
      if (/^\/xabar(@\w+)?\s+[\s\S]{10,}$/i.test(t)) return async () => {
        if (!isAdmin(msg.from.id)) return api("sendMessage", { chat_id: msg.chat.id, text: "Bu buyruq faqat adminlar uchun." });
        return bcPreview(msg.chat.id, msg.from.id, t.replace(/^\/xabar(@\w+)?\s+/i, "").slice(0, 1500));
      };
      if (led && msg.photo && /^\/?reklama\b/i.test(String(msg.caption || "").trim())) return async () => {
        if (!isAdmin(msg.from.id)) return api("sendMessage", { chat_id: msg.chat.id, text: "Bu buyruq faqat adminlar uchun." });
        try { const id = await ledPhoto(msg); return api("sendMessage", { chat_id: msg.chat.id, text: `✅ Rasmli reklama #${id} qo‘shildi. Stadion ekranlarida 1–5 daqiqada ko‘rinadi. /reklamalar` }); }
        catch (e) { return api("sendMessage", { chat_id: msg.chat.id, text: ledErr(e) }); }
      };
      if (led && /^\/reklamalar(@\w+)?$/i.test(t)) return async () => {
        if (!isAdmin(msg.from.id)) return api("sendMessage", { chat_id: msg.chat.id, text: "Bu buyruq faqat adminlar uchun." });
        return ledMenu(msg.chat.id);
      };
      if (led && /^\/reklama(@\w+)?(\s|$)/i.test(t)) return async () => {
        if (!isAdmin(msg.from.id)) return api("sendMessage", { chat_id: msg.chat.id, text: "Bu buyruq faqat adminlar uchun." });
        const line = t.replace(/^\/reklama(@\w+)?\s*/i, "");
        if (!line) return api("sendMessage", { chat_id: msg.chat.id, parse_mode: "HTML", text: LED_HELP });
        try { const id = await led.addText(msg.from.id, line); return api("sendMessage", { chat_id: msg.chat.id, text: `✅ Reklama #${id} qo‘shildi. Stadion ekranlarida 1–5 daqiqada ko‘rinadi. /reklamalar` }); }
        catch (e) { return api("sendMessage", { chat_id: msg.chat.id, text: ledErr(e) }); }
      };
      if (/^\/admin(@\w+)?$/i.test(t)) return async () => {
        if (!isAdmin(msg.from.id)) return api("sendMessage", { chat_id: msg.chat.id, text: "Bu buyruq faqat adminlar uchun." });
        return api("sendMessage", { chat_id: msg.chat.id, ...(await adminMenu()) });
      };
    }
    if (cb && cb.from && cb.message) {
      const data = String(cb.data || "");
      return async () => {
        let answered = false;
        try {
          if (data === "card:re" || data === "card:new") {
            await api("answerCallbackQuery", { callback_query_id: cb.id, text: data === "card:re" ? "Yangilanmoqda…" : "" }); answered = true;
            return data === "card:re" ? await refreshCard(cb) : await sendCard(cb.message.chat.id, cb.from);
          }
          if (data === "top") {
            await api("answerCallbackQuery", { callback_query_id: cb.id }); answered = true;
            return await api("sendMessage", { chat_id: cb.message.chat.id, parse_mode: "HTML", text: await topText(cb.from) });
          }
          if (/^bc:/.test(data)) {
            if (!isAdmin(cb.from.id)) { answered = true; return api("answerCallbackQuery", { callback_query_id: cb.id, text: "Faqat adminlar uchun", show_alert: true }); }
            await api("answerCallbackQuery", { callback_query_id: cb.id }); answered = true;
            return await onBroadcast(cb, data);
          }
          if (led && /^led:/.test(data)) {
            if (!isAdmin(cb.from.id)) { answered = true; return api("answerCallbackQuery", { callback_query_id: cb.id, text: "Faqat adminlar uchun", show_alert: true }); }
            await api("answerCallbackQuery", { callback_query_id: cb.id }); answered = true;
            return await onLed(cb, data);
          }
          if (/^(adm|ap|fb):/.test(data)) {
            if (!isAdmin(cb.from.id)) { answered = true; return api("answerCallbackQuery", { callback_query_id: cb.id, text: "Faqat adminlar uchun", show_alert: true }); }
            if (!data.startsWith("ap:")) { await api("answerCallbackQuery", { callback_query_id: cb.id }); answered = true; }
            return await onAdmin(cb, data);
          }
        } finally { if (!answered) api("answerCallbackQuery", { callback_query_id: cb.id }).catch(() => {}); }
      };
    }
    return null;
  }
  return { match, sendCard, playerCardPng };
}
module.exports = { init, ovrOf };
