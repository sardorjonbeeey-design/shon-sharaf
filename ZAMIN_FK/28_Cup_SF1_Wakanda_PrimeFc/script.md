# 28-video — «Muxlislar kubogi: 1-yarim final» (Reel, 45.0 s)

WAKANDA TEAM 3–2 PRIME FC (penalti, seed 20261126). Tarkiblar 26-videodan.
Dvigatel: `27_Cup_Match_Engine` (`cup.js` + Day 9 harness). Ovoz: Poyo `elevenlabs-v4-tts`,
`voice rwtcHtZgYU6HN2zLNBlf`, `uz`, `timestamps:true`.

**Vaqt taqsimoti (talab):** 3D futbol (zarba/gol/nishonlash) — 15.0 s = 45 s ning 1/3 qismi.
Qolgan 30 s: hook, kontekst, natija va CTA.

| # | Sek | Davom | Ekran | Ovoz (uz) |
|---|-----|-------|-------|-----------|
| 1 | 0.0 | 3.0 | **HOOK** — 12-zarba: yugurib kelish va zarba, aynan to‘p darvoza oldida ekanda **STOP-kadr** + «OXIRGI ZARBA» | «Mana shu zarba hal qiladi. To‘xtating.» |
| 2 | 3.0 | 3.0 | Stop-kadr ustida: WAKANDA TEAM 3 : 2 PRIME FC · 12/12 · «Kim yutadi deb o‘ylaysiz?» | «Hisob uch — ikki. Sizningcha, urdimi yoki to‘xtatdimi?» |
| 3 | 6.0 | 4.0 | Tarkib plitalari (26-video story PNG) — muxlislar ismlari, kapitanlar | «Ikkala tarkibni ham siz tanlagansiz. O‘n ikki zarba.» |
| 4 | 10.0 | 3.5 | **3D** 6-zarba: @sh.ahzod0717 gol → PRIME FC oldinda 1:2 | «Prime Fc oldinga chiqdi.» |
| 5 | 13.5 | 4.0 | **3D** 11-zarba: @a.farhodjon gol → 3:2 | «Keyin Wakanda uchta zarbani ketma-ket urdi.» |
| 6 | 17.5 | 4.5 | **3D** 12-zarba to‘liq: @yuldoshev.31 — darvozabon **TO‘XTATDI** | «Va o‘sha oxirgi zarba… to‘xtatildi!» |
| 7 | 22.0 | 5.0 | **3D** nishonlash: Wakanda tarkibi markazda to‘planadi | «Wakanda Team — finalda.» |
| 8 | 27.0 | 4.0 | To‘liq ekran: WAKANDA TEAM → FINAL · asoschi @3wx.hamrokulov (ekranda, ovozda aytilmaydi) | «Bu klubni oddiy muxlis ochgan edi. Endi u finalda.» |
| 9 | 31.0 | 6.0 | **CTA 1** — 2-yarim final: QAYRAT FC vs PRIME AVANGARD, katta ikki karta | «Endi ikkinchi yarim final: Qayrat Fc — Prime Avangard.» |
| 10 | 37.0 | 8.0 | **CTA 2** — butun ekran: `IZOHGA KLUB NOMINI YOZING` · `ENG KO‘P OVOZ OLGAN KLUB — BIRINCHI ZARBA` · `24 SOAT · OBUNA SHART` | «Izohga qaysi klubni yozsangiz — o‘sha klub birinchi zarbani uradi. Yigirma to‘rt soat. Obuna shart.» |

3D jami: 3.0 + 3.5 + 4.0 + 4.5 = 15.0 s (stop-kadr 2-blokda statik kadr, render emas).

## Interaktiv mexanika (e’lon qilinadi)
- Izohda klub nomi (QAYRAT yoki AVANGARD) — bir odam bir ovoz, obuna shart.
- 24 soatdan keyin ko‘p ovoz olgan klub 2-yarim finalda **birinchi zarbani** uradi.
- Natija seedli: seed e’lon qilinadi, keyingi videoda ko‘rsatiladi.

## Qayta yig‘ish
```
node render_seq.js            # 3D plitalar (build/seq/*.mp4 + stop.png)
python3 prep_voice.py 1.05    # voice/NN.mp3 -> NN_fit.wav + build/words.json
node render.js video build/silent.mp4
python3 make.py               # ovoz + sfx + musiqa -> exports/ZFK_EP27_sf1.mp4 + .srt + caption.txt
```
