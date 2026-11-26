import json,re,collections
RES="/root/.claude/projects/-workspace-shon-sharaf/d4e1fda2-a497-558d-8c82-76fbfa0eecdf/tool-results/mcp-task-result-1795672343306-trir7f.txt"
raw=open(RES).read(); d=json.loads(raw[raw.index('{"status"'):])["data"]
L=[x for x in d if x["media_id"]=="18120504563107392" and not x["comment_parent_id"] and x["comment_username"]!="fk_zamin"]
FOL={u.lower() for u in json.load(open("/tmp/claude-0/-workspace-shon-sharaf/d4e1fda2-a497-558d-8c82-76fbfa0eecdf/scratchpad/followers.json"))}
CLUBPAT=[("PRIME FC",r"prime\s*f|praym\s*f|preme\s*f"),("PRIME AVANGARD",r"avangard|avanggard|avanqard|avangrad"),
         ("WAKANDA TEAM",r"wakanda|vakanda"),("QAYRAT FC",r"qayrat|kayrat")]
POSPAT=[("GK",r"\bgk\b|darvozabon"),("CB",r"\bcb\b|himoya"),("LB",r"\blb\b"),("RB",r"\brb\b"),
        ("CM",r"\bcm\b|\bcdm\b|markaz"),("CAM",r"\bcam\b"),("LW",r"\blw\b"),("RW",r"\brw\b"),("ST",r"\bst\b|hujum")]
U={}
for x in L:
    u=x["comment_username"]; t=x["comment_text"] or ""; lk=x["comment_like_count"] or 0; tl=t.lower()
    club=next((n for n,p in CLUBPAT if re.search(p,tl)),None); pos=[n for n,p in POSPAT if re.search(p,tl)]
    r=U.setdefault(u,{"u":u,"likes":0,"club":None,"pos":[]})
    if lk>r["likes"]: r["likes"]=lk
    if club and not r["club"]: r["club"]=club
    for p in pos:
        if p not in r["pos"]: r["pos"].append(p)
CAPT={"PRIME AVANGARD":"rasuluvich_09","PRIME FC":"umaraliev.lll","WAKANDA TEAM":"3wx.hamrokulov","QAYRAT FC":"avazov_gk_07"}
ORDER=["PRIME AVANGARD","PRIME FC","WAKANDA TEAM","QAYRAT FC"]
SLOTS=["GK","RB","CB","CB","LB","CM","CM","RW","CAM","LW","ST"]; cap=collections.Counter(SLOTS)
FIXED=[("PRIME AVANGARD","rasuluvich_09","ST","kapitan"),("WAKANDA TEAM","3wx.hamrokulov","ST","kapitan"),
       ("QAYRAT FC","avazov_gk_07","ST","kapitan"),("PRIME FC","umaraliev.lll","RW","kapitan"),
       ("PRIME FC","golibjon.2ta","ST","egasi belgilagan"),("PRIME FC","zuhriddinyuldashev13","LW","egasi belgilagan")]
elig=[r for r in U.values() if r["u"].lower() in FOL]
noobuna=[r for r in U.values() if r["u"].lower() not in FOL]
team={c:{p:[] for p in cap} for c in CAPT}; bench={c:[] for c in CAPT}; taken=set(); full=[]
def put(c,u,p,why):
    if len(team[c][p])<cap[p]: team[c][p].append((u,why)); taken.add(u); return True
    return False
for c,u,p,w in FIXED: put(c,u,p,w)
filled=lambda c: sum(len(v) for v in team[c].values())
for r in sorted(elig,key=lambda y:-y["likes"]):
    if r["u"] in taken or not r["club"] or not r["pos"]: continue
    for p in r["pos"]:
        if put(r["club"],r["u"],p,"klub+pozitsiya"): break
for r in sorted(elig,key=lambda y:-y["likes"]):
    if r["u"] in taken or not r["pos"]: continue
    done=False
    for c in sorted(ORDER,key=lambda k:(filled(k),ORDER.index(k))):
        for p in r["pos"]:
            if put(c,r["u"],p,"pozitsiya"): done=True; break
        if done: break
    if not done: full.append(r)
nopos=[r for r in sorted(elig,key=lambda y:-y["likes"]) if r["u"] not in taken and not r["pos"]]
for c in ORDER:
    for p in SLOTS:
        while len(team[c][p])<cap[p] and nopos:
            r=nopos.pop(0); team[c][p].append((r["u"],"pozitsiya yozmagan")); taken.add(r["u"])
rest=full+nopos
for i,r in enumerate(rest):
    c=r["club"] or ORDER[i%4]; bench[c].append((r["u"],"/".join(r["pos"]) or "—",r["likes"])); taken.add(r["u"])
# Egasi keyin qo'shgan o'yinchilar: o'rni pozitsiya yozmagan muxlis turgan joydan olinadi,
# qolgan tarkibga tegilmaydi (oldin e'lon qilingan tarkib buzilmasin).
OVERRIDE=[("WAKANDA TEAM","LB","barca_1899._","egasi qo'shdi (CB so'ragan, CB o'rinlari to'lgan)"),
          ("QAYRAT FC","CM","alijonov.cls","egasi qo'shdi")]
for c,p_,u,why in OVERRIDE:
    slot=team[c][p_]
    idx=next((i for i,(_,w) in enumerate(slot) if "yozmagan" in w), len(slot)-1)
    outu,_=slot[idx]; slot[idx]=(u,why); taken.add(u)
    for cc in bench: bench[cc][:]=[b for b in bench[cc] if b[0]!=u]
    bench[c].append((outu,"—",U.get(outu,{"likes":0})["likes"]))

out=[]
for c in ORDER:
    out.append("## %s — asoschi/kapitan @%s"%(c,CAPT[c])); cnt=collections.Counter()
    for p in SLOTS:
        i=cnt[p]; cnt[p]+=1
        if i<len(team[c][p]):
            u,why=team[c][p][i]; out.append("- %-3s @%-24s %2d ❤  (%s)"%(p,u,U.get(u,{"likes":0})["likes"],why))
        else: out.append("- %-3s — BO‘SH"%p)
    out.append("  zaxira: "+(", ".join("@%s %s %d❤"%t for t in bench[c]) if bench[c] else "—")); out.append("")
out.append("Noyob izoh yozuvchi: %d · obuna: %d · obuna emas: %d · tarkibda: %d · zaxira: %d"%(
    len(U),len(elig),len(noobuna),sum(filled(c) for c in ORDER),sum(len(bench[c]) for c in ORDER)))
out.append("")
out.append("### Obuna bo‘lmagani uchun hisobga olinmadi (%d)"%len(noobuna))
out.append(", ".join("@%s %s %d❤"%(r["u"],"/".join(r["pos"]) or "—",r["likes"]) for r in sorted(noobuna,key=lambda y:-y["likes"])))
out.append("")
out.append("### Obuna, pozitsiya so‘ragan, lekin o‘rin to‘lgan")
out.append(", ".join("@%s(%s)"%(r["u"],"/".join(r["pos"])) for r in full) or "—")
txt="\n".join(out); print(txt)
open("/tmp/claude-0/-workspace-shon-sharaf/d4e1fda2-a497-558d-8c82-76fbfa0eecdf/scratchpad/teams3.txt","w").write(txt)
