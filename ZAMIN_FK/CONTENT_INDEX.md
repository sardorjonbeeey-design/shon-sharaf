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
| 8 | `08_Episode_08/` | `exports/ZFK_EP08_day8.mp4` (+ `.srt`, `caption.txt`, 2 story PNGs) | "Stadion tayyor, tribuna bo‘sh" vs STAR BOYS; renovated stand + fan sprites on a seat grid (fans glued to the camera via `world:true`). Build: `anim_ep08.py` (`--frames t1,t2`, `--stories`, `--audio-only`); `script.md`. No fund/follower numbers (ledger only has Day 1). |
| 9 | `09_Episode_09/` | `exports/ZFK_EP09_match.mp4` (+ `.srt`, `caption.txt`) | ZAMIN FK 2–2 STAR BOYS match film + "yangi menejer" comment CTA. Story scenes: cartoon engine over plates of the 3D stadium; the four goals: 3D clips. Build: `goals3d/render_goals.js` (`video`, `stills`, `preview N`, `frames N t1,t2`) then `anim_ep09.py` (`--frames`, `--keep-story`, `--audio-only`); `script.md`. |

Each episode folder: `assets/` (images), `voice/` (narration per line), `sfx/`, `exports/` (deliverables), `build/` (temp, ignored).

## Day 6 reusable pieces
- Keyframes `06_Episode_06/assets/`: `K1_empty`, `K2_dark` / `K2_seat` / `K2_fan` (same frame: seat unlit → lit → fan seated — the signature shot), `K3_stand_empty` / `K3_half` / `K3_full`, `K4a_father_son`, `K4b_friends`, `K5_wide` / `K5_full`, `K6_seat_crowd`, `K7_pitch`.
- Music `sfx/music.mp3` (40 s, accents at 6/12/18 s, final chord 30 s). Crowd bed: `03_Episode_03/sfx/crowd_bed.wav`.
- `film.html` = cinematic engine (camera keyframes, layer crossfades, bloom, dust, grain, titles, word-by-word subtitles, 500 graphic, crest, CTA buttons). `make_ep06.py` holds the timeline and the audio mix; `python3 make_ep06.py 7.9 10.9` renders check frames, `ZFK=--audio-only` remixes without re-rendering (full render ≈ 7 min).

## Day 9 reusable pieces: 3D match clips from the real stadium
- `09_Episode_09/goals3d/harness.js` loads `web/stadium/dist/index.html` (the upgraded stadium: upper tier + raised roof) in headless Chromium, routes three.js r128 to a local npm copy (`cd 09_Episode_09/build && npm i three@0.128.0`), stops the page's own loop and exposes its scene. `director.js` adds 22 rigged players (`models/player/player.glb`, names/numbers via the page's shirt printer, kits recoloured from the baked texture), nets, ball, cameras, scorebug / GOOOL / scorer card, and puts the score on the stadium LED screen. `scenarios.js` = the plays (paths, passes, shots, dives, cameras) as data.
- The page parks the town's cars and walkers at the pitch centre until its city loop runs; `director.js` hides them. Pitch/track planes are re-tessellated there too (depth flicker in software GL).
- Lineups: ZAMIN FK from the club poster (`09_Episode_09/assets/zamin_lineup_2026-11-13.jpg`); STAR BOYS from the owner's list (in `director.js`). STAR BOYS kit colour is a placeholder (red) — one line in `director.js` (`const red = kitMaterial(...)`).
- Speed: ~2 s per 1080×1920 frame (≈ 8 min per 8 s clip). `preview N` gives a low-res contact sheet in ~40 s.

## Tools that work / don't (checked 2026-11-12)
- Images: Poyo `gpt-image-2.6-fixed`, `version: sunburst`, `size: 9:16`. Output is always ~941×1672 whatever `resolution` says, so use `1K` (1.7 credits). Edits (`image_urls`) keep the frame almost pixel-aligned — good for before/after pairs. Results: `https://cdn.doculator.org/images/<task_id>/<task_id>.png`.
- Style block used for Day 6: "Cinematic realistic 3D animated-film style … small-town football stadium in Uzbekistan … royal-blue (#1F4FB8) plastic bucket seats … plain shirts and scarves, no text, no logos".
- Voice: Poyo `elevenlabs-v4-tts`, `voice: rwtcHtZgYU6HN2zLNBlf`, `language_code: uz`, no audio tags; write numbers as words ("besh yuzta") and "Zamin FK". ~1 credit per line.
- 2026-11-13: Poyo generation calls returned "Invalid API key" (account lookup still worked) and ElevenLabs disabled the free tier for the account, so Day 9 has no narration yet. When a voice tool works again: save one mp3 per block as `09_Episode_09/voice/<KEY>.mp3` (keys and texts in `script.md`; `A.mp3` exists), then `python3 anim_ep09.py` (story timing follows the audio).
- Music / SFX: ElevenLabs flow tools (`eleven_music_v2_5` works; free tier runs one generation at a time — never fire in parallel). ElevenLabs SFX returned only 1 s — synthesize or reuse the crowd bed.
- Video generation: NOT available (Poyo key blocks all video and music models; ElevenLabs video needs a paid plan). Use stills + motion.
- Fonts: `web/city/assets/fonts/Montserrat_*.ttf`. Headless Chromium can't reach CDNs; route three.js from a local npm copy if rendering the 3D stadium.

## Stories
- Secret-project teaser ("SIZGA BIR LAVOZIM TAYYOR…"): `07_Story_secret_teaser/exports/ZFK_story_secret_teaser.png`; editable source `story.html` + `node render.js`; background `assets/bg_manager_chair_v2.png`. The project is a Football Manager game in the Telegram Mini App — still SECRET: never name it, show UI or give a date in public content.
- Day 2 stories: `02_Episode_02/exports/*.png`.

## Other content
- Art direction and prompts: `01_Art_Direction/` (`ZFK_PROMPT_PACK_V01.md`, crest spec, sprites). Drafts: `04_Revision_Assets/`. Stadium concepts: `../concepts/`.
- Virtual stadium page (followers' seats): `web/stadium/` (`fans_instagram.json`, `build.py`), `/add` skill adds followers.
- Older builders: `tools/anim/` (cartoon engine, Days 1–3), `tools/build_episode.py`, `tools/stadium/`.
