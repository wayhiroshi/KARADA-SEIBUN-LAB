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
const brandMark = (
  await readFile(path.join(root, "public", "assets", "brand", "karada-seibun-lab-mark.svg"))
).toString("base64");
const output = path.join(root, "public", "assets", "articles", "saibo-kaku-onaji-dna");
await mkdir(output, { recursive: true });

const css = `
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/yu-gothic-medium.otf") format("opentype"); font-weight: 400 600; }
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/yu-gothic-bold.otf") format("opentype"); font-weight: 700 900; }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 100%; height: 100%; }
  body { overflow: hidden; color: #223c50; background: #f8f3e9; font-family: "Karada Yu Gothic", sans-serif; }
  .hero { position: relative; width: 1440px; height: 960px; padding: 68px 82px; background: radial-gradient(circle at 84% 12%, rgba(217,155,61,.16), transparent 30%), radial-gradient(circle at 18% 88%, rgba(199,117,128,.12), transparent 29%), linear-gradient(135deg, #fbf7ef, #edf3ee); }
  .hero::after { content: ""; position: absolute; inset: 28px; border: 1px solid rgba(34,60,80,.1); border-radius: 36px; pointer-events: none; }
  .brand { position: relative; z-index: 4; display: flex; align-items: center; gap: 14px; color: #001b41; font-size: 28px; font-weight: 800; letter-spacing: .06em; }
  .brand img { width: 48px; height: 48px; object-fit: contain; }
  .copy { position: relative; z-index: 4; width: 650px; margin-top: 94px; }
  .copy small { display: block; color: #bd624d; font-size: 27px; font-weight: 900; letter-spacing: .1em; }
  h1 { margin: 24px 0 0; font-size: 68px; line-height: 1.27; letter-spacing: -.045em; }
  .question { margin: 28px 0 0; color: #50636a; font-size: 29px; line-height: 1.7; font-weight: 600; }
  .analogy { position: absolute; left: 82px; bottom: 66px; z-index: 4; display: flex; align-items: center; gap: 18px; padding: 17px 23px; border: 1px solid rgba(77,127,104,.2); border-radius: 20px; background: rgba(255,255,255,.67); }
  .analogy .book { display: grid; width: 54px; height: 46px; place-items: center; border-radius: 7px 3px 3px 7px; color: white; background: #4d7f68; font-size: 18px; font-weight: 900; box-shadow: inset 5px 0 rgba(255,255,255,.22); }
  .analogy span { color: #41565b; font-size: 24px; font-weight: 800; }
  .visual { position: absolute; z-index: 2; right: 70px; top: 106px; width: 650px; height: 742px; }
  .same-dna { position: absolute; z-index: 5; top: 0; left: 50%; padding: 13px 24px; border-radius: 999px; color: white; background: #223c50; font-size: 23px; font-weight: 900; transform: translateX(-50%); box-shadow: 0 14px 30px rgba(34,60,80,.18); }
  .cards { position: absolute; inset: 68px 0 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; align-items: end; }
  .card { position: relative; height: 610px; padding: 26px 16px 22px; overflow: hidden; border: 1px solid rgba(77,127,104,.15); border-radius: 30px; background: rgba(255,255,255,.64); box-shadow: 0 18px 38px rgba(34,60,80,.1); text-align: center; }
  .card h2 { margin: 4px 0 0; color: #314b51; font-size: 25px; }
  .cell-space { display: grid; height: 322px; place-items: center; }
  .nucleus { position: absolute; border: 5px solid #fffaf1; border-radius: 50%; background: #d99b3d; box-shadow: 0 0 0 3px rgba(34,60,80,.08); }
  .skin-cell { position: relative; width: 155px; height: 145px; border: 6px solid #4d7f68; border-radius: 38% 48% 42% 46%; background: #dcebdc; transform: rotate(-5deg); }
  .skin-cell .nucleus { top: 48px; left: 56px; width: 43px; height: 43px; }
  .muscle-cell { position: relative; width: 182px; height: 73px; border: 6px solid #bd755d; border-radius: 50%; background: repeating-linear-gradient(90deg, #f6d9cf 0 18px, #edc4b7 18px 25px); transform: rotate(-20deg); }
  .muscle-cell .nucleus { top: 18px; width: 25px; height: 25px; }
  .muscle-cell .n1 { left: 28px; }.muscle-cell .n2 { left: 76px; }.muscle-cell .n3 { right: 28px; }
  .nerve-cell { position: relative; width: 106px; height: 106px; border: 6px solid #4d7f68; border-radius: 50% 46% 52% 44%; background: #dcebdc; }
  .nerve-cell::before, .nerve-cell::after { content: ""; position: absolute; top: 42px; width: 112px; height: 8px; border-radius: 8px; background: #4d7f68; }
  .nerve-cell::before { right: 82px; transform: rotate(25deg); box-shadow: 4px -27px 0 -1px #4d7f68, 8px 29px 0 -1px #4d7f68; }
  .nerve-cell::after { left: 82px; width: 142px; transform: rotate(-12deg); }
  .nerve-cell .nucleus { z-index: 3; top: 29px; left: 30px; width: 42px; height: 42px; }
  .page { width: 136px; min-height: 118px; margin: 0 auto; padding: 14px 12px; border-radius: 12px; color: #50636a; background: #fffdf8; box-shadow: 0 8px 20px rgba(34,60,80,.09); font-size: 17px; font-weight: 700; line-height: 1.45; }
  .page::before { display: block; margin-bottom: 8px; color: #bd624d; content: "開くページ"; font-size: 13px; font-weight: 900; }
  .foot { position: absolute; right: 82px; bottom: 42px; color: #738078; font-size: 18px; }
`;

const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${css}</style></head><body>
  <main class="hero">
    <div class="brand"><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ</div>
    <section class="copy"><small>DNAを目で理解する 02</small><h1>同じDNAなのに、<br>なぜ違う細胞に<br>なるの？</h1><p class="question">細胞は一種類の形ではありません。<br>違いを生むのは、DNAの使い方でした。</p></section>
    <div class="analogy"><div class="book">DNA</div><span>同じ本でも、開くページが違う。</span></div>
    <section class="visual" aria-label="同じDNAを持ちながら異なる遺伝子を使う皮膚、筋肉、神経の細胞の図解">
      <div class="same-dna">どの核にも、ほぼ同じDNA</div>
      <div class="cards">
        <article class="card"><h2>皮膚の細胞</h2><div class="cell-space"><div class="skin-cell"><i class="nucleus"></i></div></div><div class="page">守るための<br>たんぱく質</div></article>
        <article class="card"><h2>骨格筋の細胞</h2><div class="cell-space"><div class="muscle-cell"><i class="nucleus n1"></i><i class="nucleus n2"></i><i class="nucleus n3"></i></div></div><div class="page">縮むための<br>たんぱく質</div></article>
        <article class="card"><h2>神経の細胞</h2><div class="cell-space"><div class="nerve-cell"><i class="nucleus"></i></div></div><div class="page">信号を伝える<br>たんぱく質</div></article>
      </div>
    </section>
    <div class="foot">※形や核の数は細胞の種類によって異なります。</div>
  </main>
</body></html>`;

const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
await page.route("https://fontlibrary.local/yu-gothic-medium.otf", (route) => route.fulfill({ path: yuGothicMediumPath, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
await page.route("https://fontlibrary.local/yu-gothic-bold.otf", (route) => route.fulfill({ path: yuGothicBoldPath, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
if (!await page.evaluate(() => document.fonts.check('32px "Karada Yu Gothic"'))) {
  throw new Error("Yu Gothic font could not be loaded.");
}
await page.screenshot({ path: path.join(output, "same-dna-different-cells.png"), type: "png" });
await browser.close();
console.log("Rendered cell and DNA article hero.");
