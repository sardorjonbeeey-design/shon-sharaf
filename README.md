# FK Shon-Sharaf — Stadion va Shahar

Muxlislar soni Neon (Postgres) bazasidan jonli o'qiladi. Stadion tribunalar, o'rindiqlar va atrofdagi shahar
(yo'llar, avtoturargoh, binolar, projektorlar, tungi chiroqlar) obunachilar soniga qarab 4 bosqichda rivojlanadi.
Ro'yxatdan o'tgan har bir muxlis tribunada o'z ismli o'rindig'ini oladi (oltin rangda).

| Bosqich | Ochiladi | Sig'im |
|---|---|---|
| Oddiy Maydon | 0 | 100 |
| Yog'och Tribuna | 100 | 300 |
| Plastik Stadion | 300 | 720 |
| Professional Arena | 720 | 2000 |

## O'rnatish (Vercel + Neon)
1. Neon SQL Editor'da `db/schema.sql` ni ishga tushiring.
2. Vercel'ga repo'ni ulang, Environment Variables:
   - `DATABASE_URL` — Neon connection string (Vercel Neon integratsiyasi avtomatik qo'shadi)
   - `ADMIN_TOKEN` — obunachilar sonini yangilash uchun maxfiy kalit
3. Deploy.

## API
- `GET /api/stadium` — `{ followers, updatedAt, fans[] }`
- `POST /api/fans` `{ name, city? }` — muxlisni ro'yxatga oladi va keyingi bo'sh o'rindiqni beradi
- `POST /api/stadium` `{ followers }` + `Authorization: Bearer $ADMIN_TOKEN` — obunachilar sonini yangilash

Obunachilar sonini to'g'ridan-to'g'ri Neon'da ham o'zgartirish mumkin:
`update club_stats set followers = 250, updated_at = now() where id = 1;`

API ishlamasa (masalan GitHub Pages), sahifa `index.html` dagi `FALLBACK_FOLLOWERS` bilan oflayn rejimda ochiladi.
