# 28-video — «Ismingizni toping» (Reel, 36.1 s)

**Maqsad:** yangi obunachi. Mexanika — sovrin emas, **qidiruv o‘yini**: ekranda 1 306 ta
haqiqiy obunachi ismi, odam o‘zinikini qidiradi, to‘xtatadi, qayta ko‘radi va
storyga oladi. Ismi yo‘q odam uchun CTA tabiiy: obuna + izohga «+».

Ovoz: Poyo `elevenlabs-v4-tts`, `voice rwtcHtZgYU6HN2zLNBlf`, `uz`, `timestamps:true`.
3D: voksel-neon stadion (`film.html`, three.js r128), 22-video sahnasidan rivojlantirilgan.
Ismlar — DOM qatlamida (har qanday masshtabda o‘tkir), joyiga bog‘langan, bir-birining
ustiga tushmaydi va **o‘qilmasa — ko‘rsatilmaydi** (shrift 24 px dan kichik bo‘lsa yashiriladi).

**Bitta kadr, kesimsiz.** Butun film — bitta uzluksiz kamera harakati. Kesim qidiruvni o‘ldiradi.

| # | Sek | Davom | Kamera / ekran | Ovoz (uz) |
|---|-----|-------|----------------|-----------|
| 1 | 0.0 | 4.9 | Bitta oltin o‘rin, oq futbolkali muxlis, ustida `@_begjon_777` kartasi. Boshqa ism yo‘q | «Bu — Zamin Fk stadionidagi bitta o‘rin. Va unda ism bor.» |
| 2 | 5.2 | 5.2 | Kamera ortga chiqadi → **1 306 ta ism bir vaqtda yonadi**; sanoq 0 → 1 306; pastda «MUXLISLAR (HAQIQIY) 1 306 / 5 000» | «Hozir bu tribunada bir ming uch yuz oltita ism bor. Har biri — haqiqiy obunachi.» |
| 3 | 12.1 | 12.7 | **DRIFT** — tribuna bo‘ylab bitta uzluksiz sekin harakat (≈26 birlik, 12.6 s). Faqat bitta kichik chip: «ISMINGIZNI TOPING». Har ism ≈3 s turadi, so‘ng o‘rnini boshqasiga beradi | «Ismingiz shu yerda. Toping.» + olomon fonida sukunat |
| 4 | 24.9 | 1.7 | Harakat **bitta qorong‘i o‘ringa** keladi: oltin halqa, `@ ?` kartasi, yonida echki | «Bu o‘rin esa hali bo‘sh.» |
| 5 | 28.2 | 6.9 | CTA: «SIZ HAM O‘Z ISMINGIZNI QOLDIRASIZMI?» → «OBUNA BO‘LING VA IZOHGA:» + oq izoh kartasi ichida katta yashil `+` → «O‘RNINGIZ ABADIY SIZDA QOLADI»; gerb + echki, `+` yomg‘iri | «Siz ham o‘z ismingizni qoldirmoqchimisiz? Obuna bo‘ling va izohga plyus qoldiring. O‘rningiz abadiy sizda qoladi.» |

## Ma’lumot
- Ismlar — `assets/fans.json` (2026-11-25 obunachilar eksporti, 1 306 ta, 26-videodagi bilan bir xil manba).
- O‘rin taqsimoti: olomon **bosh tribuna markazidan** o‘sib boradi (`|ds| + 1.6·tier`), ya’ni
  1 306 ta yonib turgan o‘rin — jami 3 587 tadan. Yolg‘on raqam yo‘q.
- Bo‘sh o‘rin — markazdan ≈26 birlik, 3-qator; drift aynan shunga kelib to‘xtaydi.
- Username’lardagi raqamlar raqam bo‘lib qoladi (ovozda hech qaysi username aytilmaydi).

## Qoidalar
- Ism ko‘rinsa — **o‘qiladigan** bo‘lsin: shrift 24 px dan kichik bo‘lsa ism ko‘rsatilmaydi.
- Kesim yo‘q: drift 12.6 s davomida uzilmaydi.
- Stadion, muxlislar va fond — virtual o‘yin mexanikasi.

## Yig‘ish
`python3 prep_voice.py` → `node render.js video build/silent.mp4` → `python3 make.py`
(kadr tekshiruvi: `node render.js frames 1.6,13,24.6,26.1`)
