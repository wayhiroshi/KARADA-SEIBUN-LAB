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
const carousel = JSON.parse(await readFile(path.join(root, "content", "social", "is-willpower-enough-for-dieting-2026-08-18.json"), "utf8"));
const comic = JSON.parse(await readFile(path.join(root, "content", "social", "is-willpower-enough-for-dieting-comic-2026-08-18.json"), "utf8"));
const heroSource = path.join(root, "public", "assets", "source-illustrations", "is-willpower-enough-for-dieting", "entryway-reflection-v1.png");
const comicSource = path.join(root, "public", "assets", "source-illustrations", "is-willpower-enough-for-dieting", "four-panel-story-v1.png");
const articleDir = path.join(root, "public", "assets", "articles", "is-willpower-enough-for-dieting");
const carouselDir = path.join(root, "public", "assets", "social", "daily", carousel.id);
const comicDir = path.join(root, "public", "assets", "social", "daily", comic.id);
await Promise.all([articleDir, carouselDir, comicDir].map((dir) => mkdir(dir, { recursive: true })));

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const lines = (value = "") => escapeHtml(value).split("\n").map((line) => `<span>${line}</span>`).join("");
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
  .hero::before { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(251,247,239,.99) 0%, rgba(251,247,239,.93) 39%, rgba(251,247,239,.22) 70%, rgba(251,247,239,0) 100%); }
  .hero::after { content: ""; position: absolute; inset: 28px; border: 1px solid rgba(35,61,80,.1); border-radius: 36px; }
  .brand { position: relative; z-index: 2; display: flex; align-items: center; gap: 14px; color: #001b41; font-size: 28px; font-weight: 800; letter-spacing: .06em; }
  .brand img { width: 48px; height: 48px; object-fit: contain; }
  .copy { position: relative; z-index: 2; width: 690px; margin-top: 100px; }
  .copy small { color: #a95543; font-size: 27px; font-weight: 900; letter-spacing: .08em; }
  h1 { margin: 24px 0 0; color: #263d34; font-size: 66px; line-height: 1.25; letter-spacing: -.05em; }
  .lead { margin: 28px 0 0; color: #53645d; font-size: 29px; line-height: 1.62; font-weight: 600; }
  .answer { display: inline-block; margin-top: 31px; padding: 18px 24px; border-radius: 18px; color: #fff; background: #b8614e; font-size: 25px; font-weight: 900; box-shadow: 0 12px 28px rgba(112,69,53,.13); }
  .note { position: absolute; z-index: 2; left: 80px; bottom: 66px; color: #60716b; font-size: 20px; font-weight: 700; letter-spacing: .03em; }
</style></head><body><main class="hero">
  <div class="brand"><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ</div>
  <section class="copy"><small>ダイエットを続ける</small><h1>続かないのは、<br>意志が弱いから？</h1><p class="lead">毎日同じ強さで<br>頑張らなくても大丈夫。</p><div class="answer">根性より、続けやすい仕組み。</div></section>
  <div class="note">予定、記録、人の支えを、行動の手前へ。</div>
</main></body></html>`;

const socialCss = `
  ${fontCss}
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1080px; height: 1350px; }
  body { overflow: hidden; color: #233d50; background: #fbf7ef; font-family: "Karada Yu Gothic", sans-serif; }
  .slide { position: relative; width: 1080px; height: 1350px; padding: 62px 72px 58px; background: radial-gradient(circle at 92% 8%, rgba(222,157,112,.17), transparent 28%), radial-gradient(circle at 5% 92%, rgba(131,164,116,.17), transparent 30%), #fbf7ef; }
  .slide::after { content: ""; position: absolute; inset: 20px; border: 1px solid rgba(35,61,80,.09); border-radius: 34px; pointer-events: none; }
  header { position: relative; z-index: 5; display: flex; align-items: center; gap: 14px; color: #001b41; font-size: 27px; font-weight: 800; letter-spacing: .06em; }
  header img { width: 48px; height: 48px; object-fit: contain; }
  .page { margin-left: auto; color: #78847d; font-size: 22px; letter-spacing: .08em; }
  .copy { position: relative; z-index: 4; margin-top: 48px; }
  .eyebrow { color: #a95543; font-size: 27px; font-weight: 800; letter-spacing: .06em; }
  h1 { margin: 18px 0 0; color: #263d34; font-size: 66px; line-height: 1.2; letter-spacing: -.045em; }
  h1 span, .body span { display: block; }
  .body { margin: 24px 0 0; color: #53645d; font-size: 30px; line-height: 1.62; font-weight: 600; }
  .art { position: absolute; z-index: 1; left: 0; right: 0; bottom: 0; height: 760px; background: url("https://assets.local/hero.png") 62% bottom/auto 760px no-repeat; }
  .art::before { content: ""; position: absolute; inset: 0; background: linear-gradient(#fbf7ef 0%, rgba(251,247,239,.22) 32%, rgba(251,247,239,0) 52%); }
  .day-grid { position: absolute; z-index: 3; left: 80px; right: 80px; bottom: 155px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .day { min-height: 275px; padding: 36px 28px; border-radius: 30px; background: rgba(255,255,255,.94); border: 2px solid rgba(65,91,77,.11); box-shadow: 0 18px 48px rgba(42,61,50,.10); text-align: center; }
  .day b { display: grid; place-items: center; width: 62px; height: 62px; margin: 0 auto 26px; border-radius: 50%; color: #fff; background: #7c9281; font-size: 24px; }
  .day:nth-child(2) b { background: #c87760; }
  .day:nth-child(3) b { background: #6f8fa0; }
  .day strong { display: block; color: #315647; font-size: 32px; }
  .day p { margin: 16px 0 0; color: #69766f; font-size: 23px; line-height: 1.55; font-weight: 600; }
  .support-grid { position: absolute; z-index: 3; left: 80px; right: 80px; bottom: 155px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .support { min-height: 310px; padding: 38px 28px; border-radius: 32px; background: #fff; box-shadow: 0 18px 48px rgba(42,61,50,.11); text-align: center; }
  .support .shape { width: 82px; height: 82px; margin: 0 auto 26px; border: 9px solid #79927f; border-radius: 22px; }
  .support:nth-child(2) .shape { border-color: #c87760; border-radius: 50%; }
  .support:nth-child(3) .shape { border-color: #6f8fa0; border-radius: 50% 50% 18px 18px; }
  .support strong { color: #263d34; font-size: 34px; }
  .support p { margin: 17px 0 0; color: #68766f; font-size: 23px; line-height: 1.5; font-weight: 600; }
  .answer-card { position: absolute; z-index: 3; left: 82px; right: 82px; bottom: 165px; padding: 58px 54px; border-radius: 40px; color: #fff; background: #315647; box-shadow: 0 28px 70px rgba(42,61,50,.20); text-align: center; }
  .answer-card small { display: block; font-size: 25px; font-weight: 700; opacity: .82; }
  .answer-card strong { display: block; margin-top: 20px; font-size: 48px; line-height: 1.4; }
  footer { position: absolute; z-index: 5; left: 72px; right: 72px; bottom: 34px; display: flex; align-items: center; gap: 18px; color: #68766f; font-size: 20px; }
  footer::before { content: ""; height: 1px; flex: 1; background: rgba(35,61,80,.18); }
`;

const carouselVisual = (visual) => {
  if (visual === "changing-days") return `<div class="day-grid">
    <div class="day"><b>忙</b><strong>忙しい日</strong><p>予定どおりに<br>動けないこともある</p></div>
    <div class="day"><b>疲</b><strong>疲れた日</strong><p>選びやすい行動が<br>いつもと変わる</p></div>
    <div class="day"><b>変</b><strong>予定変更</strong><p>一度止まっても<br>計画を直せる</p></div>
  </div>`;
  if (visual === "supports") return `<div class="support-grid">
    <div class="support"><div class="shape"></div><strong>予定</strong><p>いつするかを<br>先に決める</p></div>
    <div class="support"><div class="shape"></div><strong>記録</strong><p>できたことを<br>見える形に</p></div>
    <div class="support"><div class="shape"></div><strong>人の支え</strong><p>一人で<br>抱え込まない</p></div>
  </div>`;
  if (visual === "answer") return `<div class="art"></div><div class="answer-card"><small>意志が揺れた日にも</small><strong>止まっても戻れる道を、<br>暮らしの中につくる。</strong></div>`;
  return `<div class="art"></div>`;
};

const comicCss = `
  ${fontCss}
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1080px; height: 1350px; }
  body { overflow: hidden; color: #233d50; background: #f8f4eb; font-family: "Karada Yu Gothic", sans-serif; }
  .comic-slide { position: relative; width: 1080px; height: 1350px; padding: 52px 56px; background: #f8f4eb; }
  .comic-slide::after { content: ""; position: absolute; inset: 20px; border: 1px solid rgba(35,61,80,.1); border-radius: 34px; pointer-events: none; }
  header { position: relative; z-index: 6; display: flex; align-items: center; gap: 14px; color: #001b41; font-size: 25px; font-weight: 800; }
  header img { width: 44px; height: 44px; }
  .page { margin-left: auto; color: #7b877f; font-size: 21px; }
  .frame { position: absolute; z-index: 1; left: 56px; right: 56px; top: 124px; bottom: 64px; overflow: hidden; border-radius: 32px; background-image: url("https://assets.local/comic.png"); background-size: 200% 200%; background-repeat: no-repeat; box-shadow: 0 18px 55px rgba(42,61,50,.13); }
  .comic-1 { background-position: left top; }
  .comic-2 { background-position: right top; }
  .comic-3 { background-position: left bottom; }
  .comic-4 { background-position: right bottom; }
  .bubble { position: absolute; z-index: 4; left: 88px; top: 168px; max-width: 690px; padding: 34px 40px; border-radius: 28px; background: rgba(255,255,255,.96); box-shadow: 0 14px 42px rgba(42,61,50,.12); }
  .bubble small { color: #a95543; font-size: 24px; font-weight: 900; }
  .bubble strong { display: block; margin-top: 12px; color: #263d34; font-size: 51px; line-height: 1.3; letter-spacing: -.04em; }
  .bubble strong span, .bubble p span { display: block; }
  .bubble p { margin: 16px 0 0; color: #586a61; font-size: 26px; line-height: 1.5; font-weight: 600; }
  .panel-4 .frame { bottom: 330px; }
  .panel-4 .bubble { top: auto; bottom: 70px; left: 76px; width: 928px; max-width: 928px; padding: 22px 32px; display: grid; grid-template-columns: 1.35fr .8fr; gap: 4px 32px; }
  .panel-4 .bubble small { grid-column: 1 / -1; }
  .panel-4 .bubble strong { margin-top: 4px; font-size: 42px; }
  .panel-4 .bubble p { align-self: center; margin-top: 4px; font-size: 24px; }
`;

async function preparePage(page) {
  await page.route("https://fontlibrary.local/medium.otf", (route) => route.fulfill({ path: mediumFont, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
  await page.route("https://fontlibrary.local/bold.otf", (route) => route.fulfill({ path: boldFont, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
  await page.route("https://assets.local/hero.png", (route) => route.fulfill({ path: heroSource, contentType: "image/png", headers: { "access-control-allow-origin": "*" } }));
  await page.route("https://assets.local/comic.png", (route) => route.fulfill({ path: comicSource, contentType: "image/png", headers: { "access-control-allow-origin": "*" } }));
}

const browser = await playwright.chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}),
});

const heroPage = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
await preparePage(heroPage);
await heroPage.setContent(heroHtml, { waitUntil: "load" });
await heroPage.evaluate(() => document.fonts.ready);
if (!await heroPage.evaluate(() => document.fonts.check('32px "Karada Yu Gothic"'))) throw new Error("Yu Gothic font could not be loaded.");
await heroPage.screenshot({ path: path.join(articleDir, "is-willpower-enough-for-dieting.png"), type: "png" });
await heroPage.close();

for (const [index, slide] of carousel.slides.entries()) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  await preparePage(page);
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${socialCss}</style></head><body><main class="slide">
    <header><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ<span class="page">${String(index + 1).padStart(2, "0")} / ${String(carousel.slides.length).padStart(2, "0")}</span></header>
    <section class="copy"><div class="eyebrow">${escapeHtml(slide.eyebrow)}</div><h1>${lines(slide.title)}</h1><p class="body">${lines(slide.body)}</p></section>
    ${carouselVisual(slide.visual)}<footer>詳しい説明と情報源は公式サイトへ</footer>
  </main></body></html>`;
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(carouselDir, `${String(index + 1).padStart(2, "0")}.png`), type: "png" });
  await page.close();
}

for (const [index, slide] of comic.slides.entries()) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  await preparePage(page);
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${comicCss}</style></head><body><main class="comic-slide panel-${index + 1}">
    <header><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ<span class="page">${String(index + 1).padStart(2, "0")} / ${String(comic.slides.length).padStart(2, "0")}</span></header>
    <div class="frame ${escapeHtml(slide.visual)}"></div>
    <section class="bubble"><small>${escapeHtml(slide.eyebrow)}</small><strong>${lines(slide.title)}</strong><p>${lines(slide.body)}</p></section>
  </main></body></html>`;
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(comicDir, `${String(index + 1).padStart(2, "0")}.png`), type: "png" });
  await page.close();
}

await browser.close();
console.log(`Rendered article hero, ${carousel.slides.length} carousel slides and ${comic.slides.length} comic slides.`);
