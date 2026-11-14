"""Fit the five Poyo narration lines (voice/NN.mp3 + NN.json char timestamps) into their 3 s slots:
trim leading/trailing silence, speed up just enough (>= 1.10, <= 1.30), write voice/NN_fit.wav and build/words.json
(per-word start/end on the 15 s timeline, used for the word-by-word captions and the SRT)."""
import json, subprocess, numpy as np, os
H = os.path.dirname(os.path.abspath(__file__)); V = H + "/voice"
SLOT = [0.0, 3.0, 6.0, 9.0, 12.0]; LEAD = 0.08; MAXLEN = [2.85, 2.8, 2.8, 2.8, 2.75]
def pcm(p):
    return np.frombuffer(subprocess.check_output(["ffmpeg", "-loglevel", "error", "-i", p, "-f", "s16le", "-ac", "1", "-ar", "48000", "-"]), np.int16).astype(float) / 32768
out = []
for i in range(5):
    n = f"{i+1:02d}"; x = pcm(f"{V}/{n}.mp3"); loud = np.where(np.abs(x) > .02)[0]
    a, b = max(0, loud[0] - 480), min(len(x), loud[-1] + 2400); dur = (b - a) / 48000; a_s = a / 48000
    tempo = min(1.30, max(1.10, dur / MAXLEN[i]))
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f"{V}/{n}.mp3", "-af", f"atrim={a_s:.3f}:{a_s+dur:.3f},asetpts=PTS-STARTPTS,atempo={tempo:.3f},aresample=48000", "-ac", "1", f"{V}/{n}_fit.wav"], check=True)
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
    t0 = SLOT[i] + LEAD
    ws = [dict(w=w, a=round(t0 + max(0, s_ - a_s) / tempo, 3), b=round(t0 + max(0, e_ - a_s) / tempo, 3)) for w, s_, e_ in words]
    out.append(dict(line=i + 1, start=t0, end=round(t0 + fd, 3), tempo=round(tempo, 3), words=ws)); print(n, f"raw {dur:.2f}s tempo {tempo:.2f} -> {fd:.2f}s, ends {t0+fd:.2f}")
json.dump(out, open(H + "/build/words.json", "w"), ensure_ascii=False, indent=1)
