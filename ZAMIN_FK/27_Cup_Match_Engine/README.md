# Muxlislar kubogi — o‘yin dvigateli (penalti va o‘yin)

Day 9 harness’i ustiga qurilgan: `09_Episode_09/goals3d/harness.js` real 3D stadionni
ochadi, `director.js` 22 ta rigged o‘yinchini, to‘pni, kameralarni va HUD’ni boshqaradi.
Bu papka o‘sha dvigatelni **muxlislar klublariga** moslaydi.

## Nima qo‘shildi
- `director.js` endi `window.CUP` bo‘lsa, Day 9 tarkiblari o‘rniga **ikki muxlis klubining
  tarkibini** va ularning **o‘z formasini** oladi (EP09 o‘zgarishsiz qoladi — CUP bo‘lmasa
  eski qiymatlar ishlaydi). HUD’da klub nomlari, penaltida `N/M` hisoblagich, kartada
  `@username`, gol bo‘lmasa «TO‘XTATILDI» va GOOOL kartasi chiqmaydi.
- Forma retseptlari (baked moviy matoni qayta bo‘yash): `blue` `red` `amber` `green`
  `purple` `slate` `teal`. Klublarga biriktirilgani (`cup.js` → `KIT`):
  - PRIME AVANGARD — **qizil**
  - PRIME FC — **sariq (amber)**
  - WAKANDA TEAM — **yashil**
  - QAYRAT FC — **binafsha**
  - darvozabonlar — **slate** (kulrang-ko‘k)
- `cup.js` — `26_Cup_V3_Tarkib/build/teams.json` dan tarkibni oladi, 4-3-3 o‘rinlarini
  maydon koordinatalariga o‘giradi, **seedli penalti seriyasi** yasaydi (5+5, keyin
  sudden death; natija aniqlanishi bilan kesiladi). Seed e’lon qilinadi — natija
  tekshirib ko‘riladigan bo‘ladi.
- `render_cup.js` — preview / frames / video.

## Ishlatish
```
node render_cup.js "WAKANDA TEAM" "PRIME FC" 20261126 preview 1 16   # kontakt varaq (~40 s)
node render_cup.js "WAKANDA TEAM" "PRIME FC" 20261126 frames 2 3.4   # to‘liq o‘lchamli kadr
node render_cup.js "WAKANDA TEAM" "PRIME FC" 20261126 video build/shootout.mp4
```
`build/shootout.json` — seed, natija va har zarbaning yozuvi (kim, raqami, gol/to‘xtatildi).

**Nishonlash:** har zarbadan keyin yakka nishonlash yo‘q. Seriya tugagach bitta
qo‘shimcha sahna qo‘shiladi (`teamCelebration`, oxirgi indeks, 6 s): **faqat g‘olib
klub** butun tarkibi bilan birga yugurib chiqadi, qo‘llar keng yoyilgan
(`wide2` akti), yutqazgan darvozabon cho‘kadi. Kadr keng — `preview <oxirgi> 16`
bilan ko‘riladi; HUD’da yakuniy hisob turadi, GOOOL/karta chiqmaydi.

## Narx
~1 kadr/s, 1080×1920. Bitta zarba 4.4 s ≈ 2.5 daq. To‘liq seriya (10–12 zarba)
≈ 25–30 daqiqa render. Ovoz va montaj alohida (26-video’dagi `prep_voice.py` / `make.py` uslubida).

## O‘yin varianti (2 — O‘YIN)
Xuddi shu dvigatel: reytinglar izoh layklaridan (`60 + min(25, layk×1.5)`), seedli
simulyatsiya 90 daqiqa → voqealar ro‘yxati, so‘ng faqat kalit epizodlar 3D da
render qilinadi (EP09 strukturasi: 3–5 ta 8 soniyalik klip + 2D plitalar).
