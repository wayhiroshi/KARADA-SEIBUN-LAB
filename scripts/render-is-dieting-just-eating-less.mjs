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
const socialData = JSON.parse(await readFile(path.join(root, "content", "social", "is-dieting-just-eating-less-2026-08-17.json"), "utf8"));
const illustrationPath = path.join(root, "public", "assets", "source-illustrations", "is-dieting-just-eating-less", "daily-habits-v1.png");
const outputDir = path.join(root, "public", "assets", "articles", "is-dieting-just-eating-less");
const outputPath = path.join(outputDir, "is-dieting-just-eating-less.png");
const socialOutputDir = path.join(root, "public", "assets", "social", "daily", socialData.id);
await mkdir(outputDir, { recursive: true });
await mkdir(socialOutputDir, { recursive: true });

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const lines = (value = "") => escapeHtml(value).split("\n").map((line) => `<span>${line}</span>`).join("");

const css = `
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/medium.otf") format("opentype"); font-weight: 400 600; }
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/bold.otf") format("opentype"); font-weight: 700 900; }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 100%; height: 100%; }
  body { overflow: hidden; color: #233d50; background: #fbf7ef; font-family: "Karada Yu Gothic", sans-serif; }
  .hero { position: relative; width: 1440px; height: 960px; padding: 66px 80px; background: url("https://assets.local/illustration.png") center/cover no-repeat; }
  .hero::after { content: ""; position: absolute; inset: 28px; border: 1px solid rgba(35,61,80,.1); border-radius: 36px; pointer-events: none; }
  .brand { position: relative; z-index: 2; display: flex; align-items: center; gap: 14px; color: #001b41; font-size: 28px; font-weight: 800; letter-spacing: .06em; }
  .brand img { width: 48px; height: 48px; object-fit: contain; }
  .copy { position: relative; z-index: 2; width: 650px; margin-top: 100px; }
  .copy small { color: #a95543; font-size: 27px; font-weight: 900; letter-spacing: .08em; }
  h1 { margin: 24px 0 0; color: #263d34; font-size: 62px; line-height: 1.27; letter-spacing: -.045em; }
  .lead { margin: 26px 0 0; color: #53645d; font-size: 29px; line-height: 1.62; font-weight: 600; }
  .answer { display: inline-block; margin-top: 30px; padding: 18px 24px; border-radius: 18px; color: #fff; background: #b8614e; font-size: 25px; font-weight: 900; box-shadow: 0 12px 28px rgba(112,69,53,.13); }
  .note { position: absolute; z-index: 2; left: 80px; bottom: 66px; color: #60716b; font-size: 20px; font-weight: 700; letter-spacing: .03em; }
`;

const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${css}</style></head><body><main class="hero">
  <div class="brand"><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ</div>
  <section class="copy"><small>ダイエットを考える</small><h1>ダイエットは、<br>食事を減らすこと？</h1><p class="lead">食べる量だけの<br>話ではありません。</p><div class="answer">食べ方と動き方を、暮らしに合わせて整える。</div></section>
  <div class="note">無理なく続く形を、毎日の中で探します。</div>
</main></body></html>`;

const socialCss = `
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/medium.otf") format("opentype"); font-weight: 400 600; }
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/bold.otf") format("opentype"); font-weight: 700 900; }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1080px; height: 1350px; }
  body { overflow: hidden; color: #233d50; background: #fbf7ef; font-family: "Karada Yu Gothic", sans-serif; }
  .slide { position: relative; width: 1080px; height: 1350px; padding: 62px 72px 58px; background: radial-gradient(circle at 92% 8%, rgba(222,157,112,.18), transparent 28%), radial-gradient(circle at 5% 92%, rgba(131,164,116,.18), transparent 30%), #fbf7ef; }
  .slide::after { content: ""; position: absolute; inset: 20px; border: 1px solid rgba(35,61,80,.09); border-radius: 34px; pointer-events: none; }
  header { position: relative; z-index: 5; display: flex; align-items: center; gap: 14px; color: #001b41; font-size: 27px; font-weight: 800; letter-spacing: .06em; }
  header img { width: 48px; height: 48px; object-fit: contain; }
  .page { margin-left: auto; color: #78847d; font-size: 22px; letter-spacing: .08em; }
  .copy { position: relative; z-index: 4; margin-top: 48px; }
  .eyebrow { color: #a95543; font-size: 27px; font-weight: 800; letter-spacing: .06em; }
  h1 { margin: 18px 0 0; color: #263d34; font-size: 66px; line-height: 1.2; letter-spacing: -.045em; }
  h1 span, .body span { display: block; }
  .body { margin: 24px 0 0; color: #53645d; font-size: 30px; line-height: 1.62; font-weight: 600; }
  .art { position: absolute; z-index: 1; left: 0; right: 0; bottom: 0; height: 720px; background-image: url("https://assets.local/illustration.png"); background-repeat: no-repeat; background-size: auto 720px; background-position: 64% bottom; }
  .art::before { content: ""; position: absolute; inset: 0; background: linear-gradient(#fbf7ef 0%, rgba(251,247,239,.28) 28%, rgba(251,247,239,0) 50%); }
  .mini-card { position: absolute; z-index: 3; left: 90px; right: 90px; bottom: 155px; padding: 42px 48px; border-radius: 34px; background: rgba(255,255,255,.94); box-shadow: 0 22px 58px rgba(42,61,50,.13); }
  .mini-card strong { display: block; color: #315647; font-size: 39px; line-height: 1.35; }
  .mini-card p { margin: 18px 0 0; color: #617069; font-size: 26px; line-height: 1.55; font-weight: 600; }
  .habit-grid { position: absolute; z-index: 3; left: 72px; right: 72px; bottom: 150px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .habit { min-height: 300px; padding: 42px 36px; border-radius: 34px; background: rgba(255,255,255,.95); box-shadow: 0 20px 54px rgba(42,61,50,.12); }
  .habit b { display: grid; place-items: center; width: 68px; height: 68px; margin-bottom: 26px; border-radius: 50%; color: #fff; background: #b8614e; font-size: 27px; }
  .habit:nth-child(2) b { background: #608169; }
  .habit strong { display: block; color: #263d34; font-size: 38px; }
  .habit p { margin: 16px 0 0; color: #617069; font-size: 25px; line-height: 1.55; font-weight: 600; }
  .answer-card { position: absolute; z-index: 3; left: 78px; right: 78px; bottom: 160px; padding: 58px 52px; border-radius: 40px; color: #fff; background: #315647; box-shadow: 0 28px 70px rgba(42,61,50,.20); text-align: center; }
  .answer-card small { display: block; font-size: 25px; font-weight: 700; opacity: .82; }
  .answer-card strong { display: block; margin-top: 20px; font-size: 45px; line-height: 1.42; }
  footer { position: absolute; z-index: 5; left: 72px; right: 72px; bottom: 34px; display: flex; align-items: center; gap: 18px; color: #68766f; font-size: 20px; }
  footer::before { content: ""; height: 1px; flex: 1; background: rgba(35,61,80,.18); }
`;

const visualFor = (visual) => {
  if (visual === "eating") return `<div class="art"></div><div class="mini-card"><strong>減らすもの探しではなく、<br>いつもの食べ方を見る。</strong><p>必要な栄養はとりながら、量と内容を整えます。</p></div>`;
  if (visual === "habits") return `<div class="habit-grid">
    <div class="habit"><b>食</b><strong>食べ方</strong><p>量・内容・間食など、普段の食事を見直す</p></div>
    <div class="habit"><b>動</b><strong>動き方</strong><p>歩く・階段・家事など、動く機会を増やす</p></div>
  </div>`;
  if (visual === "answer") return `<div class="art"></div><div class="answer-card"><small>結果だけを動かすのではなく</small><strong>その結果につながる<br>生活習慣を整える。</strong></div>`;
  return `<div class="art"></div>`;
};

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
await browser.close();

const socialBrowser = await playwright.chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}),
});
for (const [index, slide] of socialData.slides.entries()) {
  const socialPage = await socialBrowser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  await socialPage.route("https://fontlibrary.local/medium.otf", (route) => route.fulfill({ path: mediumFont, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
  await socialPage.route("https://fontlibrary.local/bold.otf", (route) => route.fulfill({ path: boldFont, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
  await socialPage.route("https://assets.local/illustration.png", (route) => route.fulfill({ path: illustrationPath, contentType: "image/png", headers: { "access-control-allow-origin": "*" } }));
  const socialHtml = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${socialCss}</style></head><body><main class="slide">
    <header><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ<span class="page">${String(index + 1).padStart(2, "0")} / ${String(socialData.slides.length).padStart(2, "0")}</span></header>
    <section class="copy"><div class="eyebrow">${escapeHtml(slide.eyebrow)}</div><h1>${lines(slide.title)}</h1><p class="body">${lines(slide.body)}</p></section>
    ${visualFor(slide.visual)}<footer>詳しい説明と情報源は公式サイトへ</footer>
  </main></body></html>`;
  await socialPage.setContent(socialHtml, { waitUntil: "load" });
  await socialPage.evaluate(() => document.fonts.ready);
  if (!await socialPage.evaluate(() => document.fonts.check('32px "Karada Yu Gothic"'))) throw new Error("Yu Gothic font could not be loaded.");
  await socialPage.screenshot({ path: path.join(socialOutputDir, `${String(index + 1).padStart(2, "0")}.png`), type: "png" });
  await socialPage.close();
}
await socialBrowser.close();

console.log(`Rendered article hero and ${socialData.slides.length} Instagram slides.`);
