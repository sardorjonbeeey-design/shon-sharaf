# Reel 23 — «Siz tanladingiz: Jasurbek» (transfer e’loni)

38 s, 1080×1920, 30 fps. Day 21 ovozining natijasi: **2-variant — Jasurbek Rahimov**, 64% ovoz, g‘olib izoh 81 layk.
Muxlislar qimmat yulduz (Kwame Mensah, 74 OVR, 20 000 000) o‘rniga yosh himoyachini tanladi — reelning asosiy g‘oyasi shu: «yulduz emas, kelajak».

## Beatlar

| # | Vaqt | Kadr | Ovoz (uz) |
|---|---|---|---|
| 1 | 0.25–3.5 | Day 21 ning ikkala kartasi uchib kiradi; Kwame kartasi rangsizlanadi + **RAD**, Jasurbek kartasi oltin nur + **TANLANDI**. Sarlavha «SIZ TANLADINGIZ» | «Siz tanladingiz. Va bu tanlov kutilmagan bo‘ldi.» |
| 2 | 4.0–8.1 | Ovoz natijasi: 64% sanaladi, ikkita ustun (Jasurbek 64% / Kwame 36%), chip «Eng ko‘p layk olgan izoh · 81 ❤» | «Oltmish to‘rt foiz ovoz ikkinchi variantga berildi. Jasurbek Rahimov.» |
| 3 | 8.9–14.6 | **3D**: haqiqiy stadion maydon sathidan (kamera asta yaqinlashadi), LED ekranda «YANGI O‘YINCHI · JASURBEK RAHIMOV · 19»; sprite maydonda turadi; «TRANSFER YAKUNLANDI ✓», ism + «12 500 000 so‘m» | «O‘n to‘qqiz yoshli himoyachi endi Zamin FK da. O‘n ikki million besh yuz ming so‘m.» |
| 4 | 14.6–17.3 | Forma orqasi: «RAHIMOV 19», chip «19 YOSH · 19 RAQAM» | «Raqami ham o‘n to‘qqiz. Yoshi bilan bir xil.» |
| 5 | 18.1–21.7 | Byudjet hisoblagichi 79 875 000 → **67 375 000**, «− 12 500 000 so‘m · Jasurbek» | «Byudjetda oltmish yetti million uch yuz yetmish besh ming so‘m qoldi.» |
| 6 | 22.5–28.9 | Rustam aka + «YULDUZ EMAS — KELAJAK!», OVR 66 → ? ustuni, «19 yoshda o‘sadi» | «Rustam aka aytdi: siz yulduzni emas, kelajakni sotib oldingiz. Oltmish olti bu faqat boshlanishi.» |
| 7 | 29.9–36.5 | CTA: 1 TEZLIK / 2 HIMOYA / 3 ZARBA, «Izohga 1, 2 yoki 3 yozing», 24 soat sharti, gerb | «Endi mashqni siz tanlaysiz. Bir tezlik. Ikki himoya. Uch zarba. Izohga raqamni yozing!» |

## Art
- Personajlar **realistik emas**, `01_Art_Direction/ZFK_PROMPT_PACK_V01.md` uslub bloki bo‘yicha (Doston/Sherzod kabi 3D animatsion film uslubi): `assets/jasurbek_raw.png`, `assets/kwame_raw.png` (Poyo `gpt-image-2.6-fixed`, `sunburst`, 9:16, 1K), fon olib tashlangan → `*_cut.png`, kartalar uchun yarim tana → `p1_card.png` / `p2_card.png`.
- Kartalar Day 2/21 dizaynida: `cards.html` + `node cards.js` → `assets/pcard_1.png`, `pcard_2.png`.
- Fonlar va Rustam aka sprite’i Day 21 dan ko‘chirilgan.

## Rebuild
```
python3 prep_voice.py                 # voice/NN.mp3 + NN.json -> build/words.json
node render3d.js sign 5.7             # build/3d/sign/f_0000.jpg ... (~5 s/kadr)
node cards.js                         # kartalarni qayta chizish (ixtiyoriy)
node render.js frames 2.6,5.6,11.0    # tekshiruv kadrlari
node render.js video build/silent.mp4 # to‘liq render
python3 make.py                       # ovoz miksi + .srt + caption.txt
```

## Eslatma
- G‘olib izoh egasining username’i berilmagan — shuning uchun izoh skrinshoti emas, ovoz natijasi (64% + 81 layk) ko‘rsatilgan. Username kelsa, Day 21 dagi `comments.html` uslubida karta qo‘shiladi.
- Obunachilar soni va yangi layklar kelmagani uchun byudjet Day 21 holatidan hisoblangan: 79 875 000 − 12 500 000 = 67 375 000.
