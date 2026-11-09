# Day 4 production notes (2026-11-09)

## Deliverables
- exports/ZFK_EP04_day4.mp4 — 49.0 s, 1080×1920, 30 fps, H.264 + AAC mono 48 kHz, integrated loudness −15.5 LUFS, peak −1.5 dBFS
- exports/ZFK_EP04_day4.srt — 19 subtitles (same sentences as the on-screen captions)
- exports/ZFK_EP04_caption.txt — Instagram/TikTok caption
- exports/ZFK_EP04_story_winner.png, exports/ZFK_EP04_story_vote.png — stories
- script.md — final narration + scene table; anim_ep04.py — animation source; stories_ep04.py — stories source
- voice/01_hook, 02_winner, 03_fund, 04_andijan, 04b_team, 05_vote (.mp3, 1.2× speed); voice/raw/ — originals

## How it was made
- Engine: tools/anim (unchanged; engine.js taken from the Day 3 branch, adds the goat "talk" idle). Base: 03_Episode_03/anim_ep03.py.
- Voice: SARHAD-SIZ Narrator (rwtcHtZgYU6HN2zLNBlf), ElevenLabs V4 through Poyo (ElevenLabs free tier was busy). Numbers written out in Uzbek words for natural pronunciation. Sped up 1.2× (atempo, pitch kept) because the required script ran 53.8 s.
- New images (Poyo gpt-image-2.6-fixed, 1.7 credits each): assets/players_silhouette.png (anonymous players, keyed from green, darkened to silhouettes in the video), opt1_jersey.jpg, opt2_base.jpg, opt3_academy.jpg. No text, no logos, no faces of real people.
- Winning comment: real screenshot supplied by the club (assets/comment_winner.jpg). No portrait of the winner was supplied, so the driver card uses a bus icon.
- Map: Natural Earth 1:50m (public domain) via world-atlas + d3-geo Mercator (assets/uz_map.json). Andijan placed at 40.78 N, 72.34 E. Qoratepa is NOT placed on the map (the route starts from the club badge at the edge) to avoid a wrong location.
- Fonts: Montserrat Black/Bold copied into /usr/share/fonts/opentype/montserrat for rendering (engine.html expects them there).

## Facts checked
- 97 = winning comment likes; 118 = total Reel likes; 118 × 15 000 = 1 770 000; 21 690 000 + 1 770 000 = 23 460 000.
- No follower count, no partner name, amount, equipment or agreement mentioned.
- Real team scene: no names, positions, criteria or dates; no promise that every applicant is selected; no extra CTA.
- One CTA (1, 2 or 3 in comments, 24 h). Bot not promoted. Options labelled as community proposals (on screen + caption).

## Known limits
- Length 49 s (target 35–42 s + 3–4 s team scene) because the mandated narration is long. Shorten the script to get under 45 s.
- Pronunciation was checked by duration/silence/levels only, not by ear — listen before posting.
