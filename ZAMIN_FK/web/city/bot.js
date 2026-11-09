// Telegram bot for ZAMIN FK: /start replies with a welcome and a Web App button that opens the existing Mini App.
// Webhook mode (not polling): Render's free plan sleeps when idle, and an incoming webhook wakes it up;
// Telegram keeps retrying delivery until the service answers, so /start is never lost.
const crypto = require("crypto");

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const TG_API = process.env.TG_API || "https://api.telegram.org";          // overridable for tests
// Admin channel (bot must be an admin there): chat id like -100123... or @channelname. Activity log goes here.
const ADMIN_CHANNEL = String(process.env.ADMIN_CHANNEL || process.env.ADMIN_CHANNEL_ID || process.env.ADMIN_CHAT_ID || "").trim();
// Admins who also get feedback in a private message (ADMIN_ID and/or ADMIN_IDS, comma separated).
const ADMIN_DM = [...new Set(String((process.env.ADMIN_ID || "") + "," + (process.env.ADMIN_IDS || "")).split(/[\s,]+/).filter(Boolean))];
// The Mini App's current HTTPS address = this service (Render sets RENDER_EXTERNAL_URL). Not changed here.
const WEBAPP_URL = process.env.WEBAPP_URL || process.env.RENDER_EXTERNAL_URL || "";
const PUBLIC_URL = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || "";
const HOOK_PATH = "/tg/webhook";
const SECRET = BOT_TOKEN ? crypto.createHash("sha256").update("zfk-webhook:" + BOT_TOKEN).digest("hex").slice(0, 48) : "";
const info = { username: "", webhook: "off" };

const esc = s => String(s ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const BUTTON = "⚽ Shaharni ochish";
function welcome(user) {
  const name = esc(user && (user.first_name || user.username) || "do‘stim");
  return `Assalomu alaykum, <b>${name}</b>! 👋\n\n` +
    `<b>ZAMIN FK</b> shahriga xush kelibsiz! ⚽🏟\n\n` +
    `Bu yerda siz:\n` +
    `🎟 Stadionda o‘z o‘rindig‘ingizni olasiz\n` +
    `🏠 Shaharda o‘z uyingizni qurasiz\n` +
    `💼 Shaharni birga qurish uchun ishga ariza topshirasiz\n` +
    `🪪 Kartangiz: /karta\n` +
    `📝 Taklif yoki muammo bo‘lsa: /feedback\n\n` +
    `Boshlash uchun pastdagi tugmani bosing 👇`;
}
const isStart = text => /^\/start(@\w+)?(\s|$)/i.test(String(text || "").trim());
const FEEDBACK_RE = /^\/feedback(@\w+)?(?:\s+([\s\S]*))?$/i;

// ---------- admin channel log: fire-and-forget, never blocks or breaks a request ----------
let logChain = Promise.resolve();
function log(title, fields) {
  if (!ADMIN_CHANNEL || !BOT_TOKEN) return;
  const lines = Object.entries(fields || {}).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => `<b>${esc(k)}:</b> ${esc(v)}`);
  const text = `<b>${esc(title)}</b>\n` + lines.join("\n");
  logChain = logChain.then(() => api("sendMessage", { chat_id: ADMIN_CHANNEL, text: text.slice(0, 4000), parse_mode: "HTML", disable_web_page_preview: true }))
    .catch(e => console.error("admin channel", e.message));
}
const who = u => u ? (u.username ? "@" + u.username : [u.first_name, u.last_name].filter(Boolean).join(" ") || "—") + ` (${u.id})` : "—";

// ---------- feedback: /feedback <text>, or /feedback then the next message ----------
let fbDb = null, fbReady = Promise.resolve();
const fbMem = [], awaiting = new Map();                    // tg_id -> time /feedback was sent (10 min window)
function initFeedback(db) {
  fbDb = db || null;
  if (!db) return;
  fbReady = db.query(`create table if not exists feedback (id bigserial primary key, tg_id bigint, username text, message text,
      created_at timestamptz default now());
    alter table feedback add column if not exists status text not null default 'new';
    create index if not exists feedback_created_idx on feedback (created_at desc);`).catch(e => console.error("feedback init", e.message));
}
async function saveFeedback(from, text) {
  const body = String(text || "").trim().slice(0, 2000);
  if (!body) return;
  const uname = from.username || from.first_name || "";
  let id = null;
  try {
    if (fbDb) { await fbReady; id = (await fbDb.query("insert into feedback (tg_id, username, message) values ($1,$2,$3) returning id", [from.id, uname, body])).rows[0].id; }
    else fbMem.push({ tg_id: from.id, username: uname, message: body, created_at: new Date() });
  } catch (e) { console.error("save feedback", e.message); }
  const t = `📬 <b>Yangi feedback</b>${id ? " #" + id : ""}\n<b>Kimdan:</b> ${esc(who(from))}\n\n${esc(body)}`;
  if (BOT_TOKEN) for (const chat of ADMIN_DM) api("sendMessage", { chat_id: chat, text: t.slice(0, 4000), parse_mode: "HTML" }).catch(e => console.error("feedback dm", e.message));
  log("📬 Feedback" + (id ? " #" + id : ""), { "Kimdan": who(from), "Xabar": body.slice(0, 1500) });
}

// Build the reply for one update. Returned object is sent back in the webhook HTTP response
// (Telegram executes it), so answering needs no extra outbound request.
function replyFor(update) {
  const msg = update && (update.message || update.edited_message);
  if (msg && msg.chat && msg.from && /^\/id(@\w+)?$/i.test(String(msg.text || "").trim()))     // helper for setting ADMIN_IDS
    return { method: "sendMessage", chat_id: msg.chat.id, text: `Sizning Telegram ID raqamingiz: <code>${msg.from.id}</code>`, parse_mode: "HTML" };
  if (msg && msg.chat && msg.from && msg.chat.type === "private") {
    const text = String(msg.text || "").trim(), fb = text.match(FEEDBACK_RE);
    if (fb) {
      const body = (fb[2] || "").trim();
      if (body) { awaiting.delete(String(msg.from.id)); saveFeedback(msg.from, body);
        return { method: "sendMessage", chat_id: msg.chat.id, text: "Rahmat! 🙏 Fikringiz adminga yuborildi." }; }
      awaiting.set(String(msg.from.id), Date.now());
      return { method: "sendMessage", chat_id: msg.chat.id, text: "📝 Taklif, savol yoki muammoni bitta xabarda yozib yuboring." };
    }
    const since = awaiting.get(String(msg.from.id));
    if (since && text && !text.startsWith("/")) {
      awaiting.delete(String(msg.from.id));
      if (Date.now() - since < 10 * 60e3) { saveFeedback(msg.from, text);
        return { method: "sendMessage", chat_id: msg.chat.id, text: "Rahmat! 🙏 Fikringiz adminga yuborildi." }; }
    }
  }
  if (!msg || !msg.chat || !isStart(msg.text)) return null;
  const reply = { method: "sendMessage", chat_id: msg.chat.id, text: welcome(msg.from), parse_mode: "HTML" };
  reply.reply_markup = { inline_keyboard: [...(WEBAPP_URL.startsWith("https://") ? [[{ text: BUTTON, web_app: { url: WEBAPP_URL } }]] : []), [{ text: "🪪 Mening kartam", callback_data: "card:new" }]] };
  return reply;
}

async function api(method, body) {
  const r = await fetch(`${TG_API}/bot${BOT_TOKEN}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
  const d = await r.json().catch(() => ({}));
  if (!d.ok) throw new Error(`${method}: ${d.description || r.status}`);
  return d.result;
}

// Register the webhook on startup. A webhook pointing somewhere else is left alone unless BOT_WEBHOOK_FORCE=1,
// so another integration using this bot is never silently cut off.
async function setup() {
  if (!BOT_TOKEN) { console.log("bot: no BOT_TOKEN, /start disabled"); return; }
  if (!PUBLIC_URL.startsWith("https://")) { console.log("bot: no public https URL (RENDER_EXTERNAL_URL/PUBLIC_URL), webhook not set"); return; }
  const url = PUBLIC_URL.replace(/\/$/, "") + HOOK_PATH;
  for (let i = 0; i < 5; i++) {
    try {
      const me = await api("getMe"); info.username = me.username || "";
      const wh = await api("getWebhookInfo");
      if (wh.url && wh.url !== url && process.env.BOT_WEBHOOK_FORCE !== "1") {
        info.webhook = "foreign"; console.warn(`bot: webhook already points to another URL (${wh.url.replace(/bot\d+:[\w-]+/, "bot***")}); set BOT_WEBHOOK_FORCE=1 to take it over`); return;
      }
      await api("setWebhook", { url, secret_token: SECRET, allowed_updates: ["message", "callback_query"], max_connections: 20 });
      await api("setMyCommands", { commands: [{ command: "start", description: "Boshlash" }, { command: "karta", description: "Mening kartam" }, { command: "feedback", description: "Taklif yoki muammo" }] }).catch(e => console.error("commands", e.message));
      for (const chat of ADMIN_DM) api("setMyCommands", { scope: { type: "chat", chat_id: chat }, commands: [{ command: "start", description: "Boshlash" }, { command: "karta", description: "Mening kartam" },
        { command: "admin", description: "Admin panel" }, { command: "feedback", description: "Taklif yoki muammo" }] }).catch(e => console.error("admin commands", e.message));
      info.webhook = "ok"; console.log(`bot: @${info.username} webhook ok -> ${url}`); return;
    } catch (e) { console.error("bot setup", e.message); await new Promise(r => setTimeout(r, 2000 * 2 ** i)); }
  }
  info.webhook = "error";
}

let startHook = null, asyncHandler = null;
const setAsyncHandler = fn => { asyncHandler = fn; };     // botui.js: /karta, /admin and inline buttons
const setStartHook = fn => { startHook = fn; };
function mount(app) {
  app.post(HOOK_PATH, async (req, res) => {
    if (!SECRET || req.get("X-Telegram-Bot-Api-Secret-Token") !== SECRET) return res.sendStatus(401);
    let job = null;
    try { job = asyncHandler && asyncHandler(req.body); } catch (e) { console.error("bot ui", e.message); }
    if (job) { res.sendStatus(200); Promise.resolve().then(job).catch(e => console.error("bot ui", e.message)); return; }
    let reply = null;
    try { reply = replyFor(req.body); } catch (e) { console.error("bot update", e.message); }
    const msg = req.body && req.body.message, payload = reply && msg && String(msg.text || "").trim().split(/\s+/)[1];
    if (payload && startHook && msg.from) { try { await startHook(msg.from, payload); } catch (e) { console.error("start hook", e.message); } }
    if (!reply) return res.sendStatus(200);
    res.json(reply);
  });
  app.get("/tg/status", (req, res) => res.json({ bot: !!BOT_TOKEN, username: info.username, webhook: info.webhook, webapp: WEBAPP_URL, adminChannel: !!ADMIN_CHANNEL, adminDm: ADMIN_DM.length }));
}

module.exports = { mount, setup, replyFor, info, SECRET, HOOK_PATH, BUTTON, setStartHook, setAsyncHandler, api, initFeedback, log, who, esc, WEBAPP_URL, BOT_TOKEN, TG_API };
