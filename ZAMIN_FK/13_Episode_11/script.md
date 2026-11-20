# ZAMIN FK — Day 11 Reel «Va’dani bajardik» (1080×1920, 30 fps, ~39 s)
Mexanika: Day 10 g‘olibi (35 layk, @islom.muhammadov7, asl skrinshot `assets/comment_winner.jpg`) → haqiqiy qurilish → «yangi muxlislar ro‘yxati» (bitta qog‘oz-ekran, ≥5 s ushlab turiladi) → CTA «topdim» / obuna → keyingi g‘oya (eng ko‘p layk = quriladi).
Haqiqiy amalga oshirish: `web/stadium/template.html` — MEGA MARKET (premium savdo markazi) va UZUN BINO (baland mehmonxona minorasi), kirish ko‘chaga (shimol) qaragan, stadion bilan bir xil dizayn tili. Ko‘rsatish: `dist/index.html` (`python3 web/stadium/build.py web/stadium/fans_instagram.json`).
Voice: Poyo `elevenlabs-v4-tts` (6 blok, `voice/`). Ro‘yxat: `fans_instagram.json` dagi oxirgi 54 ta nik (`film.html` ichida NAMES).
Qayta yig‘ish: `python3 prep_voice.py` → `node render_city.js 5.6` (haqiqiy shahar kadrlari, `build/city/`) → `node render.js video build/silent.mp4` → `python3 make.py`. Kadr tekshiruvi: `node render.js frames 0.6,15,31`.
