"""Measure mp3 durations, lay on timeline, write build/words.json with beat start/end."""
import json, subprocess, os
H = os.path.dirname(os.path.abspath(__file__))
V = H + "/voice"; os.makedirs(H + "/build", exist_ok=True)
N = 9; GAP = [0.25, 0.3, 0.2, 0.25, 0.4, 0.3, 0.25, 0.3, 0.0]; LEAD = 0.0

def dur(p):
    return float(subprocess.check_output(
        ["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",p]).strip())

def trim(src, dst):
    import numpy as np
    pcm = subprocess.check_output(["ffmpeg","-loglevel","error","-i",src,
        "-f","s16le","-ac","1","-ar","48000","-"], stderr=subprocess.DEVNULL)
    x = (np.frombuffer(pcm, np.int16).astype(float)/32768)
    loud = x[np.abs(x)>.015]
    if len(loud)==0: return dur(src)
    idx = np.where(np.abs(x)>.015)[0]
    a,b = max(0,idx[0]-400), min(len(x),idx[-1]+2400)
    a_s, d = a/48000, (b-a)/48000
    subprocess.run(["ffmpeg","-loglevel","error","-y","-i",src,
        "-af",f"atrim={a_s:.3f}:{a_s+d:.3f},asetpts=PTS-STARTPTS,aresample=48000",
        "-ac","1",dst], check=True)
    return dur(dst)

out, t = [], LEAD
TEXTS = [
    "Hech kim kutmagan edi.",
    "Zamin FK — Muxlislar Jamoasi.",
    "O'ttiz to'rtinchi daqiqa — Hasa. GOL! Bir — nol!",
    "Oltmish yettinchi daqiqa. Muxlislar Jamoasi tenglashtirdi. Bir — bir.",
    "Sakson to'qqizinchi daqiqa. Va... ikki — bir! Muxlislar Jamoasi g'alaba qildi!",
    "Zamin FK — bir. Muxlislar Jamoasi — ikki.",
    "Ertaga: Team B — Team C.",
    "Murabbiy esa... hali ham ishonmaydi.",
    "Keyingi video sizdan. Eng creative izoh — keyingi video bo'ladi.",
]
for i in range(N):
    n = f"{i+1:02d}"
    src = f"{V}/{n}.mp3"; dst = f"{V}/{n}_fit.wav"
    d = trim(src, dst)
    out.append(dict(beat=i+1, start=round(t,3), end=round(t+d,3), text=TEXTS[i]))
    print(f"B{i+1}: {t:.2f}–{t+d:.2f}s  \"{TEXTS[i][:40]}\"")
    t += d + GAP[i]

print(f"\nTotal narration: {out[-1]['end']:.2f}s")
json.dump(out, open(H+"/build/words.json","w"), ensure_ascii=False, indent=1)
print("→ build/words.json")
