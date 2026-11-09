"""Add Instagram usernames to the stadium and rebuild dist/index.html.
Usage: python3 add_fans.py @nick1 @nick2 ...   -> prints 'added N' or exits 1 on a bad nick."""
import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
F = os.path.join(HERE, "fans_instagram.json")
raw = [a for arg in sys.argv[1:] for a in re.split(r"[\s,]+", arg) if a]
nicks = [a.lstrip("@").strip().lower() for a in raw]
if not nicks or any(not re.fullmatch(r"[a-z0-9._]{1,30}", n) for n in nicks):
    sys.exit("bad username")
fans = json.load(open(F))
have = {f.lower() for f in fans}
new = [n for n in dict.fromkeys(nicks) if n not in have]
fans += new
json.dump(fans, open(F, "w"), ensure_ascii=False)
subprocess.run([sys.executable, "-I", os.path.join(HERE, "build.py"), F], check=True, stdout=subprocess.DEVNULL)
print("added", len(new), "total", len(fans))
