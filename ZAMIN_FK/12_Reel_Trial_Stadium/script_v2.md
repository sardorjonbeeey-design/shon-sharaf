# ZAMIN FK — Trial Reel v2: «Stadionni to'ldiring» (1080x1920, 30 fps, ~50s)

Yangilangan raqamlar: 17,674 o'rindiq, 1,200 band (7%).
CTA: "Obuna bo'ling — o'rningizni band qiling"
Stadion: Crown Arena (premium-stadium.js), 1,203 muxlis (fans_instagram.json).

## Beats

### Beat 1 — INTRO (0–3s)
**Shot**: `06_topdown` — Bird's eye, full pitch from directly above
**Narrator**: "Bu — Zamin FK stadioni."
**Overlay**: ZAMIN FK logo fade-in center, boom SFX

### Beat 2 — SCALE (3–6s)
**Shot**: `09_top_34` — 3/4 overhead, seats + Crown Arena sign
**Narrator**: "O'n yetti mingdan ortiq o'rindiq."
**Overlay**: Counter animates 0 → 17,674, whoosh SFX

### Beat 3 — FANS FILL (6–9s)
**Shot**: `02_approach` — Crown Arena front approach
**Narrator**: "Uni muxlislar to'ldiradi."
**Overlay**: Seats light up wave, crowd roar rises

### Beat 4 — RULE (9–13s)
**Shot**: `07_inside_stands` — Inside stadium, fans + pitch panorama
**Narrator**: "Har bir obunachi — bitta virtual muxlis. Stadionda bitta o'rin."
**Overlay**: "1 obunachi = 1 o'rin" text, pop SFX

### Beat 5 — YOUR NAME (13–17s)
**Shot**: `10_fans_close` — Close on fans in blue seats, VIP behind
**Narrator**: "Obuna bo'ling, izoh qoldiring — ismingiz o'z o'rningizda turadi!"
**Overlay**: Name tag "@sardorjonbeeey" highlights, glow pulse

### Beat 6 — PROGRESS (17–21s)
**Shot**: `08_pitch_level` — From stands looking across, colorful fans
**Narrator**: "Har yangi qismda stadion qanday to'layotganini ko'rasiz."
**Overlay**: Progress bar animating

### Beat 7 — STATUS (21–26s)
**Shot**: `11_corner` — Dramatic corner diagonal
**Narrator**: "O'n yetti ming olti yuz yetmish to'rt o'rindiq. Ming ikki yuz tasi band!"
**Overlay**: Counter 1,200 / 17,674 + progress ring 7%

### Beat 8 — URGENCY (26–31s)
**Shot**: `12_behind_goal` — Behind goal, stands rising high
**Narrator**: "Yana o'n olti mingdan ko'proq joy bor. Lekin tezlik bilan to'lmoqda!"
**Overlay**: Empty seats glow/pulse blue

### Beat 9 — FOUNDERS (31–36s)
**Shot**: `14_tunnel` — Tunnel view, low and dramatic
**Narrator**: "Birinchi ikki ming muxlis — klubning asoschilari."
**Overlay**: Milestone markers: 2K → 5K → 10K → 17,674

### Beat 10 — SCALE COMPARE (36–41s)
**Shot**: `13_high_side` — High side panorama, full arena
**Narrator**: "Ellik kishi — to'la avtobus. Ming kishi — butun mahalla!"
**Overlay**: Bus icon × 20 = 1000 animation

### Beat 11 — SHARE (41–46s)
**Shot**: `15_scoreboard` — Scoreboard angle, ZAMIN FK sign
**Narrator**: "Keyingi qurilishni ham siz tanlaysiz. Do'stingiz futbolni yaxshi ko'radimi? Ulashing!"
**Overlay**: Share arrow icon, friend tag pulse

### Beat 12 — CTA (46–50s)
**Shot**: `01_aerial` — High aerial, stadium in city grid
**Narrator**: "Obuna bo'ling — o'rningizni band qiling!"
**Overlay**: Progress ring 7%, CTA button "Obuna bo'ling — o'rningizni band qiling", boom SFX

## Caption v2

Bu — Zamin FK stadioni. 17,674 o'rindiq. 1,200 tasi allaqachon band 🏟
Har bir obunachi = bitta virtual muxlis. Ismingiz o'z o'rningizda turadi.
Hozir: 1,200 / 17,674 (7%). Birinchi 2,000 muxlis — klubning asoschilari 💙
Obuna bo'ling, izoh qoldiring: «Men shu yerdaman!» 👇
Do'stingiz futbolni yaxshi ko'rsa — ulashing.
(Muxlislar — virtual o'yin mexanikasi. Video AI yordamida yaratilgan.)
#ZaminFK #futbol #Uzbekiston #SizQurasiz #CrownArena

## Build

Voice: 12 blocks via ElevenLabs / Poyo TTS
Rebuild: `python3 prep_voice_v2.py && node render_v2.js video build/silent_v2.mp4 && python3 make_v2.py`
