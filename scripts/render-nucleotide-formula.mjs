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

const data = JSON.parse(await readFile(path.join(root, "content", "social", "nucleotide-formula-2026-08-11.json"), "utf8"));
const brandMark = (await readFile(path.join(root, "public", "assets", "brand", "karada-seibun-lab-mark.svg"))).toString("base64");
const comicPath = path.join(root, "public", "assets", "source-illustrations", "nucleotide-formula", "comic-sheet.png");
const articleOutput = path.join(root, "public", "assets", "articles", "nucleotide-in-infant-formula");
const socialOutput = path.join(root, "public", "assets", "social", "daily", data.id);
await mkdir(articleOutput, { recursive: true });
await mkdir(socialOutput, { recursive: true });

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const lines = (value = "") => escapeHtml(value).split("\n").map((line) => `<span>${line}</span>`).join("");

const ingredientNames = `
  <div class="ingredient-card">
    <small>表示で見つかる名前の例</small>
    <div class="tags"><b>5'-CMP</b><b>イノシン酸Na</b><b>ウリジル酸Na</b><b>グアニル酸Na</b><b>5'-AMP</b></div>
    <strong>5種類のヌクレオチド</strong>
  </div>`;

const visualFor = (name) => name === "names"
  ? `<div class="scene panel-3"></div>${ingredientNames}`
  : `<div class="scene ${name}"></div>`;

const baseCss = `
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/medium.otf") format("opentype"); font-weight: 400 600; }
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/bold.otf") format("opentype"); font-weight: 700 900; }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 100%; height: 100%; }
  body { overflow: hidden; color: #233d50; background: #f8f3e9; font-family: "Karada Yu Gothic", sans-serif; }
  .brand { display: flex; align-items: center; gap: 14px; color: #001b41; font-weight: 800; letter-spacing: .06em; }
  .brand img { width: 48px; height: 48px; object-fit: contain; }
  .scene { width: 100%; aspect-ratio: 1; border: 8px solid rgba(255,255,255,.9); border-radius: 38px; background-image: url("https://assets.local/comic.png"); background-size: 200% 200%; box-shadow: 0 18px 42px rgba(35,61,80,.16); }
  .panel-1 { background-position: left top; }
  .panel-2 { background-position: right top; }
  .panel-3 { background-position: left bottom; }
  .panel-4 { background-position: right bottom; }
  .ingredient-card { position: absolute; inset: 74px 52px 55px; display: flex; flex-direction: column; justify-content: center; padding: 36px; border-radius: 30px; background: rgba(255,253,247,.96); box-shadow: 0 18px 42px rgba(35,61,80,.18); }
  .ingredient-card small { color: #6b7b75; font-size: 21px; font-weight: 800; }
  .tags { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 22px; }
  .tags b { padding: 11px 15px; border-radius: 999px; color: #294f43; background: #e4f0e8; font-size: 20px; }
  .ingredient-card > strong { margin-top: 27px; color: #bd624d; font-size: 28px; }
`;

const socialCss = `
  ${baseCss}
  .slide { position: relative; width: 1080px; height: 1350px; padding: 62px 72px 56px; background: radial-gradient(circle at 90% 8%, rgba(217,155,61,.14), transparent 30%), radial-gradient(circle at 8% 90%, rgba(77,127,104,.13), transparent 30%), #faf6ed; }
  .slide::after { content: ""; position: absolute; inset: 20px; border: 1px solid rgba(35,61,80,.08); border-radius: 34px; pointer-events: none; }
  header { position: relative; z-index: 3; font-size: 27px; }
  .page { margin-left: auto; color: #7c8780; font-size: 23px; }
  .copy { position: relative; z-index: 3; margin-top: 40px; }
  .eyebrow { color: #bd624d; font-size: 26px; font-weight: 800; letter-spacing: .07em; }
  h1 { margin: 16px 0 0; font-size: 63px; line-height: 1.2; letter-spacing: -.04em; }
  h1 span, .body span { display: block; }
  .body { margin: 17px 0 0; color: #4e6066; font-size: 28px; line-height: 1.55; font-weight: 600; }
  .visual { position: absolute; left: 195px; right: 195px; bottom: 88px; height: 690px; }
  footer { position: absolute; z-index: 3; left: 72px; right: 72px; bottom: 34px; display: flex; align-items: center; gap: 18px; color: #68766f; font-size: 20px; }
  footer::before { content: ""; height: 1px; flex: 1; background: rgba(35,61,80,.18); }
`;

const articleCss = `
  ${baseCss}
  .hero { position: relative; width: 1440px; height: 960px; padding: 66px 80px; background: radial-gradient(circle at 88% 12%, rgba(217,155,61,.17), transparent 31%), radial-gradient(circle at 10% 88%, rgba(77,127,104,.13), transparent 29%), linear-gradient(135deg, #fbf7ef, #edf3ee); }
  .hero::after { content: ""; position: absolute; inset: 28px; border: 1px solid rgba(35,61,80,.1); border-radius: 36px; }
  .brand { position: relative; z-index: 3; font-size: 28px; }
  .copy { position: relative; z-index: 3; width: 650px; margin-top: 112px; }
  .copy small { color: #bd624d; font-size: 27px; font-weight: 900; letter-spacing: .08em; }
  h1 { margin: 24px 0 0; font-size: 66px; line-height: 1.25; letter-spacing: -.045em; }
  .lead { margin-top: 26px; color: #50636a; font-size: 29px; line-height: 1.65; font-weight: 600; }
  .answer { display: inline-block; margin-top: 31px; padding: 18px 24px; border-radius: 18px; color: #fff; background: #bd624d; font-size: 25px; font-weight: 900; }
  .hero-visual { position: absolute; z-index: 2; right: 74px; top: 126px; width: 610px; }
  .source-note { position: absolute; z-index: 3; left: 80px; bottom: 66px; color: #60716b; font-size: 20px; font-weight: 700; }
`;

const browser = await playwright.chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}),
});

const renderPage = async ({ html, output, width, height }) => {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.route("https://fontlibrary.local/medium.otf", (route) => route.fulfill({ path: mediumFont, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
  await page.route("https://fontlibrary.local/bold.otf", (route) => route.fulfill({ path: boldFont, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
  await page.route("https://assets.local/comic.png", (route) => route.fulfill({ path: comicPath, contentType: "image/png", headers: { "access-control-allow-origin": "*" } }));
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  if (!await page.evaluate(() => document.fonts.check('32px "Karada Yu Gothic"'))) throw new Error("Yu Gothic font could not be loaded.");
  await page.screenshot({ path: output, type: "png" });
  await page.close();
};

const articleHtml = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${articleCss}</style></head><body><main class="hero">
  <div class="brand"><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ</div>
  <section class="copy"><small>身近なところで見つける核酸</small><h1>ヌクレオチドって、<br>粉ミルクにも<br>入っているの？</h1><p class="lead">メーカーの公式表示を、<br>実際に確かめてみました。</p><div class="answer">はい。一部の商品にあります。</div></section>
  <section class="hero-visual" aria-label="粉ミルクの表示を確かめる筆者の漫画"><div class="scene panel-2"></div></section>
  <div class="source-note">商品によって表示・配合は異なります。</div>
</main></body></html>`;

await renderPage({ html: articleHtml, output: path.join(articleOutput, "nucleotide-in-infant-formula.png"), width: 1440, height: 960 });

for (const [index, slide] of data.slides.entries()) {
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${socialCss}</style></head><body><main class="slide">
    <header class="brand"><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ<span class="page">${String(index + 1).padStart(2, "0")} / ${String(data.slides.length).padStart(2, "0")}</span></header>
    <section class="copy"><div class="eyebrow">${escapeHtml(slide.eyebrow)}</div><h1>${lines(slide.title)}</h1><p class="body">${lines(slide.body)}</p></section>
    <section class="visual">${visualFor(slide.visual)}</section><footer>詳しい説明と情報源は公式サイトへ</footer>
  </main></body></html>`;
  await renderPage({ html, output: path.join(socialOutput, `${String(index + 1).padStart(2, "0")}.png`), width: 1080, height: 1350 });
}

await browser.close();
console.log(`Rendered nucleotide/formula article hero and ${data.slides.length} social slides.`);
