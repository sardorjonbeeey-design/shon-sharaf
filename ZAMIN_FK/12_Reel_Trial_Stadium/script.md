# ZAMIN FK — sinov video: «Stadionni to‘ldiring» (1080×1920, 30 fps, 49.2 s)
Namuna: strukturasi o‘xshash (hisoblagich → 1 obunachi = 1 o‘rin → ismingiz o‘rningizda → izoh → stadion to‘lishi → 1-vazifa → masshtab → «keyingi qurilishni siz tanlaysiz» → do‘stga ulashing). Tasvir va raqamlar — o‘zimizniki.
Tasvir: yangi vokselli neon 3D sahna (`stadium.html`, three.js, har kadr kod bilan; kameralar — tepadan, qator bo‘ylab, o‘rindiqqa sho‘ng‘ish, orbita, avtobus, maktab, uchastkalar). Real raqamlar: 305 obunachi (Windsor, 2026-11-15), maqsad 500. «TASAVVUR» — 500 ta muxlis namoyishi, aniq belgilangan. «@sizning_ism» — o‘rinbosar.
Ovoz: Poyo `elevenlabs-v4-tts`, 8 blok (`voice/`). Qayta yig‘ish: `python3 prep_voice.py && node render.js video build/silent.mp4 && python3 make.py`; kadr tekshiruvi: `node render.js frames 3,13,30`.
Raqamlarni yangilash: `REAL` (stadium.html) va narrator matnidagi «uch yuz besh / bir yuz to‘qson besh».
Story: `node story.js 750` → `exports/ZFK_story_750_muxlis.png/.jpg` (single frame of the same 3D scene; count is a parameter).
