// Runs inside the stadium page (see stage.js). Places the real roster with the site's own player model
// (makeSquadPlayer) and prints each player's name + shirt number on the back. window.__F.frame(spec) draws one frame.
window.__F = (() => {
  const T = THREE;
  const A = window.__film.ev('({ scene, camera, controls, makeSquadPlayer, heroObjs, ball, SCREEN_SLIDES, drawScreen, POS_SPOT, canvas })');
  A.heroObjs.forEach(o => A.scene.remove(o)); A.scene.remove(A.ball);          // story sprites are not part of the real squad
  A.controls.maxPolarAngle = Math.PI; A.controls.minDistance = 0.05; A.controls.enableDamping = false;
  const players = [];

  function backTexture(p) {
    const W = 448, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
    const ink = (txt, y, px, stroke) => { x.font = `900 ${px}px Montserrat, sans-serif`; x.lineWidth = stroke; x.strokeStyle = '#0D2557'; x.strokeText(txt, W / 2, y); x.fillStyle = '#fff'; x.fillText(txt, W / 2, y); };
    const fit = (txt, max, cap) => { let px = cap; x.font = `900 ${px}px Montserrat, sans-serif`; const w = x.measureText(txt).width; if (w > max) px = Math.floor(px * max / w); return px; };
    let lines = [p.shirt];
    if (p.shirt.length > 12 && p.shirt.includes(' ')) {                         // long names: two lines, split at the space nearest the middle
      const sp = [...p.shirt].map((ch, i) => ch === ' ' ? i : -1).filter(i => i > 0).sort((a, b) => Math.abs(a - p.shirt.length / 2) - Math.abs(b - p.shirt.length / 2))[0];
      lines = [p.shirt.slice(0, sp), p.shirt.slice(sp + 1)];
    }
    const px = Math.min(...lines.map(l => fit(l, 318, lines.length > 1 ? 50 : 60)));
    if (lines.length > 1) { ink(lines[0], 62, px, 9); ink(lines[1], 62 + px * 1.08, px, 9); } else ink(lines[0], 92, px, 10);
    const num = String(p.number); ink(num, 322, num.length > 1 ? 270 : 290, 16);
    const t = new T.CanvasTexture(c); t.anisotropy = 8; return t;
  }

  function build(roster) {
    roster.forEach((p, i) => {
      const s = A.makeSquadPlayer({ kind: 'player', position: p.position, squad_role: 'starter', position_rank: 1 }, i);
      const print = new T.Mesh(new T.CylinderGeometry(.332, .292, .9, 32, 1, true, Math.PI - 1.25, 2.5),
        new T.MeshBasicMaterial({ map: backTexture(p), transparent: true, depthWrite: false, color: 0xf4f6fb }));
      print.position.y = 1.25; print.renderOrder = 5; s.g.add(print);
      const shade = new T.Mesh(new T.CircleGeometry(.5, 20), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .28, depthWrite: false }));
      shade.rotation.x = -Math.PI / 2; shade.position.y = .03; s.g.add(shade);
      players.push({ p, g: s.g, lL: s.lL, lR: s.lR, shade, cb: 0 });
    });
    let cb = 0, sub = 0;
    players.forEach(q => { if (q.p.role === 'starter' && q.p.position === 'CB') q.cb = ++cb; if (q.p.role !== 'starter') q.sub = sub++; });
    return players.length;
  }

  // where everyone stands: [x, z, facing] per layout. Players always turn their backs to the camera side.
  function spot(q, i, layout) {
    const st = q.p.role === 'starter';
    if (layout === 'line') return [(i - 10.5) * 2.5, 8, Math.PI];                                   // one line across the pitch, facing the main stand
    if (layout === 'team') return st ? [(i - 5) * 3.1, 3, Math.PI] : [(q.sub - 5) * 3.1 + 1.55, 8.5, Math.PI];
    // 'form': starters in the site's 4-3-3 spots, substitutes along the touchline
    if (!st) return [(q.sub - 5) * 5.4, 29.5, Math.PI];
    const s = q.p.position === 'CB' ? [31, q.cb === 2 ? 7 : -7] : (A.POS_SPOT[q.p.position] || [0, 0]);
    return [s[0], s[1], -Math.PI / 2];
  }
  function info(layout) { return players.map((q, i) => { const [x, z, r] = spot(q, i, layout); return { order: q.p.order, x, z, r }; }); }

  function screen(title, big, small) { A.SCREEN_SLIDES.length = 0; A.SCREEN_SLIDES.push({ title, big, small }); A.drawScreen(0); }

  function frame(f) {
    players.forEach((q, i) => {
      const [x, z, r] = spot(q, i, f.layout || 'form');
      const ph = i * 1.7, focus = f.focus === q.p.order;
      let y = Math.abs(Math.sin(f.t * 2.2 + ph)) * .05;                                              // light idle bounce
      if (focus && f.ft != null && f.ft < .32) y += Math.sin(f.ft / .32 * Math.PI) * .32;             // hop on the reveal cut
      q.g.visible = f.players !== false; q.g.position.set(x, y, z); q.g.rotation.y = r + (focus ? Math.sin(f.t * 1.3) * .06 : 0);
      const sw = Math.sin(f.t * 3 + ph) * .12; q.lL.rotation.x = sw; q.lR.rotation.x = -sw;
      q.shade.position.y = .03 - y / 1.6;
    });
    A.camera.position.set(...f.cam); A.controls.target.set(...f.tgt);
    if (A.camera.fov !== f.fov) { A.camera.fov = f.fov || 50; A.camera.updateProjectionMatrix(); }
    window.__film.step(f.t * 1000);
    return f.still ? null : A.canvas.toDataURL('image/jpeg', .93);
  }
  return { build, frame, info, screen };
})();
