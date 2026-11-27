// Screenshots every chapel against a running `vite preview` (or `vercel dev`).
// usage: node scripts/shots.mjs <outDir> [viewports=desktop,mobile] [baseUrl]
import fs from 'fs';
import path from 'path';
import { chromium, devices } from 'playwright';

const outDir = process.argv[2] || 'shots';
const wanted = (process.argv[3] || 'desktop,mobile').split(',');
const baseUrl = process.argv[4] || 'http://localhost:4173';

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  '1080p': { viewport: { width: 1920, height: 1080 } },
  '1440p': { viewport: { width: 2560, height: 1440 } },
  '4k': { viewport: { width: 3840, height: 2160 } },
  mobile: { ...devices['iPhone 13'], defaultBrowserType: undefined },
};

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

for (const name of wanted) {
  const ctx = await browser.newContext(VIEWPORTS[name]);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log(`[${name}] pageerror: ${e.message}`));
  await page.goto(`${baseUrl}/?skipBoot=1`);
  await page.waitForSelector('.chapel-anchor');
  await page.waitForTimeout(2500);
  const ids = await page.$$eval('.chapel-anchor', (els) => els.map((el) => el.id.replace('chapel-', '')));
  for (let i = 0; i < ids.length; i++) {
    // the nav lands exactly on each chapel's first camera stop
    await page.locator('.min-hud-num').nth(i).click();
    await page.waitForTimeout(4000);
    const file = path.join(outDir, `${name}-${String(i + 1).padStart(2, '0')}-${ids[i]}.png`);
    await page.screenshot({ path: file, timeout: 90000 });
    console.log(file);
  }
  await ctx.close();
}
await browser.close();
