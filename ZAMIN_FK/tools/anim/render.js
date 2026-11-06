// Usage: node render.js <ep.json> <out_video_noaudio.mp4> [fps]
// Steps the engine frame by frame and pipes JPEG frames into ffmpeg.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
(async () => {
  const [epPath, out, fpsArg] = process.argv.slice(2);
  const fps = +(fpsArg || 30);
  const EP = JSON.parse(fs.readFileSync(epPath, 'utf8'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(__dirname, 'engine.html'));
  await page.evaluate(ep => { window.EP = ep; }, EP);
  await page.evaluate(() => window.ready());
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(EP.total * fps);
  const only = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null;
  for (let f = 0; f < n; f++) {
    const t = f / fps;
    if (only && !only.some(s => Math.abs(s - t) < 0.5 / fps)) continue;
    await page.evaluate(t => window.renderAt(t), t);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 150 === 0) process.stderr.write(`frame ${f}/${n}\n`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
})();
