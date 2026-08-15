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
const illustrationPath = path.join(root, "public", "assets", "source-illustrations", "infant-growth-measures", "still-life-v1.png");
const outputDir = path.join(root, "public", "assets", "articles", "what-does-infant-growth-measure");
const outputPath = path.join(outputDir, "what-does-infant-growth-measure.png");
await mkdir(outputDir, { recursive: true });

const css = `
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/medium.otf") format("opentype"); font-weight: 400 600; }
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/bold.otf") format("opentype"); font-weight: 700 900; }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 100%; height: 100%; }
  body { overflow: hidden; color: #233d50; background: #f8f3e9; font-family: "Karada Yu Gothic", sans-serif; }
  .hero { position: relative; width: 1440px; height: 960px; padding: 66px 80px; background: radial-gradient(circle at 88% 12%, rgba(217,155,61,.17), transparent 31%), radial-gradient(circle at 10% 88%, rgba(77,127,104,.13), transparent 29%), linear-gradient(135deg, #fbf7ef, #edf3ee); }
  .hero::after { content: ""; position: absolute; inset: 28px; border: 1px solid rgba(35,61,80,.1); border-radius: 36px; }
  .brand { position: relative; z-index: 3; display: flex; align-items: center; gap: 14px; color: #001b41; font-size: 28px; font-weight: 800; letter-spacing: .06em; }
  .brand img { width: 48px; height: 48px; object-fit: contain; }
  .copy { position: relative; z-index: 3; width: 650px; margin-top: 112px; }
  .copy small { color: #bd624d; font-size: 27px; font-weight: 900; letter-spacing: .08em; }
  h1 { margin: 24px 0 0; font-size: 66px; line-height: 1.25; letter-spacing: -.045em; }
  .lead { margin-top: 26px; color: #50636a; font-size: 29px; line-height: 1.65; font-weight: 600; }
  .answer { display: inline-block; margin-top: 31px; padding: 18px 24px; border-radius: 18px; color: #fff; background: #bd624d; font-size: 25px; font-weight: 900; }
  .hero-visual { position: absolute; z-index: 2; right: 74px; top: 126px; width: 610px; }
  .scene { width: 100%; aspect-ratio: 1; border: 8px solid rgba(255,255,255,.9); border-radius: 38px; background: url("https://assets.local/illustration.png") center/cover; box-shadow: 0 18px 42px rgba(35,61,80,.16); }
  .source-note { position: absolute; z-index: 3; left: 80px; bottom: 66px; color: #60716b; font-size: 20px; font-weight: 700; }
`;

const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${css}</style></head><body><main class="hero">
  <div class="brand"><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ</div>
  <section class="copy"><small>研究でいう「成長」って？</small><h1>赤ちゃんの<br>「成長」は<br>身長だけ？</h1><p class="lead">体長・体重・頭囲を、<br>別々に測ります。</p><div class="answer">いまの大きさと、増え方も分けます。</div></section>
  <section class="hero-visual" aria-label="成長の測定を表す研究ノート、体重計、巻尺、定規の水彩画"><div class="scene"></div></section>
  <div class="source-note">「成長」は、一つの数字ではありません。</div>
</main></body></html>`;

const browser = await playwright.chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
await page.route("https://fontlibrary.local/medium.otf", (route) => route.fulfill({ path: mediumFont, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
await page.route("https://fontlibrary.local/bold.otf", (route) => route.fulfill({ path: boldFont, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
await page.route("https://assets.local/illustration.png", (route) => route.fulfill({ path: illustrationPath, contentType: "image/png", headers: { "access-control-allow-origin": "*" } }));
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
if (!await page.evaluate(() => document.fonts.check('32px "Karada Yu Gothic"'))) throw new Error("Yu Gothic font could not be loaded.");
await page.screenshot({ path: outputPath, type: "png" });
await page.close();
await browser.close();

console.log(`Rendered ${outputPath}`);
