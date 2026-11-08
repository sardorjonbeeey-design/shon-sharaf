import { neon } from "@neondatabase/serverless";

let sql;
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  return (sql ??= neon(process.env.DATABASE_URL));
}

export function send(res, status, body) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", status === 200 ? "s-maxage=10, stale-while-revalidate=30" : "no-store");
  res.status(status).send(JSON.stringify(body));
}

export async function readState(sql) {
  const [[stats], fans] = await Promise.all([
    sql`select followers, updated_at from club_stats where id = 1`,
    sql`select id, name, city, seat_section as section, seat_row as row, seat_number as number, created_at
        from fans order by created_at desc`,
  ]);
  return { followers: stats?.followers ?? 0, updatedAt: stats?.updated_at ?? null, fans };
}
