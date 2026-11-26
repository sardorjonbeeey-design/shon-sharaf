import json,re,collections
RES="/root/.claude/projects/-workspace-shon-sharaf/d4e1fda2-a497-558d-8c82-76fbfa0eecdf/tool-results/mcp-task-result-1795672343306-trir7f.txt"
raw=open(RES).read(); d=json.loads(raw[raw.index('{"status"'):])["data"]
L=[x for x in d if x["media_id"]=="18120504563107392" and not x["comment_parent_id"] and x["comment_username"]!="fk_zamin"]
known=set(json.load(open("web/stadium/fans_instagram.json.disabled")))
CLUBPAT=[("PRIME FC",r"prime\s*f|praym\s*f|preme\s*f"),("PRIME AVANGARD",r"avangard|avanggard|avanqard|avangrad"),
         ("WAKANDA TEAM",r"wakanda|vakanda"),("QAYRAT FC",r"qayrat|kayrat")]
POSPAT=[("GK",r"\bgk\b|darvozabon"),("CB",r"\bcb\b|himoya"),("LB",r"\blb\b"),("RB",r"\brb\b"),
        ("CM",r"\bcm\b|\bcdm\b|markaz"),("CAM",r"\bcam\b"),("LW",r"\blw\b"),("RW",r"\brw\b"),("ST",r"\bst\b|hujum")]
U={}
for x in L:
    u=x["comment_username"]; t=x["comment_text"] or ""; lk=x["comment_like_count"] or 0; tl=t.lower()
    club=next((n for n,p in CLUBPAT if re.search(p,tl)),None)
    pos=[n for n,p in POSPAT if re.search(p,tl)]
    r=U.setdefault(u,{"u":u,"likes":0,"club":None,"pos":[],"text":""})
    if lk>=r["likes"]: r["likes"]=lk; r["text"]=t
    if club and not r["club"]: r["club"]=club
    for p in pos:
        if p not in r["pos"]: r["pos"].append(p)
CAPT={"PRIME AVANGARD":"rasuluvich_09","PRIME FC":"umaraliev.lll","WAKANDA TEAM":"3wx.hamrokulov","QAYRAT FC":"avazov_gk_07"}
ORDER=["PRIME AVANGARD","PRIME FC","WAKANDA TEAM","QAYRAT FC"]
SLOTS=["GK","RB","CB","CB","LB","CM","CM","RW","CAM","LW","ST"]
cap=collections.Counter(SLOTS)
team={c:{p:[] for p in cap} for c in CAPT}; bench={c:[] for c in CAPT}; taken=set(); unplaced=[]
def put(c,u,p,why):
    if len(team[c][p])<cap[p]: team[c][p].append((u,p,why)); taken.add(u); return True
    return False
for c,u in (("PRIME AVANGARD","rasuluvich_09"),("WAKANDA TEAM","3wx.hamrokulov"),("QAYRAT FC","avazov_gk_07")): put(c,u,"ST","kapitan")
put("PRIME FC","umaraliev.lll","RW","kapitan"); put("PRIME FC","golibjon.2ta","ST","egasi belgilagan"); put("PRIME FC","zuhriddinyuldashev13","LW","egasi belgilagan")
filled=lambda c: sum(len(v) for v in team[c].values())
# pass A: club named + position
for r in sorted(U.values(),key=lambda y:-y["likes"]):
    if r["u"] in taken or not r["club"] or not r["pos"]: continue
    for p in r["pos"]:
        if put(r["club"],r["u"],p,"klub+pozitsiya"): break
# pass B: position only -> emptiest club that still has that slot
for r in sorted(U.values(),key=lambda y:-y["likes"]):
    if r["u"] in taken or not r["pos"]: continue
    done=False
    for c in sorted(ORDER,key=lambda k:(filled(k),ORDER.index(k))):
        if r["club"] and r["club"]!=c and not done:  # club wish first handled below
            pass
        for p in r["pos"]:
            if put(c,r["u"],p,"pozitsiya"): done=True; break
        if done: break
    if not done: unplaced.append(r)
# pass C: fill leftover slots from users with no position stated
nopos=[r for r in sorted(U.values(),key=lambda y:-y["likes"]) if r["u"] not in taken and not r["pos"]]
for c in ORDER:
    for p in SLOTS:
        while len(team[c][p])<cap[p] and nopos:
            r=nopos.pop(0); team[c][p].append((r["u"],p,"pozitsiya yozmagan — murabbiy qo‘ydi")); taken.add(r["u"])
# bench: unplaced position-requesters first, then the rest, round-robin
rest=[r for r in unplaced]+nopos+[r for r in sorted(U.values(),key=lambda y:-y["likes"]) if r["u"] not in taken and r not in unplaced and r not in nopos]
seen=set()
for i,r in enumerate([x for x in rest if not (x["u"] in seen or seen.add(x["u"]))]):
    c=r["club"] if r["club"] else ORDER[i%4]
    bench[c].append((r["u"],"/".join(r["pos"]) or "—",r["likes"])); taken.add(r["u"])
lines=[]
for c in ORDER:
    lines.append("## %s — asoschi/kapitan @%s"%(c,CAPT[c]))
    for p in SLOTS:
        pass
    shown=collections.Counter()
    for p in SLOTS:
        i=shown[p]; shown[p]+=1
        if i<len(team[c][p]):
            u,_,why=team[c][p][i]; lk=U.get(u,{"likes":0})["likes"]
            lines.append("- %-3s @%-24s %2d ❤  (%s)"%(p,u,lk,why))
        else: lines.append("- %-3s — BO‘SH"%p)
    lines.append("  zaxira: "+(", ".join("@%s %s %d❤"%(u,pp,lk) for u,pp,lk in bench[c]) if bench[c] else "—"))
    lines.append("")
lines.append("Jami izoh yozgan noyob foydalanuvchi: %d · tarkibga: %d · zaxira: %d"%(len(U),sum(filled(c) for c in ORDER),sum(len(bench[c]) for c in ORDER)))
lines.append("Pozitsiya so‘ragan, lekin o‘rin to‘lgan: "+(", ".join("@%s(%s)"%(r["u"],"/".join(r["pos"])) for r in unplaced) or "—"))
lines.append("Obunasi ro‘yxatdan tasdiqlangan (eski 665 lik ro‘yxat): "+", ".join("@"+u for u in sorted(U) if u in known))
txt="\n".join(lines); print(txt)
open("/tmp/claude-0/-workspace-shon-sharaf/d4e1fda2-a497-558d-8c82-76fbfa0eecdf/scratchpad/teams2.txt","w").write(txt)
