# ZAMIN FK — CONTENT MASTER
Version: 1.0
Status: Single source of truth for all ZAMIN FK creative/content decisions.
Language: Chat with the user in English; all audience-facing content in Uzbek Latin unless the user requests otherwise.

## HOW CLAUDE MUST USE THIS FILE

This file replaces the separate ZAMIN FK content briefs, art-direction notes, prompt packs, episode scripts, engagement rules, handoff notes, runbook, asset notes and content ledger.

1. Read this file first whenever working on ZAMIN FK content.
2. Do not search old chats or reread the whole repository to recover creative context.
3. Do not create another general content guide, prompt pack, handoff, runbook, caption guide or duplicate episode script. Keep the canonical creative information here.
4. For an episode currently being produced, open only that episode's technical production files/assets when needed to render or revise it. Those files are production inputs, not competing creative briefs.
5. Update this file when the user approves a lasting creative decision, a story event, a vote result, a metric or a continuity change. Keep each fact in one appropriate section; edit the existing fact instead of repeating it elsewhere.
6. Never turn a proposal into canon without user approval. Label items as APPROVED, CURRENT, DRAFT, PROPOSED or UNRESOLVED.
7. If two sources disagree, do not silently choose or invent a correction. Record the conflict under “Unresolved continuity and data checks” and ask only when the conflict blocks the next production.
8. Preserve the user's existing code, website, production scripts, JSON render configurations, assets and deployment setup. This file is a creative reference, not permission to refactor code.
9. Keep this document concise as it evolves: one canonical rule per topic, episode history only for facts needed for continuity, no repeated explanations.

## 1. PROJECT IDENTITY

- Project/club: ZAMIN FK.
- Fictional home town: Qoratepa, Uzbekistan.
- Core premise: build a small, struggling amateur football club from the ground up, with the audience actively deciding its future.
- Main objective: social-media engagement. Every episode should give viewers a clear reason to stop, watch, comment, vote, like, share, follow and return for the visible consequence of their participation.
- Audience role: supporters are not passive viewers; their choices shape the club, its squad, facilities and story.
- Tone: cinematic, funny, warm, grounded Uzbek amateur-football world. Humour should come from recognisable characters and situations, not random slapstick.
- The club is currently modest and under-resourced. Improvements must be earned through story events and audience decisions.
- Chat language: English. Audience-facing scripts, captions, overlays and dialogue: Uzbek Latin, with correct Uzbek apostrophes and spelling.

## 2. CANONICAL BRAND AND VISUAL IDENTITY

### Club identity
- Name: ZAMIN FK.
- Main colours: royal blue and white.
- Primary blue: #1F4FB8.
- Dark navy shade: #0D2557.
- White: #FFFFFF.
- No additional club colour (including gold/yellow) without explicit approval. Gold/yellow may appear only as a temporary graphic accent if already present in an approved production design; do not treat it as a club identity colour.
- The world is a small Uzbek town: believable local architecture, worn football facilities, poplar trees, low mountains where appropriate, natural materials and everyday details.

### Overall image direction
- Realistic 3D animated-film style.
- Natural skin, hair and fabric detail; believable proportions; slightly expressive faces for comedy.
- Cinematic but natural lighting. Avoid plastic-looking materials, exaggerated cartoon anatomy or generic fantasy styling.
- Keep character faces, body proportions, hairstyles, clothing, crest placement and props consistent between shots.
- Use approved character and environment references as identity references. Change only the pose, expression, camera or scene action requested.
- No watermark. No random text, numbers, shirt numbers, sponsor marks or invented logos. Add typography and changing figures as separate editable overlays, not baked into generated images.
- When a prompt needs a visual, specify subject, action, camera, location, lighting, framing, reference images and exclusions. Do not regenerate an approved master casually.

### Video format and composition
- Main format: vertical 9:16, 1080 × 1920, 30 fps.
- Typical target length: 45–48 seconds; adapt only when the episode's approved story needs it.
- First second must communicate the hook even with sound muted.
- Keep important text and faces away from platform interface areas: reserve roughly 150 px on the right and 350 px at the bottom.
- Keep text, subtitles, numbers, vote cards and counters in editable overlay layers.
- Use restrained pan/zoom, parallax and layered animation for still images. AI video may be tested only when it does not break character or world continuity.

## 3. CLUB CREST — APPROVED DESIGN SPECIFICATION

### Core concept and construction
- Classic heater shield; width-to-height ratio 5:6; flat top with slightly rounded upper corners and one lower point.
- Two outlines: dark navy outer contour and thin inner white line.
- Top band: dark navy with centred white ZAMIN.
- Centre field: royal blue; white half-sun rising from a white horizon; seven straight tapered rays; classic white football with dark navy pentagons in front of the sun.
- Bottom section: white with dark navy FK.
- No founding year, city, slogan, sponsor or extra wording inside the crest.
- Meaning: “Zamin” means ground/foundation; the horizon represents the club's starting point, the rising sun a new beginning, and the football the path forward.

### Colours and typography
- Royal blue #1F4FB8; dark navy #0D2557; white #FFFFFF.
- Montserrat ExtraBold/Black, uppercase. Convert text to vector outlines in final master artwork.
- Do not distort, rotate, recolour, stretch or rearrange crest elements.
- Maintain clear space around the crest at least equal to the height of the letter Z.

### Approved variants and use
- P: full-colour master; use for end cards, banners, office wall and covers.
- M1: all-white monochrome; use on blue/dark backgrounds and blue kit.
- M2: all-dark-navy monochrome; use on white/light backgrounds and documents.
- S: simplified small-size mark: shield, ball and simplified sun with five bold rays; omit ZAMIN and FK lettering.
- For P/M1/M2 use at least 120 px digital shield width or 25 mm print width. For S use at least 24 px digital or 12 mm print width. Below 120 px use S.
- On the green goalkeeper kit, use the P crest with a thin white outer keyline.
- In 3D scenes the geometry and colours stay the same; only the material may change (embroidered patch, painted concrete, faded banner, framed print).
- Approved-asset inventory recorded on 2026-11-06: P SVG and 2048 PNG; M1 SVG and 2048 PNG; M2 SVG and 2048 PNG; S SVG and 2048 PNG; Rustam master PNG. The approved-assets folder remains the location of the actual files.

## 4. CHARACTERS AND RECURRING COMEDY

### Rustam aka — head coach
- Uzbek man, approximately 45–50.
- Strong jaw, short dark hair greying at temples, thick serious eyebrows, slight belly.
- Royal-blue coaching tracksuit with white stripes; silver whistle; tactics clipboard.
- Stern, treats amateur training like a cup final.
- Approved character reference: ZFK_RUSTAM_MASTER_V01.png. Keep the approved face and design stable.

### Bekzod — striker
- Uzbek man, 22; lean and athletic; short dark hair with sharp fade.
- Overconfident half-smile; behaves like a superstar.
- Royal-blue shirt, white shorts, blue socks, white boots; small crest on left chest; no shirt number.
- Recurring gag: celebrates before the ball has actually gone in. In Episode 01 he misses and the ball rolls towards the goat.

### Jasur — goalkeeper
- Uzbek man, 24; tall, broad shoulders, friendly round face, slightly messy short black hair.
- Green goalkeeper kit and gloves; crest with thin white outline.
- Relaxed or sheepish; recurring comic behaviour includes losing/searching for his gloves and excuses.

### Aziz — midfielder
- Uzbek man, 19; slim; neat short black hair; calm, intelligent eyes.
- Completely deadpan expression.
- Royal-blue shirt, white shorts and blue socks; holds a football at his hip; no shirt number.
- Comedy comes from his serious, unreactive presence amid chaos.

### Doston — defender
- Uzbek player, 22; fast profile; OVR 67.
- Selected by the audience over Sherzod in the Episode 02 vote; joined the squad in the Episode 03 story.
- Do not invent further appearance details unless an approved reference is available.

### Sherzod — defender
- Uzbek player, 25; strong profile; OVR 69.
- Candidate against Doston in the Episode 02 vote; later content says Doston won.
- Episode 03 generated visuals/scripts contain a later “Sherzod joined” beat that conflicts with the earlier vote outcome; do not assume this is canon until resolved.

### The stadium goat
- Scruffy village goat, white with grey patches, one horn broken short, faded blue-and-white scarf scrap around neck, mildly unimpressed expression.
- The goat is a recurring character and a recognisable symbol of the neglected stadium.
- Initially unnamed. The audience may be invited to name it, but this is a separate secondary prompt, not a competing main vote.
- Episode 01: appear as a small visual gag; do not explain the goat or name it.
- Episode 02: tease “What happened to the goat tomorrow?”
- Later proposed arc: after stadium renovation the goat may become an honorary supporter and sit in the new stand. This is an idea, not confirmed story fact unless explicitly approved.
- Maintain the same goat design in every appearance.

### President / narrator
- The club president is the first-person narrator and audience-facing voice.
- Earlier handoff says no approved president character image was uploaded; do not invent a definitive on-screen face. Use voiceover or framing that does not require an unapproved character master until approved.

## 5. STORYTELLING AND ENGAGEMENT SYSTEM

### Core episode structure
Use this five-beat structure as the default:
1. HOOK — immediate visual or story problem.
2. PAYOFF — answer or result promised by the hook.
3. MATCH / TURNING POINT — the football or story action that changes the situation.
4. CONSEQUENCE — show what the event means for the club.
5. QUESTION — one clear audience decision that carries into the next episode.

For the first episode, where there is no previous vote, adapt PAYOFF and MATCH to introduce the club and its goal.

### Engagement rules
- Main purpose is social engagement, not just a polished video.
- One primary question per episode. It should be answerable quickly, preferably with one word, one number or a short club name.
- State exactly what the viewer should write and where.
- State a clear voting deadline and time zone. A 24-hour window is the standard unless a specific episode has an approved different deadline.
- Explain how the winner is determined (for example, the eligible comment with the most likes at cutoff) and apply it consistently.
- Show the audience's previous winning decision and its visible consequence in the next episode: Ask → Close → Show → Carry.
- Include one subtle detail worth rewatching, preferably involving a recurring character or the goat.
- Keep secondary engagement prompts secondary; do not split attention between multiple equal-priority questions.
- Thank viewers and make their influence visible.
- Do not imply virtual money or virtual fan counts are real finances or real attendance.

### Caption pattern
Use this order, adapting the actual facts:
1. Episode/day number and one-line outcome.
2. Short context or consequence.
3. One direct question / CTA.
4. Exact response format and deadline.
5. Virtual-mechanics disclaimer when numbers or fund are mentioned.
Do not repeat the entire voiceover in the caption. Do not add several unrelated CTAs.

### Pre-publish check
- Does the first second make sense without sound?
- Is there one primary question?
- Is the response format explicit?
- Are cutoff time and time zone clear?
- Is there a visible payoff from the previous audience decision?
- Is there a rewatch detail?
- Are virtual figures clearly labelled VIRTUAL?
- Are subtitles and overlays outside platform UI safe areas?
- Are figures consistent with the approved content ledger and production version?
- Are Instagram and TikTok links, cutoff and result recorded?

## 6. VIRTUAL FAN AND CLUB-FUND MECHANICS

- All fans, attendance, likes-to-money conversions and club-fund amounts in this fictional series are VIRTUAL game mechanics.
- Canonical rule recorded in the later user-approved ledger on 2026-11-06: 1 follower = 1 virtual fan; 1 like = 15,000 so'm added to the virtual club fund.
- Starting virtual fund recorded: 15,000,000 so'm.
- The current calculation rule is one combined Instagram + TikTok total when both platforms are included.
- Formula: closing fund = opening fund + (eligible combined likes × 15,000 so'm) + approved additions − approved expenses.
- Never present fictional donations, sponsors or investments as real organisations or real transactions. The name “Qoratepa sport jamg‘armasi” was explicitly described in a handoff as fictional and not confirmed by the user as a real fund.
- Every displayed fund/fan count must carry a clear VIRTUAL label.
- Keep one running ledger here. Do not maintain a second content ledger file. Update the table below only when the user supplies or confirms the missing platform metrics and cutoff information.

### Content ledger
| Episode | Confirmed story / vote | Fans | Likes | Opening fund | Addition / expense | Closing fund | Status |
|---|---|---:|---:|---:|---|---:|---|
| Start | Club begins from zero | 0 | 0 | — | Starting fund | 15,000,000 so'm | Starting value recorded |
| 01 | First audience choice: stadium renovation | 74 reported after Day 1 | 161 reported after Day 1 | 15,000,000 | 161 × 15,000 = 2,415,000 | 17,415,000 | Later handoff/ledger calculation; check against old Episode 01 render |
| 02 | Stadium wins; stand and LED screen renovated; Doston vs Sherzod defender vote | 74 reported in Episode 02 build | 161 reported in Episode 02 build | 17,415,000 | +20,000,000 fictional investment, then −20,000,000 renovation expense | 17,415,000 | Episode 02 build data |
| 03 | Doston declared winner in script; Paxtakor selected as friendly opponent in later build | Conflicting values: 127 or 142 | Conflicting values: 178, 339 or 446 in source notes | 17,415,000 or 20,085,000 depending on version | Conflicting calculations | 20,085,000 or 21,690,000 depending on version | UNRESOLVED — reconcile before publishing more figures |
| 04 | Paxtakor friendly; bus driver recruitment CTA | 142 mentioned in draft | 446 mentioned in draft | Unconfirmed | Unconfirmed | Unconfirmed | DRAFT — metrics and goat story unresolved |

## 7. EPISODE STORY CONTINUITY

This section stores the story facts and distinctive creative beats. Technical timing, animation instructions, rendered overlays and media remain in their episode production folders.

### Episode 01 — “Noldan boshlaymiz”
Status: scene blueprint marked locked on 2026-11-06; production JSON exists and is the technical render input.

- Opening image: neglected empty stadium at dawn, president alone; opening idea: “Bu klubni hamma unutgan. Lekin men taslim bo‘lmayman.”
- Introduce ZAMIN FK from Qoratepa, old stadium and 15,000,000 so'm starting virtual fund.
- Introduce Rustam aka, overconfident Bekzod, glove-searching Jasur and deadpan Aziz.
- Goal: climb from the lowest amateur league to the top level of Uzbek football.
- Bekzod celebrates before the ball reaches the goal; he misses and the ball rolls towards the goat. Aziz calmly retrieves it.
- Explain the audience mechanic and ask viewers to choose the first investment: stadium renovation, new striker, training base or new coach.
- Standard vote instruction: write one option in the comments; winner determined after 24 hours by the most-liked eligible comment.
- Goat appears as a small rewatch gag and remains unnamed.
- The locked blueprint describes 5 scenes and 45 seconds. The existing episode.json contains the actual render timing and some different dialogue/overlay wording; do not overwrite it as part of content consolidation.

### Episode 02 — “Siz tanladingiz — STADION!”
Status: rendered Day 2 production script is embedded in anim_ep02.py; there is no separate episode 02 script.md.

- Hook: “Siz tanladingiz — STADION! Lekin bitta muammo bor...”; audience comments appear; stadium wins.
- Result: 74 fans and 161 likes are shown in the Day 2 animation; opening fund becomes 17,415,000 so'm under the later 15,000-so'm-per-like rule.
- Investment beat: the fictional Qoratepa sport jamg‘armasi provides +20,000,000 so'm; all of it is spent on stadium renovation.
- Visible consequence: new stand and large LED screen; winning comment and new supporter names appear on the screen.
- Next decision: choose defender 1 Doston (22, OVR 67, fast) or 2 Sherzod (25, OVR 69, strong). Viewer writes 1 or 2.
- Outro: goat appears; promise to reveal what happened to it in the next episode.
- Important: the Day 2 build code is the production implementation, not a separate narrative brief. Do not alter it during documentation consolidation.

### Episode 03 — Day 3
Status: script and generated build artifacts disagree; preserve both facts as a conflict until verified.

- Script.md: opens with “SIZ TANLADINGIZ: DOSTON!”; says Doston, 22, OVR 67, won with 78%; thanks voters.
- Script.md: says club fund 21,690,000 so'm (virtual); introduces the city and @zaminfk_bot; invites people to join the club, find work or take a seat/home in the city.
- Script.md: asks which club should play a friendly match; asks viewers to write a club name; outro teases the goat.
- Generated build anim.json: selects Paxtakor as the friendly opponent; shows 142 virtual fans; shows 21,690,000 so'm and +107 × 15,000 so'm; includes a bus/driver recruitment beat and CTA “MEN HAYDOVCHIMAN”.
- Generated build ov.json: shows 127 fans, 20,085,000 so'm and +178 × 15,000 so'm.
- These are not interchangeable versions. Do not use figures from one artifact to update another without confirmation.
- The build's later content says Sherzod joined the squad and the goat became the club's brand face; this conflicts with the Doston-won script and must be checked before treating Sherzod's joining as canon.

### Episode 04 — Day 4 draft
Status: draft; not fully approved.

- Opening: Paxtakor chosen by supporters; friendly match announced.
- Main problem: ZAMIN FK needs a bus driver to travel to Tashkent.
- CTA in draft: apply through @zaminfk_bot and comment “BORAMAN”; most-liked eligible driver application announced the next day.
- Draft update says 142 fans and 446 total likes; the fund figure is not settled.
- The goat's fate is deliberately unresolved in the draft. Previous episodes promised a reveal, so this must be answered before the next script is locked.
- Draft length is approximately 40–44 seconds.
- Do not invent the goat's fate or final financial figures.

## 8. PROMPT LIBRARY — APPROVED CREATIVE BASELINES

### Shared visual style prompt
Realistic 3D animated-film style, natural skin and fabric detail, soft cinematic lighting, believable proportions with slightly expressive faces for comedy. Set in a small town in Uzbekistan. ZAMIN FK colours: royal blue #1F4FB8 and white. No text, no logos other than the ZAMIN FK crest where stated, no watermark.

### Character master prompt briefs
- Rustam aka: Uzbek head coach, 45–50, strong jaw, short dark hair greying at temples, thick serious eyebrows, slight belly, royal-blue tracksuit with white stripes, silver whistle and tactics clipboard; stern cup-final expression; full-body front view, plain mid-grey background.
- Bekzod: Uzbek striker, 22, lean athletic build, sharp fade, overconfident half-smile, royal-blue shirt, white shorts, blue socks, white boots, small left-chest crest; arms crossed, chin up; full-body front view, no number.
- Jasur: Uzbek goalkeeper, 24, tall and broad-shouldered, friendly round face, slightly messy short black hair, green goalkeeper kit, gloves, crest with white outline; sheepish relaxed smile; full-body front view, no number.
- Aziz: Uzbek midfielder, 19, slim, neat short black hair, calm intelligent eyes, deadpan expression, royal-blue shirt, white shorts, blue socks, small crest, football at hip; full-body front view, no number.
- Goat: scruffy white-and-grey village goat, one horn broken short, faded blue-and-white scarf scrap, mildly unimpressed; full-body side view.
- Use the approved Rustam reference as identity reference for Rustam. Do not copy a reference person's face when a prompt explicitly says it is for style/lighting only. Do not generate a president face without approval.

### Environment master prompt briefs
- Stadium: vertical 9:16, old amateur football ground in a small Uzbek town at dawn, patchy grass, bare dirt in goalmouths, rusty goals without nets, short concrete stand with faded blue-white paint, simple metal fence, broken manual scoreboard, poplars and low mountains in distance, cool cloudy light and mist; empty, no people or animals.
- Dressing room: vertical 9:16, worn room, wooden benches, dented metal lockers, blue-white shirts on hooks, boots, basic tactics board, one bare bulb, faded crest on wall; empty.
- Club office: vertical 9:16, modest desk, old laptop with blank grey screen, documents, calculator, budget notebook, visitor chairs, framed crest, simple tactics board and one dusty cup; warm afternoon light; empty.
- Squad group: president plus four core characters, with other players only as indistinct background silhouettes so the count cannot be read.

### Kit sheet prompt brief
Flat product-style kit sheet on white. Outfield home kit: royal-blue #1F4FB8 shirt with white collar trim, white shorts, blue socks. Goalkeeper kit: green with the same crest outlined in white. Front and back views; no sponsors, numbers or extra text.

### Scene-generation continuity instruction
Use the attached approved masters as identity references. Keep face, body proportions, kit and props identical. Change only the requested pose, expression or camera. No extra characters, labels or text. Keep figures on transparent backgrounds where separate compositing is required and backgrounds as separate layers.

### Image review checklist
- Face, hair, kit, crest and props match the approved master.
- No unintended numbers, shirt numbers, words or logos.
- 9:16 composition respects the right and bottom safe areas.
- Keep visual continuity with the previous episode.

## 9. PRODUCTION WORKFLOW AND RESPONSIBILITIES

1. User supplies the cutoff data: winning comment and likes, Instagram and TikTok post links, follower counts, episode likes and cutoff date/time/time zone.
2. Claude checks the figures against the one ledger in this file and calculates the virtual fund using the approved rule. If values conflict, stop and ask rather than guess.
3. Claude creates the Uzbek script using the five-beat structure and current story state.
4. Claude prepares art using approved character/environment masters.
5. Claude prepares voiceover and sound effects as separate tracks.
6. Claude renders vertical 1080 × 1920, 30 fps MP4 with editable subtitles/overlays and a caption.
7. User reviews on phone and approves or requests changes.
8. User publishes to Instagram and TikTok and supplies links/cutoff data for the next cycle.

- User publishes and reads comments; do not claim Claude has posted or independently verified social metrics unless an actual connected tool has done so.
- The user's approval is required before a final video is treated as approved.
- Keep production code and files in their current locations. Content consolidation does not authorize changing animation scripts, JSON, HTML, CSS, web application code, assets, APIs, backend, deployment or integrations.

## 10. CURRENT OPEN DECISIONS — DO NOT GUESS

1. Episode 03 official figures: reconcile 127 vs 142 fans and 20,085,000 vs 21,690,000 so'm, plus 178/339/446 likes and the actual cutoff data.
2. Confirm whether Sherzod really joined after Doston won the defender vote, or whether the build overlay is incorrect.
3. Confirm the goat's fate, because the story promised a reveal in Episode 02/03 and Episode 04 draft leaves it open.
4. Confirm the Episode 04 final fan/like/fund values before publishing.
5. Confirm whether the fictional Qoratepa sport jamg‘armasi should remain a fictional story device or be replaced by another approved explanation.
6. Confirm the current status of the Paxtakor friendly match and bus-driver recruitment CTA before carrying it forward.
7. Confirm the final approved on-screen president representation; until then use narrator voiceover without inventing a face.

## 11. UPDATE RULE

When a new episode is completed:
- Add one compact episode entry under Section 7 containing only outcome, new canon, audience decision, consequence and next unresolved hook.
- Update the single ledger in Section 6 with confirmed numbers.
- Update character/brand sections only if a lasting design or canon change is approved.
- Remove obsolete “open” items once resolved.
- Do not copy the same fact into multiple sections. Link conceptually by section name if needed; do not duplicate the full explanation.
