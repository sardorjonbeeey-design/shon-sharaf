// POST /api/fans { name, city? } -> registers a fan and assigns the next free seat.
import { db, send } from "./_db.js";
import { tierFor, seatOrder, seatKey } from "../lib/stadium.js";

const clean = (v, max) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "Method not allowed" });
  }
  const name = clean(req.body?.name, 40);
  const city = clean(req.body?.city, 40) || null;
  if (name.length < 2) return send(res, 400, { error: "Ism kamida 2 harf bo'lishi kerak" });

  try {
    const sql = db();
    for (let attempt = 0; attempt < 5; attempt++) {
      const [[stats], taken] = await Promise.all([
        sql`select followers from club_stats where id = 1`,
        sql`select seat_section as section, seat_row as row, seat_number as number from fans`,
      ]);
      const followers = Math.max(stats?.followers ?? 0, taken.length + 1);
      const { tier } = tierFor(followers);
      const used = new Set(taken.map(seatKey));
      const seat = seatOrder(tier).find((s) => !used.has(seatKey(s)));
      if (!seat) return send(res, 409, { error: "Stadion to'la! Keyingi bosqichni kuting." });

      try {
        const [fan] = await sql`
          insert into fans (name, city, seat_section, seat_row, seat_number)
          values (${name}, ${city}, ${seat.section}, ${seat.row}, ${seat.number})
          returning id, name, city, seat_section as section, seat_row as row, seat_number as number, created_at`;
        return send(res, 201, { fan });
      } catch (e) {
        if (e.code !== "23505") throw e; // seat grabbed concurrently -> retry
      }
    }
    return send(res, 503, { error: "Qayta urinib ko'ring" });
  } catch (e) {
    console.error(e);
    return send(res, 500, { error: "Server xatosi" });
  }
}
