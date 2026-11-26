# python3 make_cards.py -> 0X_<CLUB>.txt (nomer + pozitsiya kodi + username)
import re
src=open("TARKIB.md",encoding="utf-8").read()
blocks=re.findall(r"## (.+?) — asoschi/kapitan @(\S+)\n(.*?)\n  zaxira: (.*?)\n",src,re.S)
FN={"PRIME AVANGARD":"01_PRIME_AVANGARD.txt","PRIME FC":"02_PRIME_FC.txt",
    "WAKANDA TEAM":"03_WAKANDA_TEAM.txt","QAYRAT FC":"04_QAYRAT_FC.txt"}
NUM={"GK":1,"LB":3,"RB":2,"CB":4,"CM":6,"RW":7,"CAM":10,"LW":11,"ST":9}
SECOND={"CB":5,"CM":8}
WISH={"islom.muhammadov7":51,"rasuluvich_09":8}
POOL=[14,15,16,17,18,19,20,21,22,23]
for club,capt,body,zax in blocks:
    used={}; taken=set(WISH[u] for u in WISH if ('@'+u) in body); out=["🏆 MUXLISLAR KUBOGI — TARKIB","","🔵 %s"%club,"Asoschi / kapitan: @%s"%capt,""]
    for ln in body.strip().split("\n"):
        m=re.match(r"- (\S+)\s+@(\S+)\s+\d+ ❤",ln.strip())
        if not m: continue
        p,u=m.group(1),m.group(2); used[p]=used.get(p,0)+1
        n=WISH.get(u) or (SECOND[p] if used[p]>1 and p in SECOND else NUM[p])
        if n in taken and u not in WISH: n=next(x for x in POOL if x not in taken)
        taken.add(n)
        out.append("%2d  %-3s  @%s%s"%(n,p,u," (C)" if u==capt else ""))
    out+=["","Zaxira: "+zax.strip()]
    open(FN[club],"w",encoding="utf-8").write("\n".join(out)+"\n"); print(FN[club])
