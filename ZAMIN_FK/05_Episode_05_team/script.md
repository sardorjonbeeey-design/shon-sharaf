# ZAMIN FK — “Jamoa shakllanmoqda” (haqiqiy tarkib) — yakuniy skript
> 1080×1920, 30 fps, ~52 s. Hikoyachi: echki (SARHAD-SIZ Narrator `rwtcHtZgYU6HN2zLNBlf`, ElevenLabs V4).
> Fon: loyihaning o‘z 3D stadioni (web/stadium) kadrma-kadr suratga olingan; o‘yinchilar — saytdagi tarkib modeli, ko‘k forma.
> Ekranda kun raqami yozilmagan (oldingi “5-kun” posti bilan to‘qnashmasligi uchun).

| # | Fayl | Ovoz | Ekran |
|---|---|---|---|
| 1 HOOK | voice/01_hook.mp3 | ZAMIN FK da katta o‘zgarishlar! Endi bizda nafaqat klub, balki haqiqiy jamoa ham bor! | Dron stadionga uchib kiradi, 22 o‘yinchi maydonda · HAQIQIY JAMOA! |
| 2 MENEJER | voice/02_manager.mp3 | Yoshlar akademiyamizning birinchi menejeri ham aniqlandi! @yusup_maxamadov, tabriklaymiz! | Akademiya binosi va mashg‘ulot maydoni · RASMIY E’LON kartasi · izoh skrinshoti · @yusup_maxamadov · TABRIKLAYMIZ! |
| 3a TARKIB | voice/03_squad.mp3 | Mana ular — ZAMIN FK ning haqiqiy tarkibi! | Kamera jamoa ortidan uchib keladi · HAQIQIY TARKIB · 22 O‘YINCHI |
| 3b ASOSIY 11 | — (hushtak, tribuna shovqini, zarb) | — | Har bir o‘yinchi alohida kadr: forma orqasida ism + raqam, pastda karta (raqam, ism, pozitsiya) |
| 3c ZAXIRA | voice/04_bench.mp3 | Va zaxiradagi o‘yinchilarimiz! | Chiziq bo‘ylab kamera · ZAXIRA · keyin 11 ta alohida kadr |
| 3d JAMOA | — | — | 22 O‘YINCHI · BITTA JAMOA |
| 4 OUTRO | voice/05_outro.mp3 | Bu hali boshlanishi! ZAMIN FK endi birgalikda qurilmoqda. Siz ham bizning tariximizning bir qismi bo‘ling! | Kamera jamoa ustidan tribunaga ko‘tariladi · BIRGALIKDA QURAMIZ |
| CTA | voice/06_cta.mp3 | Siz qaysi pozitsiyada o‘ynaysiz? Izohga yozing! | SIZ QAYSI POZITSIYADA O‘YNAYSIZ? · DARVOZABON / HIMOYACHI / YARIM HIMOYACHI / HUJUMCHI · IZOHGA YOZING! |

3a va 3c ovoz matnlari ishlab chiqarish uchun qo‘shilgan bog‘lovchi jumlalar (topshiriqda 3-bit uchun matn berilmagan).

## Tarkib va raqamlar
Manba: `/api/squad` (zaminfk-city), 2026-11-11 — `data/squad_api_snapshot.json`. Raqamlar tasodifiy, takrorlanmaydi (`data/roster.json`, urug‘ 20261111).
Formadagi yozuv — o‘yinchining API dagi ismi, bosh harflarda (“_” → bo‘sh joy). Pozitsiya formada yo‘q, faqat kartada.

| № | Ism (API) | Formada | Pozitsiya | Holat |
|---|---|---|---|---|
| 44 | Sardor yuldoshev | SARDOR YULDOSHEV | GK | asosiy |
| 18 | Urunov Ruslan | URUNOV RUSLAN | LB | asosiy |
| 23 | Muhammadyasin Xikmatillayev | MUHAMMADYASIN XIKMATILLAYEV | CB | asosiy |
| 11 | Duschanov Murodbek | DUSCHANOV MURODBEK | CB | asosiy |
| 47 | Temirmalik_Baxtiyorov | TEMIRMALIK BAXTIYOROV | RB | asosiy |
| 21 | Maxmudov | MAXMUDOV | CDM | asosiy |
| 27 | Elshod Abdullayev | ELSHOD ABDULLAYEV | CM | asosiy |
| 66 | z1to | Z1TO | CAM | asosiy |
| 99 | Yorqulov nodirbek | YORQULOV NODIRBEK | LW | asosiy |
| 19 | Muhiddin | MUHIDDIN | ST | asosiy |
| 4 | Farhod | FARHOD | RW | asosiy |
| 6 | Abdurauf Tursunov | ABDURAUF TURSUNOV | GK | zaxira |
| 25 | Saddam | SADDAM | LB | zaxira |
| 3 | Xusanov Azizbek | XUSANOV AZIZBEK | CB | zaxira |
| 2 | Davronjonov Muhammadzohid | DAVRONJONOV MUHAMMADZOHID | CB | zaxira |
| 16 | Muhamedov.islom | MUHAMEDOV.ISLOM | RB | zaxira |
| 22 | Abduhalilov ibrohimjon | ABDUHALILOV IBROHIMJON | CDM | zaxira |
| 9 | Meyrambek | MEYRAMBEK | CM | zaxira |
| 5 | tedro Qurbonaluyev | TEDRO QURBONALUYEV | CAM | zaxira |
| 10 | Yuldashev Mirsaid | YULDASHEV MIRSAID | LW | zaxira |
| 12 | Rashidov Bilol | RASHIDOV BILOL | ST | zaxira |
| 30 | SayyidIsfandiyorxon | SAYYIDISFANDIYORXON | RW | zaxira |
