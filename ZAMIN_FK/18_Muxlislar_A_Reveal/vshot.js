const {chromium} = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    recordVideo: {
      dir: __dirname + '/',
      size: { width: 1080, height: 1920 }
    }
  });
  const page = await context.newPage();
  await page.goto('file://' + __dirname + '/reel.html');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  console.log('Recording...');
  await page.waitForTimeout(54000); // full 54s
  console.log('Done. Closing...');
  await context.close();
  await browser.close();
  console.log('Video saved.');
})();
