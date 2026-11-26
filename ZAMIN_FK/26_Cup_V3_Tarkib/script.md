# 26-video — «Muxlislar kubogi: 4 ta tarkib» (Reel, 52.0 s)

Ovoz: Poyo `elevenlabs-v4-tts`, `voice rwtcHtZgYU6HN2zLNBlf`, `uz`, `timestamps:true`.
3D: Day 9 harness (`09_Episode_09/goals3d/harness.js`) + `web/stadium/dist/index.html`.
**Har klub o‘z kamerasi bilan** (multi-view): har bo‘lim boshqa rakursdan.
Tarkib **4-3-3 sxemasi bo‘yicha maydon ustida** (ro‘yxat emas), zaxira — sxema ostida bitta qator.

| # | Sek | Davom | Kamera / ekran | Ovoz (uz) |
|---|-----|-------|----------------|-----------|
| 1 | 0.0 | 3.2 | **s1** — yuqoridan stadionga sho‘ng‘ish, LED: «MUXLISLAR KUBOGI» | «To‘rtta klub. To‘rtta tarkib. Hammasi sizning izohlaringizdan.» |
| 2 | 3.2 | 2.9 | **s2** — maydon ustidan tik ko‘rinish, setka chiziladi | «Yarim finalgacha bir qadam qoldi.» |
| 3 | 6.1 | 7.0 | **t1** — darvoza orqasidan past rakurs · PRIME AVANGARD 4-3-3 orqadan oldinga to‘ladi, kapitan doirasi sariq (8), so‘ng zaxira qatori | «Prime Avangard. Kapitan — sakkizinchi raqamda.» |
| 4 | 13.1 | 7.0 | **t2** — burchakdan aerial · PRIME FC, 51-raqam alohida yonadi | «Prime Fc. Ellik bir raqamini o‘zingiz so‘radingiz — oldingiz.» |
| 5 | 20.1 | 7.0 | **t3** — yon tomondan maydon sathida · WAKANDA TEAM | «Wakanda team. Bu tarkib butunlay yangi muxlislardan yig‘ildi.» |
| 6 | 27.1 | 7.0 | **t4** — markaziy doira ustidan baland · QAYRAT FC | «Qayrat Fc. Oxirgi o‘rin ham egasini topdi.» |
| 7 | 34.1 | 3.4 | To‘rt sxema bir ekranga kichrayadi, kubok savol belgisi bilan | «Endi bitta savol qoldi: g‘olibni qanday aniqlaymiz?» |
| 8 | 37.5 | 10.5 | **CTA — butun ekran, uch katta qator** (ekranning 80 %): `1 IZOH = GOL · har 50 ta izoh — 1 gol` / `2 O‘YIN · 3D o‘yin` / `3 PENALTI · 11 metr`. Har qator ovoz bilan birma-bir yonadi, raqam katta doirada | «Bir — izohlaringiz gol bo‘ladi: har ellikta izoh — bitta gol.» / «Ikki — o‘yin o‘ynaymiz. Uch — penalti.» / «Izohga bir, ikki yoki uch deb yozing. Obuna bo‘lish shart.» |
| 9 | 48.0 | 4.0 | End card: gerb + «QOIDANI SIZ TANLAYSIZ» | — (yakuniy akkord) |

## «IZOH = GOL» mexanikasi (1-variant)
- Keyingi o‘yin videosi ostida har klubning **noyob** izoh yozuvchilari sanaladi
  (bir odam — bitta izoh, obuna shart).
- **Har 50 ta izoh — bitta gol.** Maksimum 5 gol. Teng bo‘lsa — penalti.
- Son oldindan e’lon qilinadi, natija sanab chiqiladi.
- 3D render aynan shuncha golni ko‘rsatadi; gol urgan o‘yinchi tarkibdan layk
  bo‘yicha tanlanadi, ekranda golni ochgan izoh egasi chiqadi
  («50-izoh — @username → GOL»).

## Qoidalar
- Tarkib va zaxira — 25-video izohlari + 2026-11-25 obunachilar eksporti (`TARKIB.md`).
- Pozitsiyalar ekranda faqat kod, ovozda o‘zbekcha so‘z.
- Username’lardagi raqamlar raqam bo‘lib qoladi.
- CAM (4-2-3-1) → 4-3-3 da uchinchi CM.
- Klublar, kubok va muxlislar — virtual o‘yin mexanikasi.

## Yig‘ish
`python3 prep_voice.py` → `node render3d.js <seg> <dur>` (s1 s2 t1 t2 t3 t4) →
`node render.js video build/silent.mp4` → `python3 make.py`
