"""Mix narration + SFX + music → exports/ZFK_match_19.mp4"""
import subprocess, json, os, sys
H = os.path.dirname(os.path.abspath(__file__))
B = H + "/build"; V = H + "/voice"; E = H + "/exports"; os.makedirs(E, exist_ok=True)
W = json.load(open(B+"/words.json"))
def bs(n): return W[n-1]["start"]
def be(n): return W[n-1]["end"]
END = W[-1]["end"] + 1.5

MUSIC  = H + "/../06_Episode_06/sfx/music.mp3"
CROWD  = H + "/../03_Episode_03/sfx/crowd_bed.wav"
SILENT = B + "/silent.mp4"
OUT    = E + "/ZFK_match_19.mp4"

# concat trimmed voice clips
voice_parts = []
for i in range(9):
    n=f"{i+1:02d}"; p=f"{V}/{n}_fit.wav"
    if os.path.exists(p): voice_parts.append(p)
    else: voice_parts.append(f"{V}/{n}.mp3")

# build narration track (concatenate all _fit.wav with gaps)
parts_args = []
for p in voice_parts: parts_args += ["-i", p]
n = len(voice_parts)
filter_lines = [f"[{i}:a]apad=pad_dur=0.3[p{i}]" for i in range(n)]
concat_str = "".join(f"[p{i}]" for i in range(n)) + f"concat=n={n}:v=0:a=1[narr]"
filter_lines.append(concat_str)
narr_tmp = B+"/narr.wav"
subprocess.run(["ffmpeg","-y","-loglevel","error"] + parts_args + [
    "-filter_complex", ";".join(filter_lines),
    "-map","[narr]","-ac","1",narr_tmp], check=True)

# SFX: crowd roar on goals — use crowd_bed slices
# goal flashes at: bs(3)+0.4=goal1, bs(4)+0.4=goal2, bs(5)+0.5=goal3
def crowd_burst(start, dur=2.5):
    return f"[crowd_in]atrim=0:{dur},asetpts=PTS-STARTPTS,adelay={int(start*1000)}|{int(start*1000)},apad=pad_dur={END}[cb{int(start*10):04d}]"

# assemble with ffmpeg complex filter
subprocess.run(["ffmpeg","-y","-loglevel","error",
    "-i", SILENT,        # 0 video
    "-i", narr_tmp,      # 1 narration
    "-i", MUSIC,         # 2 music
    "-i", CROWD,         # 3 crowd bed
    "-filter_complex",
    # narration: full vol
    "[1:a]volume=1.0[narr];"
    # music: low under narration, slight rise at end
    f"[2:a]atrim=0:{END},asetpts=PTS-STARTPTS,volume=0.22[mus];"
    # crowd: subtle bed, louder on goal scenes (B3-B5)
    f"[3:a]atrim=0:{END},asetpts=PTS-STARTPTS,volume=0.18[cbed];"
    # crowd bursts on each goal
    f"[3:a]atrim=0:2.5,asetpts=PTS-STARTPTS,volume=0.6,adelay={int((bs(3)+0.3)*1000)}|{int((bs(3)+0.3)*1000)},apad=pad_dur={END}[cb1];"
    f"[3:a]atrim=0:2.5,asetpts=PTS-STARTPTS,volume=0.5,adelay={int((bs(4)+0.3)*1000)}|{int((bs(4)+0.3)*1000)},apad=pad_dur={END}[cb2];"
    f"[3:a]atrim=0:3.0,asetpts=PTS-STARTPTS,volume=0.7,adelay={int((bs(5)+0.4)*1000)}|{int((bs(5)+0.4)*1000)},apad=pad_dur={END}[cb3];"
    # mix all audio
    "[narr][mus][cbed][cb1][cb2][cb3]amix=inputs=6:duration=longest:normalize=0[mix];"
    f"[mix]atrim=0:{END},loudnorm=I=-14:TP=-1.5:LRA=9[aout]",
    "-map","0:v","-map","[aout]",
    "-c:v","copy","-c:a","aac","-b:a","192k","-shortest",
    OUT], check=True)

print(f"→ {OUT}")
sz = os.path.getsize(OUT)/1e6
dur = float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",OUT]).strip())
print(f"   {sz:.1f} MB  {dur:.1f}s")
