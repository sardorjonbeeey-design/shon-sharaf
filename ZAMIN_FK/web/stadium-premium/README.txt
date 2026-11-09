ZAMIN FK STADIUM — THREE.JS READY VIEWER

CONTENTS
- index.html: Three.js stadium viewer with orbit, walk mode, camera presets, and cinematic fly-through.
- zamin_fk_stadium.glb: the stadium GLB asset.

RUN
1. Keep both files in the same folder.
2. Open a terminal in this folder.
3. Run: python3 -m http.server 8000
4. Open: http://localhost:8000

You need an internet connection because Three.js modules are loaded from jsDelivr CDN.

CONTROLS
- Orbit: drag to rotate, scroll to zoom, right-drag to pan.
- Walk view: click Walk view, then click the 3D scene. WASD to move, mouse to look, Space/Shift to move vertically, Esc to release mouse.
- Aerial / Front / Pitch / Inside: preset viewpoints.
- Cinematic fly-through: automatic orbiting camera path.

NOTE
This viewer wraps the previously generated GLB. It adds camera controls and a cinematic camera path; it does not add new stadium geometry or turn the existing model into a detailed architectural reconstruction. The model's current geometry/material detail is limited by the source GLB.
