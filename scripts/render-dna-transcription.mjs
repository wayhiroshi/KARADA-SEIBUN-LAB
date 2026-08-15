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
  await readFile(path.join(root, "content", "social", "dna-transcription-2026-08-10.json"), "utf8"),
);
const brandMark = (
  await readFile(path.join(root, "public", "assets", "brand", "karada-seibun-lab-mark.svg"))
).toString("base64");

const articleOutput = path.join(root, "public", "assets", "articles", "dna-mrna-transcription");
const socialOutput = path.join(root, "public", "assets", "social", "daily", data.id);
await mkdir(articleOutput, { recursive: true });
await mkdir(socialOutput, { recursive: true });

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const renderLines = (value = "") => escapeHtml(value)
  .split("\n")
  .map((line) => `<span>${line}</span>`)
  .join("");

const bookMemoVisual = `
  <div class="book-memo">
    <div class="book-wrap"><small>核の中に保管</small><div class="book"><i></i><b>DNA</b><span>大切な原本</span></div></div>
    <div class="copy-arrow"><span>必要なページを写す</span><b>→</b></div>
    <div class="memo"><i></i><b>mRNA</b><span>運べるメモ</span></div>
  </div>`;

const originalVisual = `
  <div class="single-object"><small>細胞の中の図書室</small><div class="large-book"><i></i><b>DNA</b><span>情報をしまっておく原本</span></div></div>`;

const memoVisual = `
  <div class="memo-route"><div class="small-book"><b>DNA</b></div><div class="page-copy"><i></i><i></i><i></i><span>必要なページ</span></div><b class="route-arrow">→</b><div class="large-memo"><i></i><b>mRNA</b><span>作業場所へ</span></div></div>`;

const recipeVisual = `
  <div class="recipe-pair"><div class="recipe-book"><small>図書室</small><b>料理全集</b><span>DNA</span></div><div class="recipe-arrow">→</div><div class="recipe-note"><small>今日使う</small><b>一品のレシピ</b><span>mRNA</span></div></div>`;

const simpleEndVisual = `
  <div class="simple-end"><div class="end-book"><b>DNA</b><span>原本</span></div><strong>→</strong><div class="end-memo"><b>mRNA</b><span>運ぶメモ</span></div></div>`;

const dnaDiagram = (compact = false) => `
  <div class="dna-diagram ${compact ? "compact" : ""}">
    <div class="promoter-tag">プロモーター</div>
    <div class="dna-strand top"><i>A</i><i>T</i><i>G</i><i>C</i><i>C</i><i>A</i><i>T</i><i>G</i></div>
    <div class="dna-strand bottom"><i>T</i><i>A</i><i>C</i><i>G</i><i>G</i><i>T</i><i>A</i><i>C</i></div>
    <div class="polymerase">RNA<br>ポリメラーゼ</div>
    <div class="rna-line"><i>U</i><i>A</i><i>C</i><i>G</i><i>G</i><i>U</i></div>
    <div class="rna-label">mRNA</div>
  </div>`;

const learningVisual = `
  <div class="learning-grid">
    <div class="learning-card good"><small>ここは合っていた</small><strong>m ＝ messenger</strong><p>DNAの情報を<br>作業場所へ運ぶ</p></div>
    <div class="learning-card clarify"><small>ここを分ける</small><strong>転写 ≠ 翻訳</strong><p>始まりの合図は<br>工程ごとに違う</p></div>
  </div>`;

const twoStartsVisual = `
  <div class="starts-grid">
    <div class="start-card transcription"><small>DNA上の入口</small><strong>プロモーター</strong><div class="mini-flow"><b>DNA</b><i>→</i><b>mRNA</b></div><p>転写を始める</p></div>
    <div class="start-card translation"><small>mRNA上の入口</small><strong>開始コドン</strong><div class="mini-flow"><b>mRNA</b><i>→</i><b>たんぱく質</b></div><p>翻訳を始める</p></div>
  </div>`;

const lifecycleVisual = `
  <div class="lifecycle">
    <div class="message-line"><i>A</i><i>U</i><i>G</i><i>G</i><i>C</i><i>U</i><i>A</i><i>A</i></div>
    <div class="ribosomes"><b>リボソーム</b><b>リボソーム</b><b>リボソーム</b></div>
    <div class="protein-lines"><i></i><i></i><i></i></div>
    <div class="life-arrow"><span>何度も読まれる</span><em>→</em><span>最後は分解</span></div>
  </div>`;

const visualFor = (name) => ({
  cover: `<div class="cover-visual">${bookMemoVisual}</div>`,
  original: originalVisual,
  memo: memoVisual,
  recipe: recipeVisual,
  "simple-end": simpleEndVisual,
  learning: learningVisual,
  transcription: `<div class="transcription-visual">${dnaDiagram()}</div>`,
  "two-starts": twoStartsVisual,
  lifecycle: lifecycleVisual,
}[name] ?? "");

const sharedCss = `
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/yu-gothic-medium.otf") format("opentype"); font-weight: 400 600; }
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/yu-gothic-bold.otf") format("opentype"); font-weight: 700 900; }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 100%; height: 100%; }
  body { overflow: hidden; color: #223c50; background: #f8f3e9; font-family: "Karada Yu Gothic", sans-serif; }
  .brand { display: flex; align-items: center; gap: 14px; color: #001b41; font-weight: 800; letter-spacing: .06em; }
  .brand img { width: 48px; height: 48px; object-fit: contain; }
  .dna-diagram { position: relative; height: 100%; min-height: 480px; }
  .dna-strand { position: absolute; left: 34px; right: 34px; display: flex; justify-content: space-between; }
  .dna-strand.top { top: 150px; }.dna-strand.bottom { top: 253px; }
  .dna-strand::before { content: ""; position: absolute; left: -20px; right: -20px; top: 50%; height: 8px; border-radius: 8px; background: #567a91; z-index: 0; }
  .dna-strand.bottom::before { background: #bd755d; }
  .dna-strand i { position: relative; z-index: 2; display: grid; width: 55px; height: 55px; place-items: center; border-radius: 14px; color: white; background: #4d7f68; font-size: 25px; font-style: normal; font-weight: 900; box-shadow: 0 7px 15px rgba(34,60,80,.1); }
  .dna-strand i:nth-child(2n) { background: #d99b3d; }
  .promoter-tag { position: absolute; top: 55px; left: 42px; padding: 11px 18px; border: 3px solid #bd624d; border-radius: 16px; color: #bd624d; background: #fffaf4; font-size: 21px; font-weight: 900; }
  .promoter-tag::after { content: ""; position: absolute; left: 50%; top: 100%; width: 3px; height: 62px; background: #bd624d; }
  .polymerase { position: absolute; z-index: 5; top: 164px; left: 46%; display: grid; width: 142px; height: 125px; place-items: center; border-radius: 46% 54% 50% 45%; color: white; background: #223c50; font-size: 17px; font-weight: 900; line-height: 1.35; text-align: center; transform: translateX(-50%); box-shadow: 0 16px 30px rgba(34,60,80,.2); }
  .rna-line { position: absolute; top: 350px; left: 27%; display: flex; gap: 8px; transform: rotate(5deg); }
  .rna-line::before { content: ""; position: absolute; left: -12px; right: -12px; top: 50%; height: 7px; border-radius: 7px; background: #4d7f68; }
  .rna-line i { position: relative; z-index: 2; display: grid; width: 49px; height: 49px; place-items: center; border-radius: 50%; color: #223c50; background: #e4efe3; font-size: 22px; font-style: normal; font-weight: 900; border: 3px solid #4d7f68; }
  .rna-label { position: absolute; top: 422px; right: 54px; color: #4d7f68; font-size: 25px; font-weight: 900; }
  .learning-grid, .starts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; height: 100%; align-items: center; }
  .learning-card, .start-card { padding: 38px 25px; border-radius: 30px; background: rgba(255,255,255,.68); border: 2px solid rgba(77,127,104,.14); text-align: center; box-shadow: 0 18px 40px rgba(34,60,80,.1); }
  .learning-card small, .start-card small { display: block; color: #bd624d; font-size: 21px; font-weight: 900; }
  .learning-card strong, .start-card strong { display: block; margin-top: 18px; color: #223c50; font-size: 34px; }
  .learning-card p, .start-card p { margin: 18px 0 0; color: #50636a; font-size: 25px; font-weight: 700; line-height: 1.55; }
  .learning-card.good { background: #eef5ec; }.learning-card.clarify { background: #fbeee8; }
  .mini-flow { display: flex; align-items: center; justify-content: center; gap: 15px; margin-top: 28px; }
  .mini-flow b { padding: 13px 17px; border-radius: 13px; color: white; background: #4d7f68; font-size: 23px; }
  .mini-flow i { color: #bd755d; font-size: 34px; font-style: normal; }
  .translation .mini-flow b { background: #567a91; }
  .lifecycle { position: relative; height: 100%; padding-top: 100px; }
  .message-line { position: relative; display: flex; justify-content: center; gap: 12px; }
  .message-line::before { content: ""; position: absolute; left: 60px; right: 60px; top: 50%; height: 8px; border-radius: 8px; background: #4d7f68; }
  .message-line i { position: relative; z-index: 2; display: grid; width: 62px; height: 62px; place-items: center; border: 4px solid #4d7f68; border-radius: 50%; color: #223c50; background: #edf5eb; font-size: 27px; font-style: normal; font-weight: 900; }
  .ribosomes { display: flex; justify-content: center; gap: 68px; margin-top: -7px; }
  .ribosomes b { display: grid; width: 155px; height: 92px; place-items: center; border-radius: 50% 50% 42% 42%; color: white; background: #223c50; font-size: 18px; text-align: center; box-shadow: 0 13px 28px rgba(34,60,80,.18); }
  .protein-lines { display: flex; justify-content: center; gap: 178px; }
  .protein-lines i { width: 8px; height: 105px; background: repeating-linear-gradient(#d99b3d 0 10px, #bd755d 10px 20px); border-radius: 8px; }
  .life-arrow { display: flex; align-items: center; justify-content: center; gap: 22px; margin-top: 30px; font-size: 25px; font-weight: 900; }
  .life-arrow span { padding: 13px 20px; border-radius: 16px; background: rgba(255,255,255,.7); }
  .life-arrow em { color: #bd624d; font-size: 38px; font-style: normal; }
  .book-memo { display: grid; grid-template-columns: 1fr 120px 1fr; align-items: center; gap: 8px; height: 100%; }
  .book-wrap { text-align: center; }
  .book-wrap > small { display: inline-block; margin-bottom: 22px; padding: 9px 16px; border-radius: 999px; color: #4d7f68; background: #e5efe4; font-size: 20px; font-weight: 800; }
  .book, .large-book { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 250px; height: 310px; margin: auto; border-radius: 12px 28px 28px 12px; color: white; background: #223c50; box-shadow: inset 18px 0 rgba(255,255,255,.1), 0 20px 35px rgba(34,60,80,.18); }
  .book::after, .large-book::after { content: ""; position: absolute; right: -9px; top: 22px; bottom: 22px; width: 18px; border-radius: 0 9px 9px 0; background: #e8dfc9; }
  .book b, .large-book b { font-size: 48px; }.book span, .large-book span { margin-top: 16px; font-size: 22px; font-weight: 800; }
  .copy-arrow { text-align: center; color: #bd624d; font-weight: 900; }.copy-arrow span { display: block; font-size: 19px; line-height: 1.45; }.copy-arrow b { display: block; margin-top: 12px; font-size: 54px; }
  .memo, .large-memo { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 230px; height: 285px; margin: auto; border: 3px solid #4d7f68; border-radius: 10px; color: #223c50; background: repeating-linear-gradient(#fffaf2 0 38px, #dbe8df 39px 41px); box-shadow: 0 20px 35px rgba(34,60,80,.13); transform: rotate(2deg); }
  .memo::before, .large-memo::before { content: ""; position: absolute; left: 18px; top: 0; bottom: 0; width: 2px; background: #d79586; }
  .memo b, .large-memo b { padding: 8px 14px; background: rgba(255,250,242,.86); font-size: 42px; }.memo span, .large-memo span { margin-top: 14px; padding: 6px 12px; background: rgba(255,250,242,.86); font-size: 21px; font-weight: 800; }
  .single-object { display: grid; place-items: center; height: 100%; }.single-object > small { color: #4d7f68; font-size: 22px; font-weight: 900; }.large-book { width: 330px; height: 390px; }.large-book b { font-size: 58px; }
  .memo-route { display: flex; align-items: center; justify-content: center; gap: 24px; height: 100%; }.small-book { display: grid; width: 165px; height: 220px; place-items: center; border-radius: 8px 22px 22px 8px; color: white; background: #223c50; font-size: 36px; box-shadow: inset 14px 0 rgba(255,255,255,.1); }.page-copy { position: relative; width: 190px; height: 240px; padding: 45px 25px; border: 2px dashed #bd755d; background: #fffaf2; transform: rotate(-3deg); }.page-copy i { display: block; height: 7px; margin: 17px 0; border-radius: 7px; background: #bdc9c0; }.page-copy span { color: #bd624d; font-size: 19px; font-weight: 900; }.route-arrow { color: #bd624d; font-size: 48px; }.large-memo { width: 220px; height: 280px; }
  .recipe-pair { display: grid; grid-template-columns: 1fr 70px 1fr; align-items: center; gap: 20px; height: 100%; }.recipe-book, .recipe-note { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 350px; border-radius: 22px; text-align: center; }.recipe-book { color: white; background: #223c50; box-shadow: inset 18px 0 rgba(255,255,255,.1); }.recipe-note { border: 3px solid #4d7f68; color: #223c50; background: repeating-linear-gradient(#fffaf2 0 43px, #dbe8df 44px 46px); transform: rotate(2deg); }.recipe-pair small { font-size: 21px; font-weight: 800; }.recipe-pair b { margin-top: 24px; font-size: 35px; }.recipe-pair span { margin-top: 28px; padding: 8px 18px; border-radius: 999px; background: rgba(255,255,255,.78); color: #4d7f68; font-size: 24px; font-weight: 900; }.recipe-arrow { color: #bd624d; font-size: 52px; font-weight: 900; text-align: center; }
  .simple-end { display: flex; align-items: center; justify-content: center; gap: 40px; height: 100%; }.simple-end > div { display: grid; width: 260px; height: 260px; place-items: center; align-content: center; gap: 15px; border-radius: 28px; }.end-book { color: white; background: #223c50; }.end-memo { border: 3px solid #4d7f68; background: #fffaf2; }.simple-end b { font-size: 48px; }.simple-end span { font-size: 24px; font-weight: 800; }.simple-end > strong { color: #bd624d; font-size: 60px; }
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
  .body { margin-top: 28px; color: #4d5e65; font-size: 30px; line-height: 1.62; font-weight: 600; }
  .visual { position: absolute; left: 72px; right: 72px; bottom: 88px; height: 590px; }
  footer { position: absolute; left: 72px; right: 72px; bottom: 38px; display: flex; align-items: center; gap: 18px; color: #69766f; font-size: 21px; }
  footer::before { content: ""; height: 1px; flex: 1; background: rgba(34,60,80,.18); }
  .cover-visual, .transcription-visual { height: 100%; padding: 20px 30px 0; border-radius: 32px; background: rgba(255,255,255,.52); border: 2px solid rgba(77,127,104,.12); }
`;

const articleCss = `
  ${sharedCss}
  .hero { position: relative; width: 1440px; height: 960px; padding: 68px 82px; background: radial-gradient(circle at 86% 12%, rgba(217,155,61,.17), transparent 31%), radial-gradient(circle at 12% 88%, rgba(199,117,128,.12), transparent 28%), linear-gradient(135deg, #fbf7ef, #edf3ee); }
  .hero::after { content: ""; position: absolute; inset: 28px; border: 1px solid rgba(34,60,80,.1); border-radius: 36px; pointer-events: none; }
  .brand { position: relative; z-index: 4; font-size: 28px; }
  .copy { position: relative; z-index: 4; width: 600px; margin-top: 92px; }
  .copy small { display: block; color: #bd624d; font-size: 27px; font-weight: 900; letter-spacing: .1em; }
  h1 { margin: 24px 0 0; font-size: 67px; line-height: 1.28; letter-spacing: -.045em; }
  .lead { margin: 28px 0 0; color: #50636a; font-size: 29px; line-height: 1.72; font-weight: 600; }
  .answer { position: absolute; left: 82px; bottom: 68px; z-index: 4; padding: 18px 24px; border: 1px solid rgba(77,127,104,.2); border-radius: 20px; background: rgba(255,255,255,.72); color: #41565b; font-size: 24px; font-weight: 800; }
  .answer b { color: #4d7f68; }
  .hero-visual { position: absolute; z-index: 2; right: 70px; top: 100px; width: 675px; height: 748px; padding: 30px 38px 22px; border: 1px solid rgba(77,127,104,.16); border-radius: 34px; background: rgba(255,255,255,.62); box-shadow: 0 20px 46px rgba(34,60,80,.11); }
  .difference { position: absolute; left: 38px; right: 38px; bottom: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .difference div { padding: 14px; border-radius: 16px; text-align: center; font-size: 18px; font-weight: 800; background: #eef5ec; }
  .difference div:last-child { background: #fbeee8; }
  .difference strong { display: block; margin-top: 3px; color: #223c50; font-size: 22px; }
  .hero-visual .dna-diagram { min-height: 560px; }
  .hero-visual .dna-strand.top { top: 140px; }.hero-visual .dna-strand.bottom { top: 235px; }
  .hero-visual .polymerase { top: 151px; }.hero-visual .rna-line { top: 330px; }.hero-visual .rna-label { top: 398px; }
  .hero-visual .book-memo { grid-template-columns: 1fr 95px 1fr; }
  .hero-visual .book { width: 205px; height: 270px; }
  .hero-visual .memo { width: 190px; height: 245px; }
  .hero-visual .book-wrap > small { margin-bottom: 26px; }
`;

const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {}),
});

const renderPage = async ({ html, output, width, height }) => {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.route("https://fontlibrary.local/yu-gothic-medium.otf", (route) => route.fulfill({ path: yuGothicMediumPath, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
  await page.route("https://fontlibrary.local/yu-gothic-bold.otf", (route) => route.fulfill({ path: yuGothicBoldPath, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  if (!await page.evaluate(() => document.fonts.check('32px "Karada Yu Gothic"'))) {
    throw new Error("Yu Gothic font could not be loaded.");
  }
  await page.screenshot({ path: output, type: "png" });
  await page.close();
};

const articleHtml = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${articleCss}</style></head><body>
  <main class="hero">
    <div class="brand"><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ</div>
    <section class="copy"><small>DNAを目で理解する 04</small><h1>mRNAって、<br>何だろう？</h1><p class="lead">DNAを「大切な本」、<br>mRNAを「運べるメモ」と<br>考えてみます。</p></section>
    <div class="answer"><b>今日の一歩</b>　役割だけを一枚の絵にする。</div>
    <section class="hero-visual" aria-label="核の中に保管されたDNAの本から必要なページをmRNAのメモへ写し、細胞内の作業場所へ運ぶイメージ図">
      ${bookMemoVisual}
    </section>
  </main>
</body></html>`;

await renderPage({
  html: articleHtml,
  output: path.join(articleOutput, "dna-mrna-transcription.png"),
  width: 1440,
  height: 960,
});

for (const [index, slide] of data.slides.entries()) {
  const slideHtml = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${socialCss}</style></head><body>
    <main class="slide">
      <header class="brand"><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ<span class="page">${String(index + 1).padStart(2, "0")} / ${String(data.slides.length).padStart(2, "0")}</span></header>
      <section class="copy"><div class="eyebrow">${escapeHtml(slide.eyebrow)}</div><h1>${renderLines(slide.title)}</h1>${slide.body ? `<p class="body">${renderLines(slide.body)}</p>` : ""}</section>
      <section class="visual">${visualFor(slide.visual)}</section>
      <footer>詳しい説明と情報源は公式サイトへ</footer>
    </main>
  </body></html>`;
  await renderPage({
    html: slideHtml,
    output: path.join(socialOutput, `${String(index + 1).padStart(2, "0")}.png`),
    width: 1080,
    height: 1350,
  });
}

await browser.close();
console.log(`Rendered transcription article hero and ${data.slides.length} social slides.`);
