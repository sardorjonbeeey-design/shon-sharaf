"""Trim the six Poyo narration beats (voice/NN.mp3 + NN.json char timestamps), lay them on one timeline and write
build/words.json: per beat start/end, per sentence start/end, per word start/end (seconds on the final video timeline).
No speed-up unless the film would exceed 40 s (then a uniform tempo 1.03-1.08)."""
import json, subprocess, numpy as np, os, re, sys
H = os.path.dirname(os.path.abspath(__file__)); V = H + "/voice"; os.makedirs(H + "/build", exist_ok=True)
N = 6; GAP = [0.35, 0.3, 0.3, 0.3, 0.3, 0.0]; LEAD = 0.25     # silence after each beat; before the first word
TEMPO = float(sys.argv[1]) if len(sys.argv) > 1 else 1.0
def pcm(p):
    return np.frombuffer(subprocess.check_output(["ffmpeg", "-loglevel", "error", "-i", p, "-f", "s16le", "-ac", "1", "-ar", "48000", "-"]), np.int16).astype(float) / 32768
out, t = [], LEAD
for i in range(N):
    n = f"{i+1:02d}"; x = pcm(f"{V}/{n}.mp3"); loud = np.where(np.abs(x) > .02)[0]
    a, b = max(0, loud[0] - 400), min(len(x), loud[-1] + 2000); dur = (b - a) / 48000; a_s = a / 48000
    af = f"atrim={a_s:.3f}:{a_s+dur:.3f},asetpts=PTS-STARTPTS" + (f",atempo={TEMPO:.3f}" if TEMPO != 1 else "") + ",aresample=48000"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f"{V}/{n}.mp3", "-af", af, "-ac", "1", f"{V}/{n}_fit.wav"], check=True)
    fd = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"{V}/{n}_fit.wav"]))
    seg = json.load(open(f"{V}/{n}.json")); ch, st, en = [], [], []
    for s in (seg if isinstance(seg, list) else [seg]):
        ch += s["characters"]; st += s["character_start_times_seconds"]; en += s["character_end_times_seconds"]
    words, cur = [], None
    for c, s_, e_ in zip(ch, st, en):
        if c == " ":
            if cur: words.append(cur); cur = None
        else:
            if cur is None: cur = [c, s_, e_]
            else: cur[0] += c; cur[2] = e_
    if cur: words.append(cur)
    ws = [dict(w=w, a=round(t + max(0, s_ - a_s) / TEMPO, 3), b=round(t + max(0, e_ - a_s) / TEMPO, 3)) for w, s_, e_ in words]
    sents, cur = [], []                                    # split on sentence-final punctuation
    for w in ws:
        cur.append(w)
        if re.search(r"[.!?]$", w["w"]): sents.append(cur); cur = []
    if cur: sents.append(cur)
    out.append(dict(beat=i + 1, start=round(t, 3), end=round(t + fd, 3), words=ws,
                    sents=[dict(a=s[0]["a"], b=s[-1]["b"], words=s) for s in sents]))
    print(n, f"{fd:.2f}s  {t:.2f}-{t+fd:.2f}  sentences {len(sents)}"); t += fd + GAP[i]
print("narration ends", round(out[-1]["end"], 2)); json.dump(out, open(H + "/build/words.json", "w"), ensure_ascii=False, indent=1)
