# 26-video — «Muxlislar kubogi: 4 ta tarkib» (Reel, 52.0 s)

Ovoz: Poyo `elevenlabs-v4-tts`, `voice rwtcHtZgYU6HN2zLNBlf`, `uz`.
3D: `web/stadium/dist/index.html` (Day 9 harness) — stadion va maydon ustidan ko‘rinish.
Har klub alohida bo‘lim; har bo‘limda tarkib + zaxira (izoh yozgan va obuna bo‘lgan muxlislar).

| # | Sek | Davom | Ekran | Ovoz (uz) |
|---|-----|-------|-------|-----------|
| 1 | 0.0 | 3.0 | Stadion tepadan, LED ekranda «MUXLISLAR KUBOGI» yonadi; maydon 4 ga bo‘linadi | «To‘rtta klub. To‘rtta tarkib. Hammasi sizning izohlaringizdan.» |
| 2 | 3.0 | 3.0 | Setka: Wakanda–Prime Fc / Qayrat–Prime Avangard | «Yarim finalgacha bir qadam qoldi.» |
| 3 | 6.0 | 1.5 | **PRIME AVANGARD** nomi zarb bilan, asoschi @rasuluvich_09 | «Prime Avangard.» |
| 4 | 7.5 | 5.5 | 11 ta qator ketma-ket chiqadi: raqam · kod · @username (1 GK → 8 ST) | «Darvozabondan hujumchigacha — o‘n bir muxlis.» |
| 5 | 13.0 | 2.0 | Zaxira lentasi: @_rah1mav_ · @ammoraxii · @bexa___edit7 · @shananov____9 · @jalgas.2010.7 · @menlimuratov_19 · @umarxan.oo6 | «Zaxira ham tayyor.» |
| 6 | 15.0 | 1.5 | **PRIME FC**, asoschi @umaraliev.lll | «Prime Fc.» |
| 7 | 16.5 | 5.5 | 11 qator (51 RB @islom.muhammadov7 ajratib ko‘rsatiladi — o‘zi so‘ragan raqam) | «Ellik bir raqamini o‘zingiz so‘radingiz — oldingiz.» |
| 8 | 22.0 | 2.0 | Zaxira: @shoxmid · @oblokhulov_18 · @mirzabek_985 · @nargiza698782 · @tojiboyev_o1_o2 | — (musiqa) |
| 9 | 24.0 | 1.5 | **WAKANDA TEAM**, asoschi @3wx.hamrokulov | «Wakanda team.» |
| 10 | 25.5 | 5.5 | 11 qator | «Bu tarkib to‘liq yangi muxlislardan yig‘ildi.» |
| 11 | 31.0 | 2.0 | Zaxira: @jahongir_m2014 · @shamshoduz70 · @behruz_45_47 · @nurullayev__nurmuhammad · @_sss_0_0_29 | — |
| 12 | 33.0 | 1.5 | **QAYRAT FC**, asoschi @avazov_gk_07 | «Qayrat Fc.» |
| 13 | 34.5 | 5.5 | 11 qator | «Oxirgi o‘rin ham egasini topdi.» |
| 14 | 40.0 | 2.0 | Zaxira: @nj10.forever · @_islamov_lw_17_ · @abdullaabdujabborov52 · @azim_jon_1_1_ · @callmekhonda · @met1nov_ | — |
| 15 | 42.0 | 4.0 | To‘rt klub gerbi bir ekranda, setka yonadi | «Birinchi o‘yin: Wakanda team — Prime Fc.» |
| 16 | 46.0 | 3.5 | CTA: «KIM YUTADI? 1 — WAKANDA / 2 — PRIME FC», echki mikrofon oldida | «Izohga bir yoki ikki yozing. Eng ko‘p layk — bashorat g‘olibi.» |
| 17 | 49.5 | 2.5 | End card: ZAMIN FK gerbi + «TARKIBNI SIZ TANLADINGIZ» | — (yakuniy akkord) |

## Qoidalar
- Tarkib va zaxira — faqat 25-video izohlari + 2026-11-25 obunachilar eksportidan
  tasdiqlangan muxlislar (`TARKIB.md`). Obuna bo‘lmaganlar ekranda ko‘rsatilmaydi.
- Pozitsiyalar ekranda **faqat kod** (GK, CB, CM, ST, LB, RB, LW, RW, CAM),
  ovozda o‘zbekcha so‘z bilan aytiladi.
- Username’lardagi raqamlar raqam bo‘lib qoladi (ovozda ham).
- Klublar, kubok va muxlislar — virtual o‘yin mexanikasi (caption’da eslatiladi).

## Yig‘ish (rejalashtirilgan)
`prep_voice.py` → `render3d.js` (stadion plitalari) → `film.html` + `render.js video` → `make.py`
