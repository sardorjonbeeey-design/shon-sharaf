// Usage: node render_film.js build/anim.json build/film.json out_noaudio.mp4      (ONLY=t1,t2 -> build/frames/f_<t>.jpg stills)
// Each frame: the stadium page (film/stage.js + film/scene.js) draws the 3D shot, the unchanged tools/anim engine draws overlays + captions on top.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const { open, EPD, Z } = require('./film/stage.js');
const lerp = (a, b, p) => a + (b - a) * p, mix = (a, b, p) => a.map((v, i) => lerp(v, b[i], p));
const EASE = { lin: p => p, out: p => 1 - Math.pow(1 - p, 3), io: p => p * p * (3 - 2 * p) };
(async () => {
  const [epPath, filmPath, out] = process.argv.slice(2), fps = 30;
  const EP = JSON.parse(fs.readFileSync(epPath, 'utf8')), FILM = JSON.parse(fs.readFileSync(filmPath, 'utf8'));
  const st = await open({ time: FILM.time });
  await st.pg.waitForTimeout(4000);                                        // models and map finish loading
  await st.pg.addScriptTag({ path: path.join(EPD, 'film', 'scene.js') });
  await st.pg.evaluate(() => document.fonts.load('900 60px Montserrat'));
  const n22 = await st.pg.evaluate(r => window.__F.build(r), JSON.parse(fs.readFileSync(path.join(EPD, 'data', 'roster.json'))));
  if (n22 !== 22) throw new Error('roster not built: ' + n22);
  await st.pg.evaluate(s => window.__F.screen(...s), FILM.screen);
  for (let k = -60; k < 0; k++) await st.pg.evaluate(t => window.__film.step(t), k * 1000 / fps);     // pre-roll: town traffic and walkers settle
  await st.pg.evaluate(() => window.__film.ev('scene.children.filter(o => o.isGroup && o.children.length === 1 && o.position.lengthSq() < 1).forEach(o => { o.visible = false; })'));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(Z, 'tools', 'anim', 'engine.html'));
  await page.evaluate(ep => { window.EP = ep; }, EP);
  await page.evaluate(() => window.ready());

  const only = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null;
  let ff = null;
  if (!only) ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  else fs.mkdirSync(path.join(EPD, 'build', 'frames'), { recursive: true });
  const n = Math.round(EP.total * fps);
  for (let f = 0; f < n; f++) {
    const t = f / fps;
    if (only && !only.some(s => Math.abs(s - t) < 0.5 / fps)) continue;
    const sh = FILM.shots.find(s => t >= s.from && t < s.to) || FILM.shots[FILM.shots.length - 1];
    const p = EASE[sh.ease || 'io'](Math.min(1, Math.max(0, (t - sh.from) / (sh.to - sh.from))));
    const spec = { t, layout: sh.layout, focus: sh.focus ?? null, ft: t - sh.from, players: sh.players !== false,
      cam: mix(sh.cam[0], sh.cam[1], p), tgt: mix(sh.tgt[0], sh.tgt[1], p), fov: lerp(sh.fov[0], sh.fov[1], p) };
    const url = await st.pg.evaluate(s => window.__F.frame(s), spec);
    await page.evaluate(async ({ t, url }) => {
      const i = EP.scenes.findIndex(sc => t >= sc.from && t < sc.to);
      window.renderAt(t);
      const img = E.cache['bg' + i]; img.src = url; await img.decode();
    }, { t, url });
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (only) fs.writeFileSync(path.join(EPD, 'build', 'frames', `f_${t.toFixed(2)}.jpg`), buf);
    else { if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if (f % 150 === 0) process.stderr.write(`frame ${f}/${n}\n`); }
  }
  if (ff) { ff.stdin.end(); await new Promise(r => ff.on('close', r)); }
  await browser.close(); await st.close();
})().catch(e => { console.error(e); process.exit(1); });
