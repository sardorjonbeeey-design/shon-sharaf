"""Build the single-file stadium page: template + fans list + hero sprites (data URIs).
Usage: python3 build.py [fans.json] [--demo N]
fans.json: ["nick1", "nick2", ...] in follow order (earliest first)."""
import base64, io, json, os, random, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
Z = os.path.dirname(os.path.dirname(HERE))
SPR = os.path.join(Z, "01_Art_Direction", "Sprites")

def data_uri(path, h=320):
    im = Image.open(path).convert("RGBA")
    im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "WEBP", quality=82)
    return "data:image/webp;base64," + base64.b64encode(b.getvalue()).decode()

args = sys.argv[1:]
demo = "--demo" in args
if demo:
    n = int(args[args.index("--demo") + 1])
    rnd = random.Random(42)
    a = ["ali", "dilnoza", "sardor", "bekzod", "malika", "jasur", "umid", "nilufar", "otabek", "shahzod", "kamola", "rustam", "aziza", "farrux", "laylo", "doniyor", "zuhra", "javohir", "madina", "sherzod", "gulnoza", "akmal", "sevara", "bobur"]
    b = ["", "_", ".", "_uz", "07", "10", "_fc", ".k", "99", "_zfk", "_official", "2024"]
    fans, seen = [], set()
    while len(fans) < n:
        nick = rnd.choice(a) + rnd.choice(b) + (str(rnd.randint(1, 999)) if rnd.random() < .5 else "")
        if nick not in seen: seen.add(nick); fans.append(nick)
else:
    fans = json.load(open(args[0]))

heroes = [
    {"key": "rustam", "name": "Rustam aka", "img": data_uri(os.path.join(SPR, "rustam_whistle.png")), "x": -6, "z": 30, "h": 3.2,
     "role": {"uz": "Bosh murabbiy. Har bir mashg‘ulot — kubok finali.", "ru": "Главный тренер. Каждая тренировка — финал кубка.", "en": "Head coach. Every training is a cup final."}},
    {"key": "bekzod", "name": "Bekzod", "img": data_uri(os.path.join(SPR, "bekzod_celebrate.png")), "x": 8, "z": 6, "h": 3.1,
     "role": {"uz": "Hujumchi. Gol urishdan oldin bayram qiladi.", "ru": "Нападающий. Празднует до гола.", "en": "Striker. Celebrates before he scores."}},
    {"key": "jasur", "name": "Jasur", "img": data_uri(os.path.join(SPR, "jasur_oneglove.png")), "x": -49, "z": 0, "h": 3.3,
     "role": {"uz": "Darvozabon. Har doim bahonasi tayyor.", "ru": "Вратарь. Оправдание всегда наготове.", "en": "Goalkeeper. Always has an excuse ready."}},
    {"key": "aziz", "name": "Aziz", "img": data_uri(os.path.join(SPR, "aziz_ball.png")), "x": -2, "z": -4, "h": 3.0,
     "role": {"uz": "Yarim himoyachi. Atrofda xaos — u jiddiy.", "ru": "Полузащитник. Вокруг хаос — он серьёзен.", "en": "Midfielder. Chaos all around — he stays serious."}},
    {"key": "echki", "name": "Echki", "img": data_uri(os.path.join(SPR, "goat_side.png")), "x": 46, "z": -26, "h": 1.6,
     "role": {"uz": "Stadionning eng sodiq muxlisi. Ismini siz tanlaysiz!", "ru": "Самый верный болельщик стадиона. Имя выберете вы!", "en": "The stadium’s most loyal fan. You pick its name!"}},
]
vip = ["legends00000001"]
screen = [
    {"title": "ENG FAOL MUXLIS ⭐", "big": "@legends00000001", "small": "VIP o‘rindiq • Rahmat!"},
    {"title": "KUN IZOHI", "big": "@kewl.imjay45", "small": "“Stadion” ❤"},
    {"title": "STADION TA’MIRLANDI", "big": "20 000 000 so‘m", "small": "Qoratepa sport jamg‘armasi"},
    {"title": "MUXLISLAR", "big": f"{len(fans)} ta", "small": "1 obunachi = 1 o‘rindiq"},
]
# City backend (Telegram Mini App + Neon). The page reads live seats/homes from it.
API_ORIGIN = os.environ.get("ZFK_API", "https://zaminfk-city.onrender.com")
# Real town (OpenStreetMap) shipped next to the page: dist/map/<file>
MAP = os.environ.get("ZFK_MAP", "kattaqorgon.json")
if MAP:
    import shutil
    os.makedirs(os.path.join(HERE, "dist", "map"), exist_ok=True)
    shutil.copy(os.path.join(HERE, "map", MAP), os.path.join(HERE, "dist", "map", MAP))
crest = data_uri(os.path.join(Z, "03_Approved_Assets", "ZFK_CREST_MASTER_V01_P_2048.png"), 96)
html = open(os.path.join(HERE, "template.html")).read()
html = (html.replace("__FANS__", json.dumps(fans, ensure_ascii=False)).replace("__HEROES__", json.dumps(heroes, ensure_ascii=False))
        .replace("__DEMO__", "true" if demo else "false").replace("__VIP__", json.dumps(vip)).replace("__SCREEN__", json.dumps(screen, ensure_ascii=False)).replace("__CREST__", crest).replace("__API__", json.dumps(API_ORIGIN)).replace("__MAP__", json.dumps("map/" + MAP if MAP else "")))
os.makedirs(os.path.join(HERE, "dist"), exist_ok=True)
import shutil as _sh                                          # 3D models (Kenney CC0) + GLTF loader go next to the page
for d in ("models", "vendor"):
    if os.path.isdir(os.path.join(HERE, d)): _sh.copytree(os.path.join(HERE, d), os.path.join(HERE, "dist", d), dirs_exist_ok=True)
out = os.path.join(HERE, "dist", "index.html")
open(out, "w").write(html)
print(out, len(fans), "fans", round(len(html) / 1024), "KB")
