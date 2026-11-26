# 26-video — «Muxlislar kubogi: 4 ta tarkib» (Reel, 53.0 s)

Ovoz: Poyo `elevenlabs-v4-tts`, `voice rwtcHtZgYU6HN2zLNBlf`, `uz`.
3D: `web/stadium/dist/index.html` (Day 9 harness) — stadion va maydon ustidan ko‘rinish.
Har klub alohida bo‘lim. Tarkib **4-3-3 sxemasi bo‘yicha maydon ustida** ko‘rsatiladi
(ro‘yxat emas): har o‘yinchi — oq doirada raqam, ostida pozitsiya kodi va @username;
kapitan sariq doirada. Zaxira — sxema ostida bitta qator.

| # | Sek | Davom | Ekran | Ovoz (uz) |
|---|-----|-------|-------|-----------|
| 1 | 0.0 | 3.0 | Stadion tepadan, LED ekranda «MUXLISLAR KUBOGI»; maydon 4 ga bo‘linadi | «To‘rtta klub. To‘rtta tarkib. Hammasi sizning izohlaringizdan.» |
| 2 | 3.0 | 3.0 | Setka: Wakanda–Prime Fc / Qayrat–Prime Avangard | «Yarim finalgacha bir qadam qoldi.» |
| 3 | 6.0 | 1.5 | **PRIME AVANGARD** zarb bilan, asoschi @rasuluvich_09 | «Prime Avangard.» |
| 4 | 7.5 | 4.0 | Bo‘sh 4-3-3 maydoni; doiralar orqadan oldinga chiqadi: GK → himoya → markaz → hujum | «To‘rt, uch, uch. Darvozabondan hujumchigacha.» |
| 5 | 11.5 | 1.5 | Kapitan doirasi sariq bo‘lib yonadi (8-raqam) | «Kapitan — sakkizinchi raqamda.» |
| 6 | 13.0 | 2.0 | Sxema ostida zaxira qatori chiqadi (7 ta username) | «Zaxira ham tayyor.» |
| 7 | 15.0 | 1.5 | **PRIME FC**, asoschi @umaraliev.lll | «Prime Fc.» |
| 8 | 16.5 | 5.5 | 4-3-3 to‘ladi; 51-raqam (@islom.muhammadov7) alohida yonadi | «Ellik bir raqamini o‘zingiz so‘radingiz — oldingiz.» |
| 9 | 22.0 | 2.0 | Zaxira qatori (5 ta) | — (musiqa) |
| 10 | 24.0 | 1.5 | **WAKANDA TEAM**, asoschi @3wx.hamrokulov | «Wakanda team.» |
| 11 | 25.5 | 5.5 | 4-3-3 to‘ladi | «Bu tarkib to‘liq yangi muxlislardan yig‘ildi.» |
| 12 | 31.0 | 2.0 | Zaxira qatori (5 ta) | — |
| 13 | 33.0 | 1.5 | **QAYRAT FC**, asoschi @avazov_gk_07 | «Qayrat Fc.» |
| 14 | 34.5 | 5.5 | 4-3-3 to‘ladi | «Oxirgi o‘rin ham egasini topdi.» |
| 15 | 40.0 | 2.0 | Zaxira qatori (6 ta) | — |
| 16 | 42.0 | 3.0 | To‘rt sxema bir ekranga kichrayadi, setka yonadi; kubok savol belgisi bilan | «Endi bitta savol qoldi: g‘olibni qanday aniqlaymiz?» |
| 17 | 45.0 | 5.5 | **CTA — uch variant ekranda, har biri alohida qatorda:**  `1 — IZOH = GOL` (har 25 ta izoh — bitta gol) · `2 — O‘YIN` (3D o‘yin, tarkib kuchiga qarab) · `3 — PENALTI` (faqat 11 metrlik zarbalar) | «Bir — izohlaringiz gol bo‘ladi: har yigirma beshta izoh — bitta gol. Ikki — o‘yin o‘ynaymiz. Uch — penalti. Izohga raqamni yozing.» |
| 18 | 50.5 | 2.5 | End card: gerb + «QOIDANI SIZ TANLAYSIZ» | — (yakuniy akkord) |

## Qoidalar
- Tarkib va zaxira — faqat 25-video izohlari + 2026-11-25 obunachilar eksportidan
  tasdiqlangan muxlislar (`TARKIB.md`). Obuna bo‘lmaganlar ekranda yo‘q.
- Pozitsiyalar ekranda **faqat kod** (GK, CB, CM, ST, LB, RB, LW, RW), ovozda o‘zbekcha so‘z.
- Username’lardagi raqamlar raqam bo‘lib qoladi (ovozda ham).
- 4-2-3-1 yozuvidagi CAM — 4-3-3 da uchinchi markaz (CM) sifatida ko‘rsatiladi.
- Klublar, kubok va muxlislar — virtual o‘yin mexanikasi (caption’da eslatiladi).

## «IZOH = GOL» mexanikasi (1-variant)
- Keyingi videodagi o‘yinda har klubning **noyob** izoh yozuvchilari sanaladi
  (bir odam — bitta izoh, obuna shart; 25-videodagi qoidaning o‘zi).
- **Har 25 ta izoh — bitta gol.** Maksimum 5 gol. Teng bo‘lsa — penalti.
- Son oldindan e’lon qilinadi, natija sanab chiqiladi: hech narsa yashirilmaydi.
- 3D render aynan shuncha golni ko‘rsatadi; gol urgan o‘yinchi tarkibdan layk
  bo‘yicha tanlanadi, ekranda esa golni «ochgan» izoh egasi chiqadi
  («25-izoh — @username → GOL»).
- Shu sababli bu variant eng arzon va eng tez: golni muxlislar o‘zi yozadi,
  bizga faqat shuncha epizodni render qilish qoladi.

## Yig‘ish (rejalashtirilgan)
`prep_voice.py` → `render3d.js` (stadion plitalari) → `film.html` (4-3-3 sxema animatsiyasi,
`story.html` dizayni asosida) + `render.js video` → `make.py`
