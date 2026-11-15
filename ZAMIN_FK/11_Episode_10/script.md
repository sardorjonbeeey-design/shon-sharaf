# Day 10 — new manager announced, "G‘oya sizdan!"

Format: Reel 1080×1920, 30 fps, 39.8 s, Uzbek Latin. Narrator SARHAD-SIZ (Poyo `elevenlabs-v4-tts`, voice `rwtcHtZgYU6HN2zLNBlf`, one file per beat in `voice/`, natural pace).
Winner: `assets/comment_winner.jpg` = the original screenshot (@muxtorov_asilbek15, «Men menejer bulay iltimos», 9 likes) — shown untouched, username and text exactly as posted.

| Beat | Narration | Visual / on-screen |
|---|---|---|
| 1 Hook | Siz tanladingiz! Zamin FKning yangi menejeri aniqlandi! | new stadium, goat hops in ("VAY!"), YANGI MENEJER TANLANDI! from frame 0, the comment card drops in |
| 2 Winner | Tabriklaymiz! Endi klubimizda yangi menejer bor! | comment card, yellow ring on the username, stamp SIZ TANLADINGIZ! (no portrait/character) |
| 3 New idea | Lekin endi faqat menejer emas, siz ham qaror qabul qilasiz! Chunki bizda futbol klubi ham bor, o‘z shahrimiz ham! | ENDI SIZ HAM QAROR QILASIZ! → ZAMIN FK KLUBI (stadium) → ZAMIN FK CITY (the town's empty plots), goat looks club ↔ city |
| 4 Open participation | Klubga nima qo‘shamiz? / Shaharda nima quramiz? / Nimani o‘zgartiramiz yoki qanday yangi imkoniyat yaratamiz? / Bu safar g‘oya sizdan! | stadium ↔ city cuts, giant «?» and «💬 …» bubbles, no option cards |
| 5 CTA | Izohga o‘z g‘oyangizni yozing! Klub uchunmi yoki shahar uchunmi — farqi yo‘q! Eng ko‘p layk olgan izohdagi g‘oyani amalga oshiramiz! Yigirma to‘rt soat! Keyingi o‘zgarish sizning qo‘lingizda! | goat into the lens, comment box, G‘OYA SIZDAN!, ENG KO‘P LAYK ❤ = G‘OLIB, 24 SOAT |
| Outro | Zamin FKni birgalikda quramiz! | SIZNING G‘OYANGIZ? / KLUB YOKI SHAHAR / IZOHLARDA! / 24 SOAT |

Mechanic (unchanged, strict): anyone may suggest anything for the club or the city; no options, no keyword; likes support ideas; after 24 h the most-liked comment wins and becomes the next task; the next episode must show that comment and the real implementation/progress.

Plates: `plates.js` renders stills of the real 3D stadium and town (Day 9 harness; LED screen shows ZAMIN FK STADIONI / SIZ QURASIZ). Build: `python3 prep_voice.py && python3 anim_ep10.py` (`--frames t1,t2`, `--stories`, `--audio-only`).
Deliverables: `exports/ZFK_EP10_reel.mp4`, `.srt`, `caption.txt`, `ZFK_EP10_story1.png` (winner), `ZFK_EP10_story2.png` (G‘OYA SIZDAN!).
