// Pitch-side LED ads, managed by admins from the bot (/reklama, /reklamalar). The stadium page reads /api/led.
const MAX_ADS = 12;
const HEX = /^#[0-9a-f]{6}$/i;

function init({ app, db }) {
  const q = (sql, a) => db.query(sql, a).then(r => r.rows);
  const ready = db.query(`create table if not exists led_ads (id serial primary key, kind text not null, text text, bg text, fg text,
    img bytea, mime text, by_admin bigint, created_at timestamptz not null default now())`).catch(e => console.error("led init", e.message));

  const cors = (req, res, next) => { res.set("Access-Control-Allow-Origin", "*"); next(); };
  app.get("/api/led", cors, async (req, res) => {
    try {
      await ready;
      const rows = await q("select id, kind, text, bg, fg from led_ads order by id");
      res.set("Cache-Control", "no-store");
      res.json(rows.map(r => r.kind === "image" ? { id: r.id, kind: "image", img: "/api/led/img/" + r.id } : { id: r.id, kind: "text", text: r.text, bg: r.bg, fg: r.fg }));
    } catch (e) { console.error("led list", e.message); res.status(500).json({ error: "server" }); }
  });
  app.get("/api/led/img/:id", cors, async (req, res) => {
    try {
      const r = (await q("select img, mime from led_ads where id = $1 and kind = 'image'", [Number(req.params.id) || 0]))[0];
      if (!r) return res.sendStatus(404);
      res.set("Content-Type", r.mime || "image/jpeg").set("Cache-Control", "public, max-age=86400").send(r.img);
    } catch (e) { console.error("led img", e.message); res.sendStatus(500); }
  });

  const count = async () => Number((await q("select count(*)::int n from led_ads"))[0].n);
  // "Coca-Cola | #e41e26 | #ffffff" -> text ad (colours optional)
  async function addText(adminId, line) {
    const [text, bg, fg] = line.split("|").map(s => s.trim());
    if (!text) throw new Error("empty");
    if (await count() >= MAX_ADS) throw new Error("full");
    const row = (await q("insert into led_ads (kind, text, bg, fg, by_admin) values ('text', $1, $2, $3, $4) returning id",
      [text.slice(0, 40), HEX.test(bg || "") ? bg : "#1F4FB8", HEX.test(fg || "") ? fg : "#FFFFFF", adminId]))[0];
    return row.id;
  }
  async function addImage(adminId, buf, mime) {
    if (await count() >= MAX_ADS) throw new Error("full");
    return (await q("insert into led_ads (kind, img, mime, by_admin) values ('image', $1, $2, $3) returning id", [buf, mime || "image/jpeg", adminId]))[0].id;
  }
  const list = () => q("select id, kind, text, bg, fg from led_ads order by id");
  const remove = id => q("delete from led_ads where id = $1", [Number(id) || 0]);
  const clear = () => q("delete from led_ads");
  return { addText, addImage, list, remove, clear, MAX_ADS };
}
module.exports = { init };
