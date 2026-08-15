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
const illustrationPath = path.join(root, "public", "assets", "source-illustrations", "what-is-a-nucleotide", "nucleotide-building-blocks-v1.png");
const outputDir = path.join(root, "public", "assets", "articles", "what-is-a-nucleotide");
const outputPath = path.join(outputDir, "what-is-a-nucleotide.png");
await mkdir(outputDir, { recursive: true });

const css = `
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/medium.otf") format("opentype"); font-weight: 400 600; }
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/bold.otf") format("opentype"); font-weight: 700 900; }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 100%; height: 100%; }
  body { overflow: hidden; color: #233d50; background: #f8f3e9; font-family: "Karada Yu Gothic", sans-serif; }
  .hero { position: relative; width: 1440px; height: 960px; padding: 66px 80px; background: #fbf7ef; }
  .hero::before { content: ""; position: absolute; inset: 0; background: url("https://assets.local/illustration.png") center/cover no-repeat; }
  .hero::after { content: ""; position: absolute; inset: 28px; border: 1px solid rgba(35,61,80,.1); border-radius: 36px; }
  .brand { position: relative; z-index: 3; display: flex; align-items: center; gap: 14px; color: #001b41; font-size: 28px; font-weight: 800; letter-spacing: .06em; }
  .brand img { width: 48px; height: 48px; object-fit: contain; }
  .copy { position: relative; z-index: 3; width: 610px; margin-top: 112px; }
  .copy small { color: #bd624d; font-size: 27px; font-weight: 900; letter-spacing: .08em; }
  h1 { margin: 24px 0 0; font-size: 66px; line-height: 1.25; letter-spacing: -.045em; }
  .lead { margin-top: 26px; color: #50636a; font-size: 29px; line-height: 1.65; font-weight: 600; }
  .answer { display: inline-block; margin-top: 31px; padding: 18px 24px; border-radius: 18px; color: #fff; background: #bd624d; font-size: 25px; font-weight: 900; }
  .source-note { position: absolute; z-index: 3; left: 80px; bottom: 66px; color: #60716b; font-size: 20px; font-weight: 700; }
`;

const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${css}</style></head><body><main class="hero">
  <div class="brand"><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ</div>
  <section class="copy"><small>核酸のことばを、ひとつずつ</small><h1>ヌクレオチドって、<br>そもそも何？</h1><p class="lead">DNAやRNAをつくる、<br>小さな部品です。</p><div class="answer">小さな部品 → つながると核酸</div></section>
  <div class="source-note">部品と、つながってできる全体を分けてみます。</div>
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
