"""Day 6 film: 'Sizning joyingiz kutmoqda' (YOUR SEAT IS WAITING).
Stills (assets/K*.png) + camera moves and light effects (film.html) + narration, music, crowd.
Usage: python3 make_ep06.py            -> exports/ZFK_EP06_day6.mp4 (+ .srt, caption.txt)
       python3 make_ep06.py 7.9 10.9   -> build/frame_<t>.jpg checks only"""
import json, os, subprocess, sys, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
B = os.path.join(HERE, "build"); os.makedirs(B, exist_ok=True)
M = 1.5                                   # music start; its accents land at M+6, M+12, M+18, final chord at M+30

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))

# narration: (file, start, text)
VO = [("01", 1.4, "Har bir katta tarixning boshlanishida… hali bo‘sh joylar bo‘ladi."),
      ("02", 8.0, "Ammo bu stadionda siz uchun ham joy bor."),
      ("03", 13.4, "ZAMIN FK’ni biz birgalikda quramiz. Har bir muxlis — bu stadiondagi yana bir o‘rin."),
      ("04", 20.3, "500 ta muxlisga yetganimizda, sizlar uchun tayyorlayotgan yangi imkoniyatimizni ochib beramiz."),
      ("05", 26.6, "Va unutmang — ZAMIN FK’da o‘ynash mutlaqo bepul!"),
      ("06", 31.4, "Bu stadionda sizning ham joyingiz bor. Bizni kuzating va do‘stlaringizni ham taklif qiling.")]
TOTAL = 38.3
caps, srt = [], []
def split(text):                           # one caption per sentence / long clause
    out, cur = [], []
    for w in text.split(" "):
        cur.append(w)
        if w[-1] in ".!?…" or (w.endswith(",") and len(cur) > 4): out.append(cur); cur = []
    if cur: out.append(cur)
    return out
for name, t0, text in VO:
    d = dur(os.path.join(HERE, "voice", name + ".mp3")); a, b = t0 + .08, t0 + d - .12
    words = text.split(" "); tot = sum(len(w) + 1 for w in words); acc = 0; wt = []
    for w in words: wt.append(a + (b - a) * acc / tot); acc += len(w) + 1
    i = 0
    for ph in split(text):
        ca = wt[i] - .08; cb = wt[i + len(ph)] if i + len(ph) < len(words) else b + .35
        caps.append({"a": round(ca, 3), "b": round(cb, 3), "words": ph, "wt": [round(x, 3) for x in wt[i:i + len(ph)]]}); i += len(ph)
        srt.append((ca, cb - .02, " ".join(ph)))
    assert t0 + d < TOTAL

SX, SY = 560, 1078                         # the highlighted seat on the 1080x1920 stage (K2 / K6 frames)
seat = lambda s, cy=960: [s, -(SX - 540) * s, -(SY - cy) * s]
EP = {"total": TOTAL, "captions": caps,
 "shots": [
  # 1 — an empty stadium: slow glide through the rows toward the pitch
  {"a": 0, "layers": [{"src": "K1_empty"}], "cam": [[0, 1.06, 30, -20], [6.9, 1.30, -120, 40]], "bright": [[0, .78], [6.9, .95]]},
  # 2 — your place: the light finds one seat, then a supporter takes it
  {"a": 6.9, "fi": .6, "layers": [{"src": "K2_dark"},
        {"src": "K2_seat", "o": [[7.5, 0], [7.58, .75], [7.68, .3], [7.86, 1]]},
        {"src": "K2_fan", "o": [[10.5, 0], [11.25, 1]]}],
   "cam": [[6.9] + seat(1.02), [10.5] + seat(1.36, 900), [13.1] + seat(1.24, 860)]},
  # 3 — the stadium comes alive: same stand, seat after seat is taken
  {"a": 13.1, "fi": .5, "layers": [{"src": "K3_stand_empty"}, {"src": "K3_half", "o": [[13.4, 0], [14.4, 1]]}, {"src": "K3_full", "o": [[14.9, 0], [15.8, 1]]}],
   "cam": [[13.1, 1.42, 0, -330], [16.2, 1.16, 0, -170]], "bright": [[13.1, .9], [15.8, 1.06]]},
  {"a": 16.2, "layers": [{"src": "K4a_father_son"}], "cam": [[16.2, 1.05, 0, 40], [17.9, 1.14, 0, 10]]},
  {"a": 17.9, "layers": [{"src": "K4b_friends"}], "cam": [[17.9, 1.14, 40, 0], [19.5, 1.06, -10, 0]]},
  # 4 — the 500 milestone
  {"a": 19.5, "layers": [{"src": "K5_wide"}], "cam": [[19.5, 1.22, 0, -150], [26.3, 1.04, 0, -20]], "bright": [[19.5, 1.25], [20.3, 1]]},
  # 5 — free to play
  {"a": 26.3, "fi": .35, "layers": [{"src": "K7_pitch"}], "cam": [[26.3, 1.04, 0, 0], [30.9, 1.15, -30, -40]]},
  # 6 — back to the waiting seat, pull back until it is one of the whole crowd
  {"a": 30.9, "fi": .5, "layers": [{"src": "K6_seat_crowd"}], "cam": [[30.9] + seat(1.78), [34.9] + seat(1.0, SY)]},
  {"a": 34.2, "fi": 1.2, "layers": [{"src": "K5_full"}], "cam": [[34.2, 1.0, 0, 0], [TOTAL, 1.10, 0, -30]]},
 ],
 "titles": [
  {"a": 1.5, "b": 6.6, "y": 300, "size": 100, "lines": ["HAR BIR", "KATTA TARIX…"], "stag": .22},
  {"a": 8.3, "b": 12.9, "y": 215, "size": 88, "lines": ["SIZNING HAM", "*O‘RNINGIZ BOR."], "stag": .18},
  {"a": 16.35, "b": 19.4, "y": 1130, "size": 78, "lines": ["HAR BIR MUXLIS —", "*BIR *O‘RIN."]},
  {"a": 20.5, "b": 26.1, "y": 705, "size": 86, "lines": ["MUXLIS —", "KEYINGI BOSQICH!"]},
  {"a": 27.3, "b": 30.75, "y": 600, "size": 112, "lines": ["O‘YNASH —", "*100% *BEPUL!"]},
  {"a": 31.9, "b": 34.9, "y": 1170, "size": 80, "lines": ["SIZNING JOYINGIZ", "*KUTMOQDA. {h}"]},
  {"a": 35.6, "b": 99, "y": 905, "size": 78, "lines": ["SIZNING JOYINGIZ", "*KUTMOQDA. {h}"]},
 ],
 "n500": {"a": 19.5, "b": 26.1},
 "crest": [{"a": 26.8, "b": 30.75, "y": 150, "h": 380}, {"a": 35.2, "b": 99, "y": 330, "h": 520}],
 "cta": {"a": 36.0},
 "flashes": [{"t": 19.5, "k": .85, "d": .8}, {"t": 26.3, "k": .3, "d": .5}],
 "blooms": [{"t": 7.86, "i": .3, "d": 1.2, "k": .55, "x": 52, "y": 55, "r": 55}, {"t": 10.9, "i": .45, "d": .9, "k": .8, "x": 52, "y": 50, "r": 70},
            {"t": 31.5, "i": .6, "d": 1.6, "k": .35, "x": 52, "y": 50, "r": 60}],
 "dim": [[0, 0], [35.0, 0], [35.9, .5], [TOTAL - .35, .5], [TOTAL, 1]],
 "dust": [[6.9, 0], [7.9, 1], [12.6, 1], [13.1, 0], [30.9, 0], [31.2, .8], [33.5, .8], [34.6, 0]],
}
json.dump(EP, open(os.path.join(B, "ep.json"), "w"), ensure_ascii=False)

RENDER = r"""
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
(async () => {
  const [html, epPath, out, ...ts] = process.argv.slice(2);
  const EP = JSON.parse(fs.readFileSync(epPath, 'utf8'));
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => { console.error('PAGEERR', String(e)); process.exit(1); });
  await p.goto('file://' + html); await p.evaluate(ep => { window.EP = ep; }, EP); await p.evaluate(() => window.ready());
  if (ts.length) { for (const t of ts) { await p.evaluate(t => window.renderAt(t), +t); await p.screenshot({ path: out + '/frame_' + t + '.jpg', type: 'jpeg', quality: 88 }); } await b.close(); return; }
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(EP.total * 30);
  for (let f = 0; f < n; f++) { await p.evaluate(t => window.renderAt(t), f / 30); const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if (f % 150 === 0) process.stderr.write('frame ' + f + '/' + n + '\n'); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
})();
"""
open(os.path.join(B, "render.js"), "w").write(RENDER)
html, ep = os.path.join(HERE, "film.html"), os.path.join(B, "ep.json")
if len(sys.argv) > 1:
    subprocess.run(["node", os.path.join(B, "render.js"), html, ep, B] + sys.argv[1:], check=True); sys.exit()
silent = os.path.join(B, "video.mp4")
if "--audio-only" not in os.environ.get("ZFK", ""):
    subprocess.run(["node", os.path.join(B, "render.js"), html, ep, silent], check=True)

# ---------- sound design ----------
SR = 44100
def wav(name, x):
    x = np.clip(x, -1, 1); w = wave.open(os.path.join(B, name), "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close(); return os.path.join(B, name)
rng = np.random.default_rng(6)
def lp(x, k):                               # one-pole low-pass
    y = np.empty_like(x); a = 0.0
    for i in range(len(x)): a += k * (x[i] - a); y[i] = a
    return y
# empty-stadium air: low wind with a slow swell
n = int(SR * 16); t = np.arange(n) / SR
air = lp(rng.standard_normal(n), .012) * 9 * (.6 + .4 * np.sin(t * .7)) * np.clip(t / 1.5, 0, 1) * np.clip((16 - t) / 6, 0, 1)
air_f = wav("air.wav", air * .09)
# riser into the 500 hit + the hit itself (sub boom and airy burst)
n = int(SR * 1.3); t = np.arange(n) / SR
riser = (rng.standard_normal(n) - lp(rng.standard_normal(n), .2)) * (t / 1.3) ** 3 * .35
n2 = int(SR * 3.0); t2 = np.arange(n2) / SR
boom = np.sin(2 * np.pi * (38 + 34 * np.exp(-t2 * 9)) * t2) * np.exp(-t2 * 2.2) * .95 + lp(rng.standard_normal(n2), .08) * np.exp(-t2 * 3.5) * 1.6
hit_f = wav("hit.wav", np.concatenate([riser, boom]))
# the light finding the seat: soft glassy shimmer
n = int(SR * 2.6); t = np.arange(n) / SR
shim = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(659.3, .5), (987.8, .35), (1318.5, .22), (1975.5, .1)]) * np.exp(-t * 1.6) * np.clip(t / .04, 0, 1) * .3
shim_f = wav("shimmer.wav", shim)

V = lambda n: os.path.join(HERE, "voice", n + ".mp3")
music = os.path.join(HERE, "sfx", "music.mp3")
bed = os.path.join(os.path.dirname(HERE), "03_Episode_03", "sfx", "crowd_bed.wav")
ins = [silent, music, music, air_f, hit_f, shim_f, shim_f, bed, bed] + [V(n) for n, _, _ in VO]
d = lambda s: f"adelay={int(s * 1000)}:all=1"
fc = [
 f"[1:a]{d(M)},volume=0.95[mus]",
 f"[2:a]atrim=30:36,asetpts=PTS-STARTPTS,aecho=0.8:0.9:700|1400|2300:0.6|0.45|0.3,afade=t=in:d=1.5,afade=t=out:st=5.5:d=3,{d(M + 30)},volume=0.6[tail]",
 f"[3:a]volume=1.0[air]",
 f"[4:a]{d(19.5 - 1.3)},volume=0.9[hit]",
 f"[5:a]{d(7.5)},volume=0.8[sh1]", f"[6:a]asetrate={SR}*1.26,aresample={SR},{d(10.75)},volume=0.6[sh2]",
 # crowd: a murmur as the first supporter arrives, a full stand by the milestone, warm to the end
 f"[7:a]lowpass=f=1100,{d(10.4)},volume='if(lt(t,10.4),0,if(lt(t,13.1),0.10*(t-10.4)/2.7,if(lt(t,19.5),0.10+0.5*(t-13.1)/6.4,max(0,0.6-(t-19.5)))))':eval=frame[cr1]",
 f"[8:a]atrim=8,asetpts=PTS-STARTPTS,{d(19.3)},afade=t=in:st=19.3:d=0.5,volume='if(lt(t,30.9),0.6,0.4)':eval=frame[cr2]",
]
for i, (n, t0, _) in enumerate(VO): fc.append(f"[{9 + i}:a]{d(t0)},volume=1.9[v{i}]")
fc += ["".join(f"[v{i}]" for i in range(len(VO))) + f"amix=inputs={len(VO)}:normalize=0,asplit=2[vo][key]",
       "[mus][tail][air][hit][sh1][sh2][cr1][cr2]amix=inputs=8:normalize=0[bgm]",
       "[bgm][key]sidechaincompress=threshold=0.03:ratio=5:attack=40:release=450[duck]",
       f"[duck][vo]amix=inputs=2:normalize=0,atrim=0:{TOTAL},afade=t=out:st={TOTAL - 1.2}:d=1.2,aresample=48000[a]"]
out = os.path.join(HERE, "exports", "ZFK_EP06_day6.mp4")
mix = os.path.join(B, "mix.wav")
cmd = ["ffmpeg", "-v", "error", "-y"]
for p in ins: cmd += ["-i", p]
subprocess.run(cmd + ["-filter_complex", ";".join(fc), "-map", "[a]", mix], check=True)
# one static gain to -14 LUFS (keeps the quiet opening quiet and the build a build), then a limiter
import re
log = subprocess.run(["ffmpeg", "-i", mix, "-af", "loudnorm=print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
gain = -14 - float(re.search(r'"input_i"\s*:\s*"(-?[\d.]+)"', log).group(1))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", silent, "-i", mix, "-af", f"volume={gain:.2f}dB,alimiter=limit=0.89:attack=5:release=80", "-map", "0:v", "-map", "1:a",
                "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-maxrate", "9M", "-bufsize", "18M", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-t", str(TOTAL), out], check=True)
srt = [(a, min(b, srt[i + 1][0] - .04) if i + 1 < len(srt) else b, x) for i, (a, b, x) in enumerate(srt)]
f = lambda s: "%02d:%02d:%02d,%03d" % (s // 3600, s % 3600 // 60, s % 60, round(s % 1 * 1000) % 1000)
open(out[:-4] + ".srt", "w").write("".join(f"{i + 1}\n{f(a)} --> {f(b)}\n{txt}\n\n" for i, (a, b, txt) in enumerate(srt)))
print(out, dur(out))
