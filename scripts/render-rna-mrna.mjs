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

const data = JSON.parse(await readFile(path.join(root, "content", "social", "rna-mrna-2026-08-11.json"), "utf8"));
const brandMark = (await readFile(path.join(root, "public", "assets", "brand", "karada-seibun-lab-mark.svg"))).toString("base64");
const articleOutput = path.join(root, "public", "assets", "articles", "rna-to-mrna");
const socialOutput = path.join(root, "public", "assets", "social", "daily", data.id);
await mkdir(articleOutput, { recursive: true });
await mkdir(socialOutput, { recursive: true });

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const lines = (value = "") => escapeHtml(value).split("\n").map((line) => `<span>${line}</span>`).join("");

const familyVisual = `
  <div class="rna-family">
    <div class="family-label"><small>大きな仲間の名前</small><strong>RNA</strong></div>
    <div class="mrna-card"><small>その中の一種類</small><strong>mRNA</strong><span>メッセンジャー役</span></div>
  </div>`;

const fruitVisual = `
  <div class="analogy">
    <div class="fruit-family"><strong>果物</strong><span class="apple"><i></i><b>りんご</b></span></div>
    <em>＝</em>
    <div class="small-rna"><strong>RNA</strong><span><b>mRNA</b></span></div>
  </div>`;

const answerVisual = `
  <div class="answer-visual">
    <div class="m-badge">m</div><strong>messenger</strong><span>伝える役を見分ける目印</span>
    <div class="one-line"><b>RNA</b><i>の中の一種類が</i><b>mRNA</b></div>
  </div>`;

const visualFor = (name) => ({
  cover: familyVisual,
  fruit: fruitVisual,
  family: familyVisual,
  answer: answerVisual,
}[name] ?? familyVisual);

const baseCss = `
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/medium.otf") format("opentype"); font-weight: 400 600; }
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/bold.otf") format("opentype"); font-weight: 700 900; }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 100%; height: 100%; }
  body { overflow: hidden; color: #233d50; background: #f8f3e9; font-family: "Karada Yu Gothic", sans-serif; }
  .brand { display: flex; align-items: center; gap: 14px; color: #001b41; font-weight: 800; letter-spacing: .06em; }
  .brand img { width: 48px; height: 48px; object-fit: contain; }
  .rna-family { position: relative; height: 100%; min-height: 430px; padding: 48px; border: 3px solid #8bb5a0; border-radius: 54px; background: linear-gradient(145deg, #edf5ec, #fbf8ef); box-shadow: inset 0 0 0 12px rgba(255,255,255,.45); }
  .family-label small { display: block; color: #5d796b; font-size: 21px; font-weight: 800; }
  .family-label strong { display: block; margin-top: 5px; color: #335f4d; font-size: 76px; line-height: 1; letter-spacing: .02em; }
  .mrna-card { position: absolute; right: 52px; bottom: 48px; width: 67%; padding: 38px 36px; border-radius: 32px; color: white; background: #213f58; box-shadow: 0 18px 36px rgba(35,61,80,.2); }
  .mrna-card small { display: block; color: #cfe5d9; font-size: 20px; font-weight: 800; }
  .mrna-card strong { display: block; margin-top: 7px; font-size: 69px; line-height: 1.05; }
  .mrna-card span { display: block; margin-top: 12px; color: #fff1c9; font-size: 25px; font-weight: 800; }
  .analogy { display: grid; grid-template-columns: 1fr 70px 1fr; align-items: center; gap: 15px; height: 100%; }
  .analogy > em { color: #bd624d; font-size: 60px; font-style: normal; font-weight: 900; text-align: center; }
  .fruit-family, .small-rna { position: relative; height: 390px; padding: 34px; border-radius: 42px; background: #edf5ec; border: 3px solid #8bb5a0; }
  .fruit-family > strong, .small-rna > strong { color: #335f4d; font-size: 48px; }
  .apple, .small-rna > span { position: absolute; right: 32px; bottom: 32px; display: grid; width: 205px; height: 205px; place-items: center; align-content: center; border-radius: 50%; color: white; background: #bd624d; box-shadow: 0 15px 30px rgba(35,61,80,.14); }
  .apple::before { content: ""; position: absolute; top: -20px; width: 17px; height: 48px; border-radius: 10px; background: #5c4937; transform: rotate(12deg); }
  .apple::after { content: ""; position: absolute; top: -12px; left: 55%; width: 50px; height: 24px; border-radius: 50%; background: #5e9169; transform: rotate(-18deg); }
  .apple b, .small-rna span b { position: relative; z-index: 2; font-size: 31px; }
  .small-rna > span { border-radius: 28px; background: #213f58; }
  .small-rna span b { font-size: 42px; }
  .answer-visual { display: flex; height: 100%; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  .m-badge { display: grid; width: 132px; height: 132px; place-items: center; border-radius: 50%; color: white; background: #bd624d; font-size: 78px; font-weight: 900; box-shadow: 0 16px 32px rgba(189,98,77,.2); }
  .answer-visual > strong { margin-top: 20px; color: #213f58; font-size: 53px; }
  .answer-visual > span { margin-top: 9px; color: #5d6d70; font-size: 25px; font-weight: 700; }
  .one-line { display: flex; align-items: center; gap: 15px; margin-top: 52px; padding: 22px 30px; border-radius: 22px; background: rgba(255,255,255,.78); box-shadow: 0 12px 30px rgba(35,61,80,.09); }
  .one-line b { color: #335f4d; font-size: 37px; }.one-line b:last-child { color: #213f58; }.one-line i { color: #657578; font-size: 22px; font-style: normal; font-weight: 700; }
`;

const socialCss = `
  ${baseCss}
  .slide { position: relative; width: 1080px; height: 1350px; padding: 66px 72px 56px; background: radial-gradient(circle at 90% 8%, rgba(217,155,61,.15), transparent 30%), radial-gradient(circle at 8% 90%, rgba(77,127,104,.13), transparent 30%), #f9f5ec; }
  .slide::after { content: ""; position: absolute; inset: 20px; border: 1px solid rgba(35,61,80,.08); border-radius: 34px; }
  header { position: relative; z-index: 3; font-size: 27px; }.page { margin-left: auto; color: #7c8780; font-size: 23px; }
  .copy { position: relative; z-index: 3; margin-top: 54px; }.eyebrow { color: #bd624d; font-size: 28px; font-weight: 800; letter-spacing: .07em; }
  h1 { margin: 22px 0 0; font-size: 70px; line-height: 1.22; letter-spacing: -.04em; }h1 span,.body span { display: block; }
  .body { margin: 25px 0 0; color: #4e6066; font-size: 30px; line-height: 1.6; font-weight: 600; }
  .visual { position: absolute; left: 72px; right: 72px; bottom: 90px; height: 580px; }
  footer { position: absolute; z-index: 3; left: 72px; right: 72px; bottom: 38px; display: flex; align-items: center; gap: 18px; color: #68766f; font-size: 21px; }
  footer::before { content: ""; height: 1px; flex: 1; background: rgba(35,61,80,.18); }
`;

const articleCss = `
  ${baseCss}
  .hero { position: relative; width: 1440px; height: 960px; padding: 68px 82px; background: radial-gradient(circle at 88% 12%, rgba(217,155,61,.17), transparent 31%), radial-gradient(circle at 10% 88%, rgba(77,127,104,.13), transparent 29%), linear-gradient(135deg, #fbf7ef, #edf3ee); }
  .hero::after { content: ""; position: absolute; inset: 28px; border: 1px solid rgba(35,61,80,.1); border-radius: 36px; }
  .brand { position: relative; z-index: 3; font-size: 28px; }
  .copy { position: relative; z-index: 3; width: 610px; margin-top: 105px; }
  .copy small { color: #bd624d; font-size: 27px; font-weight: 900; letter-spacing: .09em; }
  h1 { margin: 25px 0 0; font-size: 68px; line-height: 1.25; letter-spacing: -.045em; }
  .lead { margin-top: 28px; color: #50636a; font-size: 29px; line-height: 1.7; font-weight: 600; }
  .takeaway { position: absolute; z-index: 3; left: 82px; bottom: 72px; padding: 18px 25px; border-radius: 20px; color: #3e5651; background: rgba(255,255,255,.78); font-size: 24px; font-weight: 800; }
  .takeaway b { color: #bd624d; }
  .hero-visual { position: absolute; z-index: 2; right: 72px; top: 112px; width: 650px; height: 710px; }
  .hero-visual .rna-family { min-height: 710px; padding: 58px; }.hero-visual .mrna-card { right: 55px; bottom: 55px; width: 70%; }
`;

const browser = await playwright.chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}),
});

const renderPage = async ({ html, output, width, height }) => {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.route("https://fontlibrary.local/medium.otf", (route) => route.fulfill({ path: mediumFont, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
  await page.route("https://fontlibrary.local/bold.otf", (route) => route.fulfill({ path: boldFont, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  if (!await page.evaluate(() => document.fonts.check('32px "Karada Yu Gothic"'))) throw new Error("Yu Gothic font could not be loaded.");
  await page.screenshot({ path: output, type: "png" });
  await page.close();
};

const articleHtml = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${articleCss}</style></head><body><main class="hero">
  <div class="brand"><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ</div>
  <section class="copy"><small>DNAを目で理解する 05</small><h1>RNAとmRNA、<br>別物なの？</h1><p class="lead">横に並ぶ二つではなく、<br>「大きな仲間」と<br>「その中の一種類」です。</p></section>
  <div class="takeaway"><b>今日の答え</b>　mRNAもRNAです。</div>
  <section class="hero-visual" aria-label="RNAという大きな仲間の中にmRNAが含まれる図解">${familyVisual}</section>
</main></body></html>`;

await renderPage({ html: articleHtml, output: path.join(articleOutput, "rna-to-mrna.png"), width: 1440, height: 960 });

for (const [index, slide] of data.slides.entries()) {
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${socialCss}</style></head><body><main class="slide">
    <header class="brand"><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ<span class="page">${String(index + 1).padStart(2, "0")} / ${String(data.slides.length).padStart(2, "0")}</span></header>
    <section class="copy"><div class="eyebrow">${escapeHtml(slide.eyebrow)}</div><h1>${lines(slide.title)}</h1><p class="body">${lines(slide.body)}</p></section>
    <section class="visual">${visualFor(slide.visual)}</section><footer>詳しい説明と情報源は公式サイトへ</footer>
  </main></body></html>`;
  await renderPage({ html, output: path.join(socialOutput, `${String(index + 1).padStart(2, "0")}.png`), width: 1080, height: 1350 });
}

await browser.close();
console.log(`Rendered RNA/mRNA article hero and ${data.slides.length} social slides.`);
