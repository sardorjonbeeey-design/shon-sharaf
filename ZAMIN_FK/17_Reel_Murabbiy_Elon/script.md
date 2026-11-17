# 17_Reel_Murabbiy_Elon — script & rebuild notes

## Content
- **Winner:** @hayitboyev.76 (46 likes, liked by author) — determined from Reel 16 comments
- **CTA:** Sinov Jamoasi — comment your position + name to join the trial team

## Beats
| # | Start | Narration |
|---|---|---|
| 1 | 0.25 | Murabbiy aniqlandi! |
| 2 | 1.90 | Eng ko'p layk — hayitboyev nuqta yetmish olti! Tabriklaymiz! |
| 3 | 6.54 | Murabbiyning birinchi qarori — sinov o'yini! |
| 4 | 9.53 | Sinov jamoasiga kirish uchun: pozitsiyangiz va ismingizni yozing. |
| 5 | 13.89 | Aytgancha... eng faol o'yinchi asosiy jamoaga o'tishi mumkin. (whisper, stability 0.08) |
| 6 | 17.94 | Obuna bo'ling, o'yin boshlanmoqda! |

Total: 21.12s

## Visual design
- Radial vignette scrim + purple-teal tint (distinct from R16 linear blue-black)
- Camera: zoom OUT (1.06→1.0), vs R16 zoom in
- Fan XI (B-side, gold) — dimmed during beat 5
- MURABBIY: centre-screen reveal card (beats 1-2), not corner slot
- Sinov Jamoasi: teal (#00D4AA) slots (A-side)
- Beat 5 (whisper): dark overlay + goat_chew.png peeks bottom-left

## Rebuild
```bash
python3 prep_voice.py          # rebuild build/words.json
node render.js video build/silent.mp4
python3 make_17b.py            # audio mix → exports/ZFK_murabbiy_elon.mp4
```

## Voice jobs (Poyo elevenlabs-v4-tts, voice rwtcHtZgYU6HN2zLNBlf)
01 RMQ3SVEQA3U1ZDLY · 02 OIKSNMBWS7NQEL1N · 03 221XVOT7P9NUXXL1
04 FEGBVIXUDAP1IZ8C · 05 B6W4VQLPZEDAKXPR · 06 B7ZHUU6UTD3TDP0E
