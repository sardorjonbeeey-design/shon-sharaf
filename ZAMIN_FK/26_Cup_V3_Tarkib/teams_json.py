"""TARKIB.md -> build/teams.json (4-3-3 spots, shirt numbers, subs) for film.html and render_story.js"""
import json,re,os
H=os.path.dirname(os.path.abspath(__file__)); src=open(H+"/TARKIB.md",encoding="utf-8").read()
NUM={"GK":1,"LB":3,"RB":2,"CB":4,"CM":6,"RW":7,"CAM":10,"LW":11,"ST":9}
SECOND={"CB":5,"CM":8}; POOL=[14,15,16,17,18,19,20,21,22,23]
WISH={"islom.muhammadov7":51,"rasuluvich_09":8}
SPOTS={"GK":["GK"],"LB":["LB"],"RB":["RB"],"CB":["CB1","CB2"],"CM":["CML","CMR"],"CAM":["CMC"],"LW":["LW"],"RW":["RW"],"ST":["ST"]}
LABEL={"CMC":"CM","CML":"CM","CMR":"CM","CB1":"CB","CB2":"CB"}
out=[]
for club,capt,body,zax in re.findall(r"## (.+?) — asoschi/kapitan @(\S+)\n(.*?)\n  zaxira: (.*?)\n",src,re.S):
    used={}; taken=set(WISH[u] for u in WISH if "@"+u in body); slot={}; xi=[]
    for ln in body.strip().split("\n"):
        m=re.match(r"- (\S+)\s+@(\S+)\s+\d+ ❤",ln.strip())
        if not m: continue
        p,u=m.group(1),m.group(2); used[p]=used.get(p,0)+1
        n=WISH.get(u) or (SECOND[p] if used[p]>1 and p in SECOND else NUM[p])
        if n in taken and u not in WISH: n=next(x for x in POOL if x not in taken)
        taken.add(n); s=SPOTS[p][slot.get(p,0)]; slot[p]=slot.get(p,0)+1
        xi.append({"spot":s,"pos":LABEL.get(s,p),"u":u,"n":n})
    subs=[m.group(1) for m in (re.match(r"@(\S+)",t.strip()) for t in zax.split(",")) if m]
    out.append({"club":club,"capt":capt,"xi":xi,"subs":subs})
os.makedirs(H+"/build",exist_ok=True)
json.dump(out,open(H+"/build/teams.json","w"),ensure_ascii=False,indent=1)
print(" | ".join(f"{t['club']}: {len(t['xi'])}+{len(t['subs'])}" for t in out))
