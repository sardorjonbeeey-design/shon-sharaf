# ZAMIN FK — 15 soniyalik sinov Reel (1080×1920, 30 fps, 15.000 s)

Maqsad: yangi tomoshabin klubni kuzatibgina qolmay, uni boshqarishini his qilsin. Ovoz: SARHAD-SIZ (`rwtcHtZgYU6HN2zLNBlf`), Poyo `elevenlabs-v4-tts`, `uz`, tezlik ×1.10–1.30 (har qator o‘z 3 soniyalik oynasiga sig‘adi).

| Vaqt | Tasvir (haqiqiy 3D stadion) | Diktor (`voice/NN.mp3`, moslangan `NN_fit.wav`) | Ekran matni |
|---|---|---|---|
| 0–3 | Past burchakdan kran: tribuna, tom, LED ekran, so‘ng butun stadion | 01 «Tasavvur qiling: butun bir futbol klubini SIZ boshqarasiz!» | KLUBNI SIZ BOSHQARASIZ! (1-kadrdan ko‘rinadi) |
| 3–6 | Maydonga «SIZ» ko‘ylakli yangi futbolchi chiqadi, kamera aylanib old tomonga o‘tadi | 02 «Qaysi futbolchi keladi? SIZ hal qilasiz!» | FUTBOLCHI · SIZ HAL QILASIZ! |
| 6–9 | Bir xil kameradan eski stadion → hozirgi (yuqori tribuna + baland tom), pastdan yuqoriga o‘tish | 03 «Klub qanday rivojlanadi? SIZ tanlaysiz!» | KLUB RIVOJI · SIZ TANLAYSIZ! · OLDIN → HOZIR |
| 9–12 | Tasdiqlangan echki (`goat_chew.png`, o‘zgartirilmagan) objektivga qaraydi, yuziga sekin yaqinlashadi | 04 «Bu yerda siz shunchaki muxlis emassiz!» | SHUNCHAKI MUXLIS EMASSIZ! |
| 12–15 | Qorong‘i stadion, gerb | 05 «Obuna bo‘ling. Zamin FK boshqaruviga qo‘shiling!» | SIZ BOSHQARASIZ. / SIZ TANLAYSIZ. / BIZ BAJARAMIZ. / ZAMIN FK |

Subtitrlar: so‘zma-so‘z (Poyo `timestamps`), faol so‘z sariq. Ovoz dizayni: har kesishda zarba + shamol, 0–3 da riser, so‘nggi uch qatorda uch zarba, olomon shovqini, Day 6 musiqasi (`06_Episode_06/sfx/music.mp3`).
Qoidalar: moliyaviy hisoblagich, Telegram reklamasi, yashirin loyiha, avtomatik tarkib va'dasi — yo‘q. Yangi futbolchi ko‘ylagida ism o‘rniga «SIZ ?» (haqiqiy o‘yinchi emas).

## Qayta yig‘ish
`node render3d.js video s1|s2|s3` va `ZFK_OLD=1 node render3d.js video s3` (eski stadion: `build/old` = `git archive 8f0d26b web/stadium`), `node render3d.js plate goat_bg|end_bg`, `python3 prep_voice.py`, `node render_overlay.js`, `python3 assemble.py` (`--audio` — faqat ovoz). Kadr tekshiruvi: `node render3d.js frames s2 2.3,2.9`, `node render_overlay.js 0,4.5,12.7`.
