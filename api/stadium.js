// GET  /api/stadium  -> { followers, updatedAt, fans[] }
// POST /api/stadium  -> admin: { followers } with header Authorization: Bearer $ADMIN_TOKEN
import { db, send, readState } from "./_db.js";

export default async function handler(req, res) {
  try {
    const sql = db();
    if (req.method === "GET") return send(res, 200, await readState(sql));

    if (req.method === "POST") {
      const token = process.env.ADMIN_TOKEN;
      if (!token || req.headers.authorization !== `Bearer ${token}`) return send(res, 401, { error: "Ruxsat yo'q" });
      const followers = Number(req.body?.followers);
      if (!Number.isInteger(followers) || followers < 0) return send(res, 400, { error: "followers butun son bo'lishi kerak" });
      await sql`insert into club_stats (id, followers, updated_at) values (1, ${followers}, now())
                on conflict (id) do update set followers = excluded.followers, updated_at = now()`;
      return send(res, 201, { followers });
    }

    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return send(res, 500, { error: "Server xatosi" });
  }
}
