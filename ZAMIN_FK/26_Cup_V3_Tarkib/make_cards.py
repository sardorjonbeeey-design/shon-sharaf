import re,os
src=open("TARKIB.md",encoding="utf-8").read()
blocks=re.findall(r"## (.+?) — asoschi/kapitan @(\S+)\n(.*?)\n  zaxira: (.*?)\n",src,re.S)
FN={"PRIME AVANGARD":"01_PRIME_AVANGARD.txt","PRIME FC":"02_PRIME_FC.txt","WAKANDA TEAM":"03_WAKANDA_TEAM.txt","QAYRAT FC":"04_QAYRAT_FC.txt"}
UZ={"GK":"darvozabon","RB":"o‘ng himoyachi","CB":"markaziy himoyachi","LB":"chap himoyachi",
    "CM":"markaz","RW":"o‘ng qanot","CAM":"hujumchi markaz","LW":"chap qanot","ST":"hujumchi"}
for name,capt,body,zax in blocks:
    rows=[]
    for ln in body.strip().split("\n"):
        m=re.match(r"- (\S+)\s+@(\S+)\s+(\d+) ❤\s+\((.+)\)",ln.strip())
        if m: rows.append(m.groups())
    out=["🏆 MUXLISLAR KUBOGI — TARKIB","","🔵 %s"%name,"Asoschi / kapitan: @%s"%capt,""]
    for pos,u,lk,why in rows:
        tag=" (kapitan)" if u==capt else ""
        out.append("%-3s  %-18s  @%s%s"%(pos,UZ[pos],u,tag))
    out+=["","Zaxira: "+zax.strip()]
    open(FN[name],"w",encoding="utf-8").write("\n".join(out)+"\n")
    print(FN[name])
