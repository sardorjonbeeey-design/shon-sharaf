// Telegram bot for ZAMIN FK: /start replies with a welcome and a Web App button that opens the existing Mini App.
// Webhook mode (not polling): Render's free plan sleeps when idle, and an incoming webhook wakes it up;
// Telegram keeps retrying delivery until the service answers, so /start is never lost.
const crypto = require("crypto");

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const TG_API = process.env.TG_API || "https://api.telegram.org";          // overridable for tests
const ADMIN_ID = process.env.ADMIN_ID || "";                               // Admin user ID for feedback
// The Mini App's current HTTPS address = this service (Render sets RENDER_EXTERNAL_URL). Not changed here.
const WEBAPP_URL = process.env.WEBAPP_URL || process.env.RENDER_EXTERNAL_URL || "";
const PUBLIC_URL = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || "";
const HOOK_PATH = "/tg/webhook";
const SECRET = BOT_TOKEN ? crypto.createHash("sha256").update("zfk-webhook:" + BOT_TOKEN).digest("hex").slice(0, 48) : "";
const info = { username: "", webhook: "off" };

const esc = s => String(s || "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const BUTTON = "⚽ Shaharni ochish";
function welcome(user) {
  const name = esc(user && (user.first_name || user.username) || "do‘stim");
  return `Assalomu alaykum, <b>${name}</b>! 👋\n\n` +
    `<b>ZAMIN FK</b> shahriga xush kelibsiz! ⚽🏟\n\n` +
    `Bu yerda siz:\n` +
    `🎟 Stadionda o‘z o‘rindig‘ingizni olasiz\n` +
    `🏠 Shaharda o‘z uyingizni qurasiz\n` +
    `💼 Shaharni birga qurish uchun ishga ariza topshirasiz\n\n` +
    `Boshlash uchun pastdagi tugmani bosing 👇`;
}
const isStart = text => /^\/start(@\w+)?(\s|$)/i.test(String(text || "").trim());
const isFeedback = text => /^\/feedback(@\w+)?(\s|$)/i.test(String(text || "").trim());

let feedbackDb = null, feedbackReady = Promise.resolve();
function initFeedback(db) {
  feedbackDb = db;
  if (!db) return;
  feedbackReady = db.query(`
    create table if not exists feedback (
      id bigserial primary key, tg_id bigint, username text, message text,
      created_at timestamptz default now());`).catch(e => console.error("feedback table", e.message));
}

async function saveFeedback(tgId, username, text) {
  if (!feedbackDb) return;
  try {
    await feedbackReady;
    await feedbackDb.query("insert into feedback (tg_id, username, message) values ($1, $2, $3)", [tgId, username, text]);
    if (ADMIN_ID && text && BOT_TOKEN) {
      const msg = `📬 <b>Yangi feedback:</b>\n\n<b>Foydalanuvchi:</b> @${username || tgId}\n<b>Xabar:</b> ${esc(text)}`;
      await api("sendMessage", { chat_id: ADMIN_ID, text: msg, parse_mode: "HTML" }).catch(e => console.error("admin notify", e.message));
    }
  } catch (e) { console.error("save feedback", e.message); }
}

// Build the reply for one update. Returned object is sent back in the webhook HTTP response
// (Telegram executes it), so answering needs no extra outbound request.
function replyFor(update) {
  const msg = update && (update.message || update.edited_message);
  if (msg && msg.chat && msg.from && /^\/id(@\w+)?$/i.test(String(msg.text || "").trim()))     // helper for setting ADMIN_IDS
    return { method: "sendMessage", chat_id: msg.chat.id, text: `Sizning Telegram ID raqamingiz: <code>${msg.from.id}</code>`, parse_mode: "HTML" };
  if (msg && msg.chat && msg.from && isFeedback(msg.text)) {
    saveFeedback(msg.from.id, msg.from.username || msg.from.first_name, "");
    return { method: "sendMessage", chat_id: msg.chat.id, text: "Fikringizni yozib yuboring 📝", parse_mode: "HTML" };
  }
  if (msg && msg.chat && msg.from && msg.text && !isStart(msg.text)) {
    saveFeedback(msg.from.id, msg.from.username || msg.from.first_name, msg.text);
    return { method: "sendMessage", chat_id: msg.chat.id, text: "Rahmat! 🙏 Fikringiz saqlandi.", parse_mode: "HTML" };
  }
  if (!msg || !msg.chat || !isStart(msg.text)) return null;
  const reply = { method: "sendMessage", chat_id: msg.chat.id, text: welcome(msg.from), parse_mode: "HTML" };
  if (WEBAPP_URL.startsWith("https://")) reply.reply_markup = { inline_keyboard: [[{ text: BUTTON, web_app: { url: WEBAPP_URL } }]] };
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
      await api("setWebhook", { url, secret_token: SECRET, allowed_updates: ["message"], max_connections: 20 });
      info.webhook = "ok"; console.log(`bot: @${info.username} webhook ok -> ${url}`); return;
    } catch (e) { console.error("bot setup", e.message); await new Promise(r => setTimeout(r, 2000 * 2 ** i)); }
  }
  info.webhook = "error";
}

let startHook = null;
const setStartHook = fn => { startHook = fn; };
function mount(app) {
  app.post(HOOK_PATH, async (req, res) => {
    if (!SECRET || req.get("X-Telegram-Bot-Api-Secret-Token") !== SECRET) return res.sendStatus(401);
    let reply = null;
    try { reply = replyFor(req.body); } catch (e) { console.error("bot update", e.message); }
    const msg = req.body && req.body.message, payload = reply && msg && String(msg.text || "").trim().split(/\s+/)[1];
    if (payload && startHook && msg.from) { try { await startHook(msg.from, payload); } catch (e) { console.error("start hook", e.message); } }
    if (!reply) return res.sendStatus(200);
    res.json(reply);
  });
  app.get("/tg/status", (req, res) => res.json({ bot: !!BOT_TOKEN, username: info.username, webhook: info.webhook, webapp: WEBAPP_URL }));
}

module.exports = { mount, setup, replyFor, info, SECRET, HOOK_PATH, BUTTON, setStartHook, api, initFeedback };
