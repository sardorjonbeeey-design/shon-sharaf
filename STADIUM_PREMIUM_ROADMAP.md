# ZAMIN FK Stadium Premium — Development Roadmap

## 🚀 Status: ISOLATED FEATURE BRANCH
**Branch:** `feature/stadium-premium`  
**Main Code:** `claude/new-session-aniok6` (untouched)

## 📊 Vision
Transform stadium view into a premium, interactive 3D experience:
- High-quality stadium model with professional lighting
- Animated fans with usernames (clickable profiles)
- Player models training/playing on pitch
- Real-time crowd interactions
- Social integration (join, create profile)

---

## Phase 1: Stadium Base ✅ COMPLETE
- [x] High-quality stadium GLB model (150KB)
- [x] Professional Three.js viewer
- [x] Multiple camera presets (Aerial, Front, Pitch, Inside)
- [x] Cinematic fly-through
- [x] Orbit + walk-through controls
- [x] Lighting setup (hemisphere, key, fill)

**Current Location:** `/ZAMIN_FK/web/stadium-premium/`

---

## Phase 2: Fan Integration (NEXT)
**Goal:** Add fans from backup data with usernames

- [ ] Load 129 fans from existing data (fans_instagram.json)
- [ ] Replace simple geometry with high-quality 3D models
- [ ] Display usernames with styling
- [ ] Position fans in stadium seats (reuse seat coordinates)
- [ ] Add basic animations (idle, wave, celebrate)

**Testing:** Open `/stadium-premium/index.html` locally
```bash
cd ZAMIN_FK/web/stadium-premium
python3 -m http.server 8000
# Open http://localhost:8000
```

---

## Phase 3: Player Integration
**Goal:** Add team/players training on pitch

- [ ] Load/create player models
- [ ] Position on pitch
- [ ] Add training drill animations
- [ ] Ball physics/movement
- [ ] Synchronized crowd reactions

---

## Phase 4: Interactivity
**Goal:** Make fans/players clickable

- [ ] Click fan → Show profile card
- [ ] New user → Create profile from stadium
- [ ] Click player → Show player details
- [ ] Crowd effects on events

---

## Phase 5: Polish & Performance
**Goal:** Optimize for production

- [ ] LOD (Level of Detail) system
- [ ] Instanced rendering for duplicate fans
- [ ] Asset culling/streaming
- [ ] Memory optimization
- [ ] Mobile performance testing

---

## 📋 Testing Checklist

### Before Each Phase Commit:
- [ ] Model loads without errors
- [ ] No console warnings/errors
- [ ] All camera presets work
- [ ] Performance acceptable (60 FPS)
- [ ] Desktop & mobile responsive
- [ ] Controls intuitive & responsive

### Before Merge to Main:
- [ ] All phases complete & tested
- [ ] No regression in current features
- [ ] Database integration verified
- [ ] User profile integration working
- [ ] Performance benchmarks passed

---

## 🔄 Merge Strategy

**When to merge to main:**
1. All phases complete
2. Full testing passed
3. No data loss or conflicts
4. Side-by-side comparison approved

**Command:**
```bash
git checkout claude/new-session-aniok6
git merge feature/stadium-premium
```

---

## 📁 Files Structure

```
ZAMIN_FK/web/
├── stadium/                    (original - UNTOUCHED)
│   ├── template.html
│   ├── dist/
│   └── models/
│
└── stadium-premium/            (NEW - FEATURE BRANCH)
    ├── index.html              (Three.js viewer)
    ├── zamin_fk_stadium.glb    (3D model)
    └── development files...
```

---

## Next Steps
1. Test current stadium viewer locally
2. Plan fan model integration
3. Start Phase 2 development

**Keep isolated until satisfied → Then merge to main! ✅**
