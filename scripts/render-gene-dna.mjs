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
const output = path.join(root, "public", "assets", "articles", "idenshi-dna-atgc");
await mkdir(output, { recursive: true });

const css = `
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/yu-gothic-medium.otf") format("opentype"); font-weight: 400 600; }
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/yu-gothic-bold.otf") format("opentype"); font-weight: 700 900; }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 100%; height: 100%; }
  body { overflow: hidden; color: #223c50; background: #f8f3e9; font-family: "Karada Yu Gothic", sans-serif; }
  .hero { position: relative; width: 1440px; height: 960px; padding: 68px 82px; background: radial-gradient(circle at 88% 14%, rgba(217,155,61,.17), transparent 31%), radial-gradient(circle at 12% 88%, rgba(199,117,128,.12), transparent 28%), linear-gradient(135deg, #fbf7ef, #edf3ee); }
  .hero::after { content: ""; position: absolute; inset: 28px; border: 1px solid rgba(34,60,80,.1); border-radius: 36px; pointer-events: none; }
  .brand { position: relative; z-index: 4; display: flex; align-items: center; gap: 14px; color: #001b41; font-size: 28px; font-weight: 800; letter-spacing: .06em; }
  .brand img { width: 48px; height: 48px; object-fit: contain; }
  .copy { position: relative; z-index: 4; width: 630px; margin-top: 90px; }
  .copy small { display: block; color: #bd624d; font-size: 27px; font-weight: 900; letter-spacing: .1em; }
  h1 { margin: 24px 0 0; font-size: 67px; line-height: 1.28; letter-spacing: -.045em; }
  .lead { margin: 28px 0 0; color: #50636a; font-size: 29px; line-height: 1.72; font-weight: 600; }
  .answer { position: absolute; left: 82px; bottom: 68px; z-index: 4; display: flex; align-items: center; gap: 18px; padding: 18px 24px; border: 1px solid rgba(77,127,104,.2); border-radius: 20px; background: rgba(255,255,255,.72); }
  .answer b { display: grid; min-width: 112px; height: 48px; place-items: center; border-radius: 10px; color: white; background: #4d7f68; font-size: 20px; }
  .answer span { color: #41565b; font-size: 24px; font-weight: 800; }
  .visual { position: absolute; z-index: 2; right: 70px; top: 100px; width: 660px; height: 750px; padding: 42px 42px 36px; border: 1px solid rgba(77,127,104,.16); border-radius: 34px; background: rgba(255,255,255,.62); box-shadow: 0 20px 46px rgba(34,60,80,.11); }
  .comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .system { padding: 22px 18px; border-radius: 20px; text-align: center; }
  .system.binary { background: #f1eee7; }.system.dna { background: #eaf2e8; }
  .system small { display: block; color: #68746f; font-size: 17px; font-weight: 800; }
  .symbols { display: flex; justify-content: center; gap: 10px; margin-top: 14px; }
  .symbols i { display: grid; width: 48px; height: 52px; place-items: center; border-radius: 12px; color: white; background: #66706e; font-size: 28px; font-style: normal; font-weight: 900; }
  .dna .symbols i:nth-child(1) { background: #4d7f68; }.dna .symbols i:nth-child(2) { background: #bd755d; }.dna .symbols i:nth-child(3) { background: #d99b3d; }.dna .symbols i:nth-child(4) { background: #567a91; }
  .equals { margin: 18px 0 20px; color: #41565b; font-size: 23px; font-weight: 800; text-align: center; }
  .sequence { position: relative; padding: 54px 24px 28px; border-radius: 24px; background: #fffdf8; box-shadow: inset 0 0 0 1px rgba(34,60,80,.08); }
  .letters { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
  .letters span { display: grid; width: 48px; height: 54px; place-items: center; border-radius: 10px; color: #41565b; background: #edf1ec; font-size: 26px; font-weight: 900; }
  .letters span.gene { color: white; background: #4d7f68; }
  .brace { position: absolute; top: 18px; left: 148px; width: 304px; height: 24px; border-top: 4px solid #bd624d; border-right: 4px solid #bd624d; border-left: 4px solid #bd624d; border-radius: 12px 12px 0 0; }
  .brace strong { position: absolute; top: -18px; left: 50%; padding: 3px 12px; color: #bd624d; background: #fffdf8; font-size: 19px; transform: translateX(-50%); white-space: nowrap; }
  .caption { margin: 20px 0 0; color: #50636a; font-size: 21px; font-weight: 700; line-height: 1.65; text-align: center; }
  .codons { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 28px; }
  .codon { padding: 13px 15px; border-radius: 14px; color: #223c50; background: #f6e9df; font-size: 24px; font-weight: 900; letter-spacing: .08em; }
  .codons i { color: #bd755d; font-size: 30px; font-style: normal; }
  .codon-note { margin-top: 13px; color: #68746f; font-size: 17px; font-weight: 700; text-align: center; }
  .foot { position: absolute; right: 82px; bottom: 43px; color: #738078; font-size: 18px; }
`;

const sequence = ["A", "T", "G", "C", "C", "A", "T", "G", "G", "A", "C", "T", "A", "A", "G"];
const letters = sequence.map((letter, index) => `<span class="${index >= 3 && index <= 8 ? "gene" : ""}">${letter}</span>`).join("");
const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${css}</style></head><body>
  <main class="hero">
    <div class="brand"><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ</div>
    <section class="copy"><small>DNAを目で理解する 03</small><h1>遺伝子は、<br>DNAの英語名？</h1><p class="lead">A・T・G・Cの4文字が、<br>情報になる仕組みを考えました。</p></section>
    <div class="answer"><b>Gene</b><span>遺伝子は、DNA上の意味を持つ区間。</span></div>
    <section class="visual" aria-label="0と1のデジタルデータとA、T、G、CからなるDNAを比較し、DNA上の遺伝子の区間を示す図解">
      <div class="comparison">
        <div class="system binary"><small>デジタルデータ</small><div class="symbols"><i>0</i><i>1</i></div></div>
        <div class="system dna"><small>DNAの情報</small><div class="symbols"><i>A</i><i>T</i><i>G</i><i>C</i></div></div>
      </div>
      <div class="equals">少ない種類でも、並び順と長さで情報が増える</div>
      <div class="sequence"><div class="brace"><strong>この区間が遺伝子</strong></div><div class="letters">${letters}</div><p class="caption">DNAは長い分子。遺伝子は、その中の<br>情報として使われる区間です。</p></div>
      <div class="codons"><span class="codon">AUG</span><i>→</i><span class="codon">GAC</span><i>→</i><span class="codon">UAA</span></div>
      <div class="codon-note">たんぱく質を作るとき、mRNAは3文字ずつ読まれる</div>
    </section>
    <div class="foot">※RNAではTの代わりにUが使われます。</div>
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
await page.screenshot({ path: path.join(output, "gene-dna-four-letters.png"), type: "png" });
await browser.close();
console.log("Rendered gene and DNA article hero.");
