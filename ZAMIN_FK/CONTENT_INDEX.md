# ZAMIN FK — content index (read this first)

One place for everything content-related: where files live, how videos are made, what works. Update it whenever content is added.

## Canon
- Club ZAMIN FK, town Qoratepa, royal blue `#1F4FB8` + white. Crest locked: `03_Approved_Assets/ZFK_CREST_MASTER_V01_P_2048.png`.
- All content text in Uzbek (Latin), apostrophes as `o‘ g‘ ’`. Chat with the user in English, very short.
- 1 follower = 1 virtual fan = 1 seat in the stadium. 1 like = 15 000 so‘m. Numbers: `LEDGER.md`.
- Fan-seat identity (from Day 6): each follower is one blue fan seat; never show fake seat counts or imply numbered/reserved seats.
- Next milestone: 500 followers → new feature reveal (feature is secret). Playing ZAMIN FK is free.
- Characters: Rustam aka (coach), Bekzod, Jasur, Aziz, Doston, Sherzod, the goat. Sprites: `01_Art_Direction/Sprites/`.
- Rules/checklists: `00_ENGAGEMENT_PRINCIPLES.md`, `DAILY_RUNBOOK.md`. Older context: `HANDOFF_NEXT_CHAT.md`.

## Episodes
| Day | Folder | Final video | Notes |
|---|---|---|---|
| 1 | `02_Episode_01/` | `exports/ZFK_EP01_day1_anim.mp4` | Vote: first step → STADION won. Build: `anim_ep01.py` |
| 2 | `02_Episode_02/` | `exports/ZFK_EP02_day2.mp4` | Renovation, defender vote; story PNGs in `exports/`. Build: `anim_ep02.py` |
| 3 | `03_Episode_03/` | `exports/ZFK_EP03_day3.mp4` (+ `.srt`) | Doston won; friendly vs Paxtakor; bus-driver CTA. `script.md`, `anim_ep03.py` |
| 4 | `04_Episode_04/` | — | `script.md` only, not produced |
| 5 | — | — | nothing in repo |
| 6 | `06_Episode_06/` | `exports/ZFK_EP06_day6.mp4` (+ `.srt`, `caption.txt`) | "Sizning joyingiz kutmoqda" — empty seat → fan → full stadium → 500 → free → CTA. Build: `make_ep06.py` + `film.html` |

Each episode folder: `assets/` (images), `voice/` (narration per line), `sfx/`, `exports/` (deliverables), `build/` (temp, ignored).

## Day 6 reusable pieces
- Keyframes `06_Episode_06/assets/`: `K1_empty`, `K2_dark` / `K2_seat` / `K2_fan` (same frame: seat unlit → lit → fan seated — the signature shot), `K3_stand_empty` / `K3_half` / `K3_full`, `K4a_father_son`, `K4b_friends`, `K5_wide` / `K5_full`, `K6_seat_crowd`, `K7_pitch`.
- Music `sfx/music.mp3` (40 s, accents at 6/12/18 s, final chord 30 s). Crowd bed: `03_Episode_03/sfx/crowd_bed.wav`.
- `film.html` = cinematic engine (camera keyframes, layer crossfades, bloom, dust, grain, titles, word-by-word subtitles, 500 graphic, crest, CTA buttons). `make_ep06.py` holds the timeline and the audio mix; `python3 make_ep06.py 7.9 10.9` renders check frames, `ZFK=--audio-only` remixes without re-rendering (full render ≈ 7 min).

## Tools that work / don't (checked 2026-11-12)
- Images: Poyo `gpt-image-2.6-fixed`, `version: sunburst`, `size: 9:16`. Output is always ~941×1672 whatever `resolution` says, so use `1K` (1.7 credits). Edits (`image_urls`) keep the frame almost pixel-aligned — good for before/after pairs. Results: `https://cdn.doculator.org/images/<task_id>/<task_id>.png`.
- Style block used for Day 6: "Cinematic realistic 3D animated-film style … small-town football stadium in Uzbekistan … royal-blue (#1F4FB8) plastic bucket seats … plain shirts and scarves, no text, no logos".
- Voice: Poyo `elevenlabs-v4-tts`, `voice: rwtcHtZgYU6HN2zLNBlf`, `language_code: uz`, no audio tags; write numbers as words ("besh yuzta") and "Zamin FK". ~1 credit per line.
- Music / SFX: ElevenLabs flow tools (`eleven_music_v2_5` works; free tier runs one generation at a time — never fire in parallel). ElevenLabs SFX returned only 1 s — synthesize or reuse the crowd bed.
- Video generation: NOT available (Poyo key blocks all video and music models; ElevenLabs video needs a paid plan). Use stills + motion.
- Fonts: `web/city/assets/fonts/Montserrat_*.ttf`. Headless Chromium can't reach CDNs; route three.js from a local npm copy if rendering the 3D stadium.

## Other content
- Art direction and prompts: `01_Art_Direction/` (`ZFK_PROMPT_PACK_V01.md`, crest spec, sprites). Drafts: `04_Revision_Assets/`. Stadium concepts: `../concepts/`.
- Virtual stadium page (followers' seats): `web/stadium/` (`fans_instagram.json`, `build.py`), `/add` skill adds followers.
- Older builders: `tools/anim/` (cartoon engine, Days 1–3), `tools/build_episode.py`, `tools/stadium/`.
