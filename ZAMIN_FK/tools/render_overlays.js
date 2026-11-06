// Render each overlay HTML snippet into a transparent 1080x1920 PNG.
// Usage: node render_overlays.js <overlays.html> <ov.json> <episode_dir>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const [tpl, list, epDir] = process.argv.slice(2);
  const specs = JSON.parse(fs.readFileSync(list, 'utf8'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.resolve(tpl));
  await page.evaluate(() => document.fonts.ready);
  for (const s of specs) {
    // {ep} lets snippets point at episode-relative files (e.g. the crest)
    const html = s.html.replaceAll('{ep}', 'file://' + path.resolve(epDir));
    await page.evaluate(h => { document.getElementById('root').innerHTML = h; }, html);
    await page.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
    await page.screenshot({ path: s.png, omitBackground: true });
  }
  await browser.close();
})();
