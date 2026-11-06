# ZAMIN FK — Episod 01 “Noldan boshlaymiz” — Sahna rejasi (V02)

> **Holat: TAKLIF — tasdiq kutilmoqda.** V01 (handoff, 15-bo‘lim) asosida qayta ko‘rib chiqilgan.
> Bosqich: 03.3 — Art Direction. Format: 9:16, 1080 × 1920, 30 fps, 45 soniya. Til: o‘zbek (lotin).

## 1. Playbookning besh bitiga moslik

Playbook (10-bet): HOOK → PAYOFF → MATCH → CONSEQUENCE → QUESTION.
Playbook (19-bet): 1-episodning vazifasi — “muammoni tanishtirish”: dunyoni ko‘rsatish, tomoshabin qanday qo‘shilishini tushuntirish, birinchi savolni berish. Oldingi ovoz berish yo‘q, shuning uchun PAYOFF va MATCH bitlari 1-episodga moslashtiriladi:

| Playbook biti | Episod 01 dagi vazifasi | Vaqt | Fayl (taklif) |
|---|---|---|---|
| HOOK | Unutilgan klub, taslim bo‘lmaydigan prezident | 00:00–00:03 | `01_hook.wav` |
| PAYOFF → “Klub tanishuvi” | Klub, stadion va boshlang‘ich mablag‘ | 00:03–00:13 | `02_payoff.wav` |
| MATCH → “Maqsad” | Jamoa mashg‘ulotda — bitta aniq kulgili burilish nuqtasi | 00:13–00:28 | `03_turning_point.wav` |
| CONSEQUENCE → “Tomoshabin mexanizmi” | Bu klub uchun nimani anglatadi: virtual muxlislar va fond | 00:28–00:36 | `04_consequence.wav` |
| QUESTION | Birinchi qaror va 24 soatlik muddat | 00:36–00:45 | `05_question.wav` |

## 2. Sahnalar

### Sahna 1 — Hook (00:00–00:03)
- **Tasvir:** Tong. Bo‘sh, qarovsiz stadion; prezident maydon markazida yolg‘iz. Sovuq, bulutli yorug‘lik.
- **Kamera:** yuqoridan sekin pastga tushish → prezidentga sekin yaqinlashish.
- **Ovoz:** “Bu klubni hamma unutgan. Lekin men taslim bo‘lmayman.”
- **Ekrandagi matn:** subtitr.
- **Eslatma:** 8 so‘z / 3 soniya — tez. Ovoz yozilgandan keyin kerak bo‘lsa, sahna 00:04 gacha uzaytiriladi va 2-sahna qisqartiriladi.

### Sahna 2 — Klub tanishuvi (00:03–00:13)
- **Tasvir:** Prezident tanishtiradi → jamoa (qisman kadr, ortiqcha sanab bo‘lmaydigan qilib) → eski stadion.
- **Kulgi:** Bekzod o‘zini yulduzdek tutadi (kameraga poza beradi); Jasur qo‘lqoplarini qidiradi.
- **Ovoz:** “Biz — [SHAHAR?]dan chiqqan Zamin FKmiz. Bizda eski stadion va atigi 15 million so‘m boshlang‘ich mablag‘ bor.”
- **Grafika (alohida tahrirlanadigan qatlam):** `15 000 000 SO‘M` + “virtual fond” yorlig‘i.
- **Taqiqlar:** futbolchilar soni, stadion sig‘imi, futbolka raqamlari ko‘rsatilmaydi.

### Sahna 3 — Maqsad (00:13–00:28)
- **Tasvir:** Rustam aka qattiq taktik ko‘rsatma beradi → Bekzod oson zarbani o‘tkazib yuboradi (va oldindan bayram qilishni boshlaydi) → Jasur asabiy reaksiya → Aziz to‘pni xotirjam boshqaradi → prezident umid bilan kuzatadi.
- **Kamera:** dinamik futbol kamerasi; iliqroq yorug‘lik.
- **Ovoz:** “Maqsadimiz oddiy emas: eng quyi havaskor ligadan O‘zbekiston futbolining eng yuqori pog‘onasigacha chiqish. Ammo bu yo‘lda bizga sizning yordamingiz kerak.”
- **Burilish nuqtasi:** Bekzodning o‘tkazib yuborilgan zarbasi — “bizga yordam kerak” iborasiga to‘g‘ri keladi.

### Sahna 4 — Tomoshabin mexanizmi (00:28–00:36)
- **Tasvir:** Klub ofisi, prezident yelkasi ortidan noutbuk ekrani.
- **Ovoz:** “Har bir obunachi — bitta virtual muxlis. Har bir layk — klub fondiga bir dollar. Instagram va TikTokdagi ovozlaringiz esa kelajagimizni belgilaydi.”
- **Grafika:** `1 obunachi = 1 virtual muxlis` · `1 layk = 1 $ (virtual)` · Instagram + TikTok belgilari. “VIRTUAL” so‘zi aniq ko‘rinadi.
- **Qoida:** noutbuk ekrani rasmda bo‘sh chiziladi; raqamlar ustidan grafika qatlami sifatida qo‘yiladi.

### Sahna 5 — Birinchi qaror (00:36–00:45)
- **Tasvir:** Prezident kameraga qarab gapiradi → 4 ta tanlov kartasi → ZAMIN FK gerbi (P versiyasi, tasdiqlangan) bilan final kadr.
- **Ovoz:** “Birinchi qadamni siz tanlang: stadionmi, yangi hujumchimi, mashg‘ulot bazasimi yoki yangi murabbiy? 24 soat ichida eng ko‘p ovoz olgan izoh g‘olib!”
- **Kartalar:** `STADION TA’MIRI` · `YANGI HUJUMCHI` · `MASHG‘ULOT BAZASI` · `YANGI MURABBIY`
- **Final:** gerb + “Izohda ovoz bering — 24 soat”.

## 3. Kadr va xavfsiz hudud qoidalari
- Matn va kartalar kadrning yuqori va markaziy qismida; o‘ng tomon (~150 px) va pastki qism (~350 px) ilova tugmalari va subtitrlar uchun bo‘sh.
- Barcha raqamlar va yozuvlar rasmga chizilmaydi — alohida qatlam (Playbook 07-bo‘lim).
- Gerb faqat tasdiqlangan spetsifikatsiya bo‘yicha (`ZFK_CREST_SPEC_V01.md`).

## 4. Rasmlar ro‘yxati (generatsiya qayta boshlanganda)

| # | Fayl | Tarkib | Turi |
|---|---|---|---|
| 1 | `S01_stadium_dawn_wide` | Bo‘sh stadion, tong, yuqoridan | Fon |
| 2 | `S01_president_center` | Prezident maydon markazida | Fon + shaffof figura |
| 3 | `S02_president_intro` | Prezident, ko‘z darajasida | Fon + figura |
| 4 | `S02_team_partial` | Jamoa qisman; Bekzod poza, Jasur qo‘lqop qidiradi | Fon + figuralar |
| 5 | `S03_rustam_board` | Rustam aka taktik doska bilan | Figura |
| 6 | `S03_bekzod_miss` | Bekzod zarba / o‘tkazib yuborish | Figura |
| 7 | `S03_jasur_react` | Jasur asabiy | Figura |
| 8 | `S03_aziz_control` | Aziz to‘p bilan | Figura |
| 9 | `S04_office_ots` | Ofis, yelka ortidan, bo‘sh noutbuk ekrani | Fon |
| 10 | `S05_president_camera` | Prezident kameraga qarab | Fon + figura |

Barcha figuralar tasdiqlangan prezident va xarakter master rasmlaridan reference sifatida yaratiladi.

## 5. Tasdiq uchun savollar

1. **Shahar nomi:** “Qoratepa” rasmiy bo‘ladimi? Yo‘q bo‘lsa, 2-sahna ovozi: “Biz — Zamin FKmiz.”
2. **Harakat usuli:** (a) harakatsiz rasmlar + pan/zoom va qatlam animatsiyasi (Playbook usuli, arzon, barqaror), yoki (b) ayrim kadrlar uchun AI video (masalan, 1-sahnadagi yuqoridan tushish) — qimmatroq, davomiylik xavfi yuqori. **Tavsiya: (a)**, faqat 1-sahna uchun (b) sinab ko‘rish mumkin.
3. **Bekzod biti:** 3-sahnada zarbani o‘tkazib yuborib, baribir bayram qilishi ma’qulmi?
4. Yuqoridagi besh sahna va vaqtlar bilan reja tasdiqlanadimi?
