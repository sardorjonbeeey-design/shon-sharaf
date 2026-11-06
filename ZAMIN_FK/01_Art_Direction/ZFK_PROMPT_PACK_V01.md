# ZAMIN FK — Rasm promptlari to‘plami (V01)

> **Holat:** tayyor, lekin **ishga tushirilmagan**. Rasm generatsiyasi foydalanuvchi buyrug‘i bilan qayta boshlanganda ishlatiladi.
> Promptlar model uchun ingliz tilida (Playbook uslubi). Tavsiya etilgan vosita: Poyo → GPT Image 2.6 Sunburst (reference bilan tahrirlashda aniqroq).
> Tartib (handoff 20-bo‘lim): xarakter masterlari → gerb/forma → joylar → jamoa → sahna kadrlari.

## Umumiy uslub bloki (har bir promptga qo‘shiladi)

```
Realistic 3D animated-film style, natural skin and fabric detail, soft
cinematic lighting, believable proportions with slightly expressive faces
for comedy. Set in a small town in Uzbekistan. ZAMIN FK colours: royal blue
#1F4FB8 and white. No text, no logos other than the ZAMIN FK crest where
stated, no watermark.
```

## A. Xarakter masterlari (oldindan, to‘liq bo‘y, bir xil fon)

Har biri: tasdiqlangan prezident rasmi reference sifatida biriktiriladi (uslub va yorug‘lik mosligi uchun).

**A1. Rustam aka — `ZFK_RUSTAM_MASTER_V01`**
```
Use the attached approved ZAMIN FK president image only as the style and
lighting reference; do not copy his face. Create a new character: Rustam
aka, Uzbek head coach, 45-50, strong jaw, short dark hair greying at the
temples, thick serious eyebrows, slight belly, royal-blue coaching tracksuit
with white stripes, silver whistle on a cord, tactics clipboard under one
arm. Expression: stern, as if this amateur training is a cup final. Full
body, front view, shoes visible, standing on a plain uniform mid-grey
background. One character only.
```

**A2. Bekzod — `ZFK_BEKZOD_MASTER_V01`**
```
... Create a new character: Bekzod, Uzbek striker, 22, athletic and lean,
short dark hair with a sharp fade, over-confident half smile, royal-blue
shirt, white shorts, blue socks, white boots. Small ZAMIN FK crest on the
left chest. Pose: arms crossed, chin up like a superstar. Full body, front
view, plain uniform mid-grey background. No shirt number.
```

**A3. Jasur — `ZFK_JASUR_MASTER_V01`**
```
... Create a new character: Jasur, Uzbek goalkeeper, 24, tall with broad
shoulders, friendly round face, short black hair slightly messy, green
goalkeeper jersey and shorts, green socks, goalkeeper gloves. ZAMIN FK crest
with a thin white outline on the left chest. Relaxed, slightly sheepish
smile. Full body, front view, plain uniform mid-grey background. No number.
```

**A4. Aziz — `ZFK_AZIZ_MASTER_V01`**
```
... Create a new character: Aziz, Uzbek midfielder, 19, slim, short neat
black hair, calm intelligent eyes, completely deadpan expression, royal-blue
shirt, white shorts, blue socks. Small ZAMIN FK crest on the left chest.
Holding a football against his hip. Full body, front view, plain uniform
mid-grey background. No number.
```

**A5. Stadion echkisi — `ZFK_GOAT_MASTER_V01`**
```
... A scruffy village goat, white with grey patches, one horn broken short,
a torn faded blue-and-white scarf scrap tied loosely around its neck,
mildly unimpressed expression. Full body, side view, plain uniform mid-grey
background.
```

## B. Gerb va forma

**B1. Gerb — `ZFK_CREST_MASTER_V01_P`**: `Club_Crest/ZFK_CREST_SPEC_V01.md`, 11-bo‘limdagi prompt. Natija keyin vektor (SVG) sifatida qayta chiziladi.

**B2. Forma varag‘i — `ZFK_KIT_SHEET_V01`**
```
Flat product-style kit sheet on white: ZAMIN FK outfield home shirt in
royal blue #1F4FB8 with white collar trim, white shorts, royal-blue socks;
goalkeeper set in green with the same crest outlined in white. Attached
crest image placed on the left chest at realistic size. Front and back
views. No sponsors, no numbers, no text.
```

## C. Joylar (bo‘sh fon, 9:16, figurasiz)

**C1. `ZFK_STADIUM_MASTER_V01` — tong, keng plan**
```
Vertical 9:16. Old amateur football ground in a small Uzbek town at dawn,
seen from high above the halfway line. Patchy worn grass, bare dirt in the
goalmouths, rusty metal goals without nets, a short concrete stand with
faded blue-and-white paint, simple metal fence, a small broken manual
scoreboard, poplar trees and low mountains in the distance. Cool cloudy
light, mist. Empty, no people, no animals.
```

**C2. `ZFK_DRESSING_ROOM_MASTER_V01`**
```
Vertical 9:16. Small worn dressing room: wooden benches, dented metal
lockers, royal-blue and white shirts on hooks, boots on the floor, a basic
tactics whiteboard with magnets, one bare bulb. Faded ZAMIN FK crest painted
on the wall. Empty, no people.
```

**C3. `ZFK_OFFICE_MASTER_V01`**
```
Vertical 9:16. Modest club office: one desk with an old laptop (screen
blank, plain grey), stacked documents, calculator, budget notebook, two
visitor chairs, a framed ZAMIN FK crest on the wall, a small tactics board,
a nearly empty trophy shelf with one small dusty cup. Warm afternoon light
through a window. Empty, no people.
```

## D. Jamoa

**D1. `ZFK_SQUAD_PARTIAL_V01`** — prezident + 4 asosiy xarakter, ular orqasida xira, kadrdan chiqib ketgan boshqa futbolchilar (sanab bo‘lmaydigan). Barcha master rasmlar reference sifatida biriktiriladi.

## E. Sahna kadrlari

Sahna rejasidagi 1–10-kadrlar (`02_Episode_01/ZFK_EP01_SCENE_BLUEPRINT_V02.md`, 4-bo‘lim). Har biri uchun: tegishli joy masteri + xarakter masterlari reference; Playbookdagi qoida —
```
Use the attached approved masters as identity references. Keep face, body
proportions, kit and props identical. Change only [pose / expression /
camera]. No extra characters, labels or text.
```
Figuralar shaffof fonda alohida, joy esa alohida qatlam sifatida saqlanadi.

## Tekshiruv (har bir rasmdan keyin)
- Yuz, soch, forma, gerb masterga mosmi?
- Rasmda raqam, futbolka raqami yoki yozuv yo‘qmi?
- 9:16 kadrda o‘ng va pastki xavfsiz hudud bo‘shmi?
