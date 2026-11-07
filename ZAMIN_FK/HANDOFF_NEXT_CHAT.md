# ZAMIN FK — handoff for a new chat (2026-11-07)

Repo: sardorjonbeeey-design/shon-sharaf, branch `claude/new-session-aniok6`. Everything lives in `ZAMIN_FK/`.

## How the user wants me to work
- Very short answers. For `/add`: reply only `done` or `failed`.
- Uzbek (Latin) for all content; English for chat.
- Engagement first (`00_ENGAGEMENT_PRINCIPLES.md`). Daily video; I make it, the user posts.

## Canon / numbers
- Club ZAMIN FK, town Qoratepa, blue/white, crest locked (`03_Approved_Assets`).
- 1 follower = 1 virtual fan; 1 like = 15 000 so‘m (fixed). Start fund 15 000 000.
- Day 1 vote → STADION won. After Day 1: 74 followers, 161 likes → fund 17 415 000.
- Day 2: "Qoratepa sport jamg‘armasi" (fictional name — user hasn't confirmed the real fund) gave +20 000 000, all spent on renovation → fund 17 415 000. New stand + LED screen.
- Day 2 vote: defender — 1 Doston (22, OVR 67, fast) vs 2 Sherzod (25, OVR 69, strong). Cliffhanger: "Ertaga… echkiga nima bo‘ldi?"
- Characters: Rustam aka (coach), Bekzod (striker), Jasur (GK), Aziz (MF), stadium goat (broken horn, unnamed), Doston, Sherzod. President narrates only (no approved image uploaded).

## Tools / pipeline
- Video: `tools/anim/` engine (HTML frames → ffmpeg). Episodes: `02_Episode_01/anim_ep01.py`, `02_Episode_02/anim_ep02.py`.
- Images: Poyo `gpt-image-2.6-fixed` (sunburst), magenta bg → `tools/key_sprite.py`. Sprites in `01_Art_Direction/Sprites/`.
- Voice: ElevenLabs voice `rwtcHtZgYU6HN2zLNBlf` (SARHAD-SIZ Narrator); via Poyo `elevenlabs-v4-tts` when ElevenLabs is down.
- Stadium web: `web/stadium/` (template.html + build.py + fans_instagram.json). Live: https://zaminfk.onrender.com (Render auto-deploys on push) and artifact slug `215a7401-fa86-4a92-9a61-ea508c180e36`.
- `/add` skill: `.claude/skills/add/`.
- Make.com: scenario 8437226 replies to every Instagram comment (filter skips its own replies). Next: add commenters to the stadium automatically — needs a GitHub connection inside Make.

## Open items
- Post Day 2 video + story; collect Day 2 vote at cutoff.
- Confirm real vs fictional fund name.
- Make → GitHub auto-add (user must connect GitHub in Make).
- Revoke the GitHub token the user pasted in chat.
