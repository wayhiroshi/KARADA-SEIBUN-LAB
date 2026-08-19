import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const fontLibrary = "/Users/yoshiaki/Library/Mobile Documents/com~apple~CloudDocs/FontLibrary/SystemFont";
const mediumFont = path.join(fontLibrary, "Yu Gothic Medium.otf");
const boldFont = path.join(fontLibrary, "Yu Gothic Bold.otf");

let playwright;
try {
  playwright = await import("playwright");
} catch {
  if (!process.env.CODEX_WORKSPACE_NODE_MODULES) throw new Error("Playwright is required.");
  playwright = await import(pathToFileURL(path.join(process.env.CODEX_WORKSPACE_NODE_MODULES, "playwright", "index.mjs")).href);
}

const brandMark = (await readFile(path.join(root, "public", "assets", "brand", "karada-seibun-lab-mark.svg"))).toString("base64");
const heroSource = path.join(root, "public", "assets", "source-illustrations", "do-supplements-really-help", "dining-table-support-v1.png");
const outputDir = path.join(root, "public", "assets", "articles", "do-supplements-really-help");
await mkdir(outputDir, { recursive: true });

const fontCss = `
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/medium.otf") format("opentype"); font-weight: 400 600; }
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/bold.otf") format("opentype"); font-weight: 700 900; }
`;

const heroHtml = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>
  ${fontCss}
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1440px; height: 960px; }
  body { overflow: hidden; color: #233d50; background: #fbf7ef; font-family: "Karada Yu Gothic", sans-serif; }
  .hero { position: relative; width: 1440px; height: 960px; padding: 66px 80px; background: url("https://assets.local/hero.png") center/cover no-repeat; }
  .hero::before { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(251,247,239,.995) 0%, rgba(251,247,239,.95) 39%, rgba(251,247,239,.26) 68%, rgba(251,247,239,0) 100%); }
  .hero::after { content: ""; position: absolute; inset: 28px; border: 1px solid rgba(35,61,80,.1); border-radius: 36px; }
  .brand { position: relative; z-index: 2; display: flex; align-items: center; gap: 14px; color: #001b41; font-size: 28px; font-weight: 800; letter-spacing: .06em; }
  .brand img { width: 48px; height: 48px; object-fit: contain; }
  .copy { position: relative; z-index: 2; width: 690px; margin-top: 91px; }
  .copy small { color: #a95543; font-size: 27px; font-weight: 900; letter-spacing: .08em; }
  h1 { margin: 24px 0 0; color: #263d34; font-size: 66px; line-height: 1.25; letter-spacing: -.05em; }
  .lead { margin: 28px 0 0; color: #53645d; font-size: 29px; line-height: 1.62; font-weight: 600; }
  .answer { display: inline-block; margin-top: 31px; padding: 18px 24px; border-radius: 18px; color: #fff; background: #b8614e; font-size: 25px; font-weight: 900; box-shadow: 0 12px 28px rgba(112,69,53,.13); }
  .note { position: absolute; z-index: 2; left: 80px; bottom: 66px; color: #60716b; font-size: 20px; font-weight: 700; letter-spacing: .03em; }
</style></head><body><main class="hero">
  <div class="brand"><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ</div>
  <section class="copy"><small>サプリと栄養を考える</small><h1>サプリって、<br>本当に意味あるの？</h1><p class="lead">食事を中心に、<br>足りないところを助けてもらう。</p><div class="answer">補いたい栄養を支える道具。</div></section>
  <div class="note">たくさん食べるか、我慢するかの二択にしない。</div>
</main></body></html>`;

const browser = await playwright.chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
await page.route("https://fontlibrary.local/medium.otf", (route) => route.fulfill({ path: mediumFont, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
await page.route("https://fontlibrary.local/bold.otf", (route) => route.fulfill({ path: boldFont, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
await page.route("https://assets.local/hero.png", (route) => route.fulfill({ path: heroSource, contentType: "image/png", headers: { "access-control-allow-origin": "*" } }));
await page.setContent(heroHtml, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
if (!await page.evaluate(() => document.fonts.check('32px "Karada Yu Gothic"'))) throw new Error("Yu Gothic font could not be loaded.");
await page.screenshot({ path: path.join(outputDir, "do-supplements-really-help.png"), type: "png" });
await page.close();
await browser.close();
console.log("Rendered do-supplements-really-help article hero.");
