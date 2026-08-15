import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const fontLibrary = "/Users/yoshiaki/Library/Mobile Documents/com~apple~CloudDocs/FontLibrary/SystemFont";
const yuGothicMediumPath = path.join(fontLibrary, "Yu Gothic Medium.otf");
const yuGothicBoldPath = path.join(fontLibrary, "Yu Gothic Bold.otf");

let playwright;
try {
  playwright = await import("playwright");
} catch {
  if (!process.env.CODEX_WORKSPACE_NODE_MODULES) {
    throw new Error("Playwright is required. Install it locally or set CODEX_WORKSPACE_NODE_MODULES.");
  }
  playwright = await import(
    pathToFileURL(path.join(process.env.CODEX_WORKSPACE_NODE_MODULES, "playwright", "index.mjs")).href
  );
}

const { chromium } = playwright;
const data = JSON.parse(
  await readFile(path.join(root, "content", "social", "dna-baseball-2026-08-06.json"), "utf8"),
);
const brandMark = (
  await readFile(path.join(root, "public", "assets", "brand", "karada-seibun-lab-mark.svg"))
).toString("base64");

const articleOutput = path.join(root, "public", "assets", "articles", "dna-doko-ni-aru");
const socialOutput = path.join(root, "public", "assets", "social", "daily", data.id);
await mkdir(articleOutput, { recursive: true });
await mkdir(socialOutput, { recursive: true });

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const renderLines = (value = "") => escapeHtml(value).split("\n").map((line) => `<span>${line}</span>`).join("");

const baseball = (className = "") => `
  <svg class="baseball ${className}" viewBox="0 0 520 520" aria-hidden="true">
    <defs>
      <radialGradient id="ballShade" cx="35%" cy="25%" r="78%">
        <stop offset="0" stop-color="#fffef8"/>
        <stop offset=".68" stop-color="#f4efe3"/>
        <stop offset="1" stop-color="#ded7c9"/>
      </radialGradient>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="20" stdDeviation="22" flood-color="#24332b" flood-opacity=".18"/>
      </filter>
    </defs>
    <circle cx="260" cy="260" r="205" fill="url(#ballShade)" stroke="#d4cdbf" stroke-width="5" filter="url(#shadow)"/>
    <path d="M118 110 C205 178 205 342 118 410" fill="none" stroke="#c66b55" stroke-width="7" stroke-linecap="round"/>
    <path d="M402 110 C315 178 315 342 402 410" fill="none" stroke="#c66b55" stroke-width="7" stroke-linecap="round"/>
    <g stroke="#c66b55" stroke-width="5" stroke-linecap="round">
      <path d="M150 144 l-25 15 M165 171 l-27 13 M177 202 l-28 10 M184 235 l-29 5 M184 269 l-29 -1 M179 302 l-28 -7 M166 335 l-27 -12 M150 365 l-25 -15"/>
      <path d="M370 144 l25 15 M355 171 l27 13 M343 202 l28 10 M336 235 l29 5 M336 269 l29 -1 M341 302 l28 -7 M354 335 l27 -12 M370 365 l25 -15"/>
    </g>
    <path d="M222 167 C323 185 182 223 292 246 C395 267 165 294 291 329 C355 347 288 381 223 365 C164 350 186 314 249 309 C348 301 357 264 253 247 C159 232 169 190 222 167Z" fill="none" stroke="#4d7f68" stroke-width="8" stroke-linecap="round" opacity=".92"/>
    <circle cx="222" cy="167" r="8" fill="#d99b3d"/>
    <circle cx="223" cy="365" r="8" fill="#d99b3d"/>
  </svg>`;

const zoomVisual = `
  <div class="zoom-chain">
    <div class="zoom-node body-node"><span class="person">人</span><small>体</small></div>
    <i>›</i>
    <div class="zoom-node cell-node"><span><b></b></span><small>細胞</small></div>
    <i>›</i>
    <div class="zoom-node nucleus-node"><span></span><small>核</small></div>
    <i>›</i>
    <div class="zoom-node dna-node"><span>〰</span><small>DNA</small></div>
  </div>`;

const distanceVisual = `
  <div class="distance-map">
    ${baseball("distance-ball")}
    <svg viewBox="0 0 820 430" aria-hidden="true">
      <path d="M120 310 C230 72 345 390 446 145 C520 -26 608 345 754 105" fill="none" stroke="#4d7f68" stroke-width="9" stroke-linecap="round" stroke-dasharray="2 18"/>
      <circle cx="120" cy="310" r="12" fill="#c66b55"/><circle cx="754" cy="105" r="12" fill="#d99b3d"/>
    </svg>
    <strong class="distance-number">約20<span>km</span></strong>
    <p class="distance-note">太さ 約0.02mm</p>
  </div>`;

const chromosomeVisual = `
  <div class="chromosome-card">
    <div class="chromosome-grid">${Array.from({ length: 23 }, (_, index) => `
      <div class="pair" aria-hidden="true"><i></i><i></i><small>${index + 1}</small></div>`).join("")}</div>
    <div class="chromosome-label"><strong>23対</strong><span>合計46本</span></div>
  </div>`;

const closingVisual = `
  <div class="closing-visual">
    ${baseball("closing-ball")}
    <div class="takeaway"><small>NUCLEUS</small><strong>核は収納場所</strong><small>CHROMOSOME</small><strong>染色体は整理した束</strong><small>DNA</small><strong>DNAは長い糸</strong></div>
  </div>`;

const visualFor = (name) => ({
  baseball: `<div class="cover-visual">${baseball()}<div class="scale-label"><small>核をこの大きさに</small><strong>野球ボール</strong></div></div>`,
  zoom: zoomVisual,
  distance: distanceVisual,
  chromosomes: chromosomeVisual,
  closing: closingVisual,
}[name] ?? "");

const sharedCss = `
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/yu-gothic-medium.otf") format("opentype"); font-weight: 400 600; }
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/yu-gothic-bold.otf") format("opentype"); font-weight: 700 900; }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 100%; height: 100%; }
  body { overflow: hidden; color: #223c50; background: #f8f3e9; font-family: "Karada Yu Gothic", sans-serif; }
  .baseball { display: block; }
  .brand { display: flex; align-items: center; gap: 14px; color: #001b41; font-weight: 800; letter-spacing: .06em; }
  .brand img { width: 48px; height: 48px; object-fit: contain; }
`;

const socialCss = `
  ${sharedCss}
  .slide { position: relative; width: 1080px; height: 1350px; padding: 66px 72px 56px; background: radial-gradient(circle at 88% 8%, rgba(217,155,61,.14), transparent 29%), radial-gradient(circle at 8% 88%, rgba(77,127,104,.12), transparent 30%), #f8f3e9; }
  .slide::after { content: ""; position: absolute; inset: 20px; border: 1px solid rgba(34,60,80,.08); border-radius: 34px; pointer-events: none; }
  header { display: flex; align-items: center; font-size: 27px; }
  .page { margin-left: auto; color: #7d857f; font-size: 23px; letter-spacing: .08em; }
  .copy { position: relative; z-index: 5; margin-top: 58px; }
  .eyebrow { color: #bf624d; font-size: 28px; font-weight: 800; letter-spacing: .08em; }
  h1 { margin: 24px 0 0; font-size: 72px; line-height: 1.22; letter-spacing: -.035em; font-weight: 900; }
  h1 span, .body span { display: block; }
  .body { margin-top: 28px; color: #4d5e65; font-size: 31px; line-height: 1.62; font-weight: 600; }
  .visual { position: absolute; left: 72px; right: 72px; bottom: 86px; height: 630px; }
  footer { position: absolute; left: 72px; right: 72px; bottom: 40px; display: flex; align-items: center; gap: 18px; color: #69766f; font-size: 21px; }
  footer::before { content: ""; height: 1px; flex: 1; background: rgba(34,60,80,.18); }
  .cover-visual { position: relative; width: 100%; height: 100%; }
  .cover-visual .baseball { width: 570px; height: 570px; margin: 32px auto 0; }
  .scale-label { position: absolute; right: 18px; bottom: 58px; padding: 22px 28px; border-radius: 24px; color: white; background: #223c50; box-shadow: 0 18px 36px rgba(34,60,80,.2); }
  .scale-label small, .scale-label strong { display: block; }
  .scale-label small { font-size: 21px; }
  .scale-label strong { margin-top: 4px; font-size: 34px; }
  .zoom-chain { height: 100%; display: flex; align-items: center; justify-content: center; gap: 16px; }
  .zoom-chain > i { color: #bd755d; font: 400 70px/1 Georgia, serif; }
  .zoom-node { width: 188px; text-align: center; }
  .zoom-node > span { display: grid; place-items: center; width: 176px; height: 176px; margin: 0 auto 22px; border-radius: 50%; background: rgba(255,255,255,.72); border: 4px solid #4d7f68; box-shadow: 0 18px 42px rgba(34,60,80,.12); }
  .zoom-node small { color: #223c50; font-size: 28px; font-weight: 800; }
  .person { color: #4d7f68; font-size: 55px; font-weight: 900; }
  .cell-node > span { position: relative; }
  .cell-node b { width: 72px; height: 72px; border-radius: 50%; background: #d99b3d; box-shadow: 0 0 0 18px rgba(217,155,61,.18); }
  .nucleus-node > span::before { content: ""; width: 104px; height: 104px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #f5c47a, #bd755d); }
  .dna-node > span { color: #4d7f68; font: 900 92px/1 Georgia, serif; }
  .distance-map { position: relative; height: 100%; overflow: hidden; border-radius: 34px; background: rgba(255,255,255,.48); border: 2px solid rgba(77,127,104,.13); }
  .distance-map > svg:not(.baseball) { position: absolute; inset: 70px 38px 60px 98px; width: calc(100% - 136px); height: calc(100% - 130px); }
  .distance-ball { position: absolute; left: 16px; bottom: 16px; z-index: 2; width: 240px; height: 240px; }
  .distance-number { position: absolute; right: 62px; top: 58px; color: #bd624d; font: 900 110px/1 "Karada Yu Gothic", sans-serif; letter-spacing: -.05em; }
  .distance-number span { margin-left: 8px; font-size: 50px; }
  .distance-note { position: absolute; right: 64px; top: 176px; color: #4d5e65; font-size: 29px; font-weight: 700; }
  .chromosome-card { height: 100%; display: flex; align-items: center; gap: 40px; padding: 34px 42px; border-radius: 34px; background: rgba(255,255,255,.55); border: 2px solid rgba(77,127,104,.13); }
  .chromosome-grid { flex: 1; display: grid; grid-template-columns: repeat(6, 1fr); gap: 15px 10px; }
  .pair { position: relative; display: flex; justify-content: center; align-items: flex-end; gap: 5px; height: 98px; padding-bottom: 20px; }
  .pair i { display: block; width: 12px; border-radius: 12px; background: linear-gradient(#4d7f68 0 42%, #d99b3d 42% 52%, #4d7f68 52%); }
  .pair i:first-child { height: 63px; }.pair i:nth-child(2) { height: 72px; }
  .pair small { position: absolute; bottom: -2px; color: #79847e; font-size: 13px; }
  .chromosome-label { width: 210px; text-align: center; }
  .chromosome-label strong, .chromosome-label span { display: block; }
  .chromosome-label strong { color: #bd624d; font-size: 64px; }
  .chromosome-label span { margin-top: 10px; font-size: 28px; font-weight: 800; }
  .closing-visual { height: 100%; display: flex; align-items: center; justify-content: center; gap: 28px; }
  .closing-ball { width: 405px; height: 405px; }
  .takeaway { width: 390px; padding: 32px; border-radius: 28px; background: rgba(255,255,255,.62); border: 2px solid rgba(77,127,104,.13); }
  .takeaway small, .takeaway strong { display: block; }
  .takeaway small { margin-top: 18px; color: #bd624d; font-size: 15px; font-weight: 900; letter-spacing: .12em; }
  .takeaway small:first-child { margin-top: 0; }
  .takeaway strong { margin-top: 3px; font-size: 27px; }
`;

const heroCss = `
  ${sharedCss}
  .hero { position: relative; width: 1440px; height: 960px; padding: 70px 82px; background: radial-gradient(circle at 78% 18%, rgba(217,155,61,.16), transparent 34%), linear-gradient(135deg, #fbf7ef, #edf3ee); }
  .hero::after { content: ""; position: absolute; inset: 28px; border: 1px solid rgba(34,60,80,.1); border-radius: 36px; }
  .hero .brand { position: relative; z-index: 3; font-size: 28px; }
  .hero-copy { position: relative; z-index: 4; width: 650px; margin-top: 110px; }
  .hero-copy small { display: block; color: #bd624d; font-size: 27px; font-weight: 900; letter-spacing: .1em; }
  .hero-copy h1 { margin: 24px 0 0; font-size: 76px; line-height: 1.2; letter-spacing: -.045em; }
  .hero-copy p { margin: 34px 0 0; color: #50636a; font-size: 32px; line-height: 1.65; font-weight: 600; }
  .hero-visual { position: absolute; right: 74px; top: 88px; z-index: 2; width: 650px; height: 730px; }
  .hero-visual .baseball { width: 620px; height: 620px; margin: 0 auto; }
  .hero-metric { position: absolute; right: 28px; bottom: 42px; padding: 25px 30px; border-radius: 25px; color: white; background: #223c50; box-shadow: 0 22px 52px rgba(34,60,80,.22); }
  .hero-metric small, .hero-metric strong { display: block; }
  .hero-metric small { font-size: 21px; }.hero-metric strong { margin-top: 3px; font-size: 39px; }
  .hero-footnote { position: absolute; left: 82px; bottom: 58px; color: #738078; font-size: 20px; }
`;

const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {}),
});

const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
await page.route("https://fontlibrary.local/yu-gothic-medium.otf", (route) => route.fulfill({ path: yuGothicMediumPath, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
await page.route("https://fontlibrary.local/yu-gothic-bold.otf", (route) => route.fulfill({ path: yuGothicBoldPath, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));

await page.setContent(`<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${heroCss}</style></head><body>
  <div class="hero">
    <div class="brand"><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ</div>
    <div class="hero-copy"><small>DNAを目で理解する 01</small><h1>DNAは、<br>体のどこにある？</h1><p>目に見えない大きさを、<br>野球ボールに置き換えてみました。</p></div>
    <div class="hero-visual">${baseball()}<div class="hero-metric"><small>核を野球ボールほどに拡大すると</small><strong>DNAは十数〜20km</strong></div></div>
    <div class="hero-footnote">※大きさの幅を含む、桁をつかむための概算です。</div>
  </div></body></html>`, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
if (!await page.evaluate(() => document.fonts.check('32px "Karada Yu Gothic"'))) throw new Error("Yu Gothic font could not be loaded.");
await page.screenshot({ path: path.join(articleOutput, "baseball-nucleus.png"), type: "png" });

await page.setViewportSize({ width: 1080, height: 1350 });
for (const [index, slide] of data.slides.entries()) {
  await page.setContent(`<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${socialCss}</style></head><body>
    <div class="slide">
      <header><div class="brand"><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ</div><div class="page">${index + 1} / ${data.slides.length}</div></header>
      <div class="copy"><div class="eyebrow">${escapeHtml(slide.eyebrow)}</div><h1>${renderLines(slide.title)}</h1>${slide.body ? `<div class="body">${renderLines(slide.body)}</div>` : ""}</div>
      <div class="visual">${visualFor(slide.visual)}</div>
      <footer>植井寛｜@karada_seibun_lab</footer>
    </div></body></html>`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const filename = `${String(index + 1).padStart(2, "0")}.png`;
  await page.screenshot({ path: path.join(socialOutput, filename), type: "png" });
}

await browser.close();
console.log(`Rendered article hero and ${data.slides.length} social slides.`);
