# 28-video v2 — «1-yarim final: WAKANDA TEAM 3–2 PRIME FC» (O‘YIN, Reel 45.0 s)

Nega qayta: muxlislar **2-variant — o‘yin** uchun ovoz bergan (12 : 7 : 2), penalti emas.
Natija o‘zgarmaydi: **3–2**, lekin endi bu 90 daqiqalik seedli o‘yin, 5 ta gol.

## Uchta qattiq qoida (v1 da buzilgani uchun)
1. **Tablo hech qachon yakuniy hisobni oldindan ko‘rsatmaydi** — faqat jonli hisob. 3:2 ekranda faqat 20.6 s dan keyin paydo bo‘ladi.
2. **Har gol — aniq muxlis nomidan**: ekranda katta `@username`, ovozda klub emas, odam.
3. **3D futbol — 15.5 s** (45 s ning ~1/3 qismi). Qolgani hook, ism va CTA.

## Beatlar

| # | Sek | Davom | Ekranda | Ovoz (uz) |
|---|-----|-------|---------|-----------|
| 1 | 0.0 | 2.5 | **HOOK · 3D** — 89-daqiqa, hujum, to‘p zarbaga ketayotganda **STOP-kadr**. Tablo: **2 : 2 · 89’** | «To‘qson birinchi daqiqa. Hisob ikki — ikki.» |
| 2 | 2.5 | 3.7 | Stop-kadr ustida: «SHU ZARBANI SIZLARDAN BIRI URDI» + 4 ta `@username` (javob yashirin) | «Bu zarbani sizlardan biri urdi. Kim — oxirida.» |
| 3 | 6.2 | 3.4 | 26-video tarkib kartalari: WAKANDA TEAM → PRIME FC (tez) | «Ikkala tarkib ham siz tanlagansiz.» |
| 4 | 9.6 | 2.5 | **3D gol 1** — PRIME FC 0:1, katta `@golibjon.2ta` | «Hisobni Prime Fc ochdi.» |
| 5 | 12.1 | 2.5 | **3D gol 2** — WAKANDA 1:1, katta `@uzb13900` | «Javob darhol keldi.» |
| 6 | 14.6 | 2.5 | **3D gol 3** — PRIME FC 1:2, katta `@zuhriddinyuldashev13` | «Prime Fc yana oldinga chiqdi.» |
| 7 | 17.1 | 2.5 | **3D gol 4** — WAKANDA 2:2, katta `@gulomov046` | «Va yana tenglik.» |
| 8 | 19.6 | 3.5 | **3D** — 1-beatdagi zarba davomi: **GOL, 3:2**, ekranda katta `@a.farhodjon` | «Mana o‘sha zarba. Sakkiz raqamli o‘yinchi — g‘alaba goli.» |
| 9 | 23.1 | 2.0 | **3D** nishonlash: g‘olib tarkib markazda to‘planadi | «Uch — ikki.» |
| 10 | 25.1 | 4.4 | To‘liq ekran: **GOL URGANLAR** — 5 ta `@username` ketma-ket yonadi · «WAKANDA TEAM — FINALDA» | «Gol urganlarning ismi ekranda. Hammasi — muxlislar.» |
| 11 | 29.5 | 4.5 | **2-YARIM FINAL** kartasi: QAYRAT FC — PRIME AVANGARD · «ertaga» | «Ertaga ikkinchi yarim final: Qayrat Fc — Prime Avangard.» |
| 12 | 34.0 | 8.0 | **CTA · butun ekran**, uch qator: `1 IZOHGA KLUB NOMINI YOZING` · `2 TO‘G‘RI TOPGAN 3 KISHI — FINAL TARKIBIDA` · `3 24 SOAT · OBUNA SHART` | «Izohga qaysi klub yutishini yozing. To‘g‘ri topganlardan uch kishi final tarkibiga kiradi. Yigirma to‘rt soat, obuna shart.» |
| 13 | 42.0 | 3.0 | End card: gerb + «MUXLISLAR KUBOGI» + seed raqami | — (yakuniy akkord) |

**3D jami:** 2.5 + 2.5 + 2.5 + 2.5 + 2.5 + 3.5 + 2.0 = **18.0 s**… → 4-7 beatlarning har biri 2.0 s ga qisqartirilsa **15.5 s** (45 s ning 34 %). Montajda shu variant olinadi.

## Nega bu ishlaydi
- **Hook** javobni yashiradi: tabloda 2:2, g‘olib gol 19.6 s gacha ko‘rsatilmaydi → odam oxirigacha qoladi.
- **Ism** — har golda bitta muxlis. 1 306 obunachi o‘z ismini qidiradi, izoh yozadi.
- **CTA** abstrakt ovoz emas: to‘g‘ri topgan **final tarkibiga kiradi** — videoga kirish yo‘li.
- Natija seedli va tekshiriladi, seed end cardda.

## Texnik ish (tasdiqlansa)
1. `27_Cup_Match_Engine/match.js` — 90 daqiqalik seedli simulyatsiya: reyting = `60 + min(25, layk×1.5)`, natija **3–2** ga majburlanadi (seed tanlanadi), 5 ta gol epizodi + vaqtlari.
2. Har gol uchun EP09 uslubidagi sahna (`scenarios.js` qoliplari): uzatma → zarba → to‘r → qisqa reaksiya. Bitta epizod ≈ 2.5 s render ≈ 2.5 daq.
3. Tablo jonli hisob bilan, `GOOOL!` va karta `@username` bilan (dvigatelda bor).
4. Ovoz: 12 satr Poyo `elevenlabs-v4-tts` (~7 kredit).
5. Montaj: `render_seq.js` → `prep_voice.py` → `render.js video` → `make.py`.
