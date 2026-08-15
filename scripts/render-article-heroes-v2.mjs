import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const fontRoot = "/Users/yoshiaki/Library/Mobile Documents/com~apple~CloudDocs/FontLibrary/SystemFont";
const mediumFont = path.join(fontRoot, "Yu Gothic Medium.otf");
const boldFont = path.join(fontRoot, "Yu Gothic Bold.otf");

let playwright;
try {
  playwright = await import("playwright");
} catch {
  if (!process.env.CODEX_WORKSPACE_NODE_MODULES) throw new Error("Playwright is required.");
  playwright = await import(pathToFileURL(path.join(process.env.CODEX_WORKSPACE_NODE_MODULES, "playwright", "index.mjs")).href);
}

const brandMark = (await readFile(path.join(root, "public", "assets", "brand", "karada-seibun-lab-mark.svg"))).toString("base64");
const items = [
  {
    slug: "kakusan-toha",
    eyebrow: "核酸の基礎",
    title: "核酸とは、\n何のこと？",
    lead: "DNAとRNAをまとめた、\n大きな仲間の名前です。",
    answer: "DNAもRNAも、核酸です。",
    note: "二つの位置関係を、一枚で整理します。",
    source: "public/assets/source-illustrations/article-heroes/nucleic-acid-family-v2.png",
    alt: "DNAの二重らせんと一本鎖のRNAを同じ枠に置き、どちらも核酸の仲間であることを示す水彩図",
  },
  {
    slug: "dna-rna-nucleotide",
    eyebrow: "核酸の基礎",
    title: "DNAとRNAは、\n何が違うの？",
    lead: "同じ材料からできていても、\n形と役割が違います。",
    answer: "DNAは保管、RNAは多様な仕事。",
    note: "材料・形・役割の順で比べます。",
    source: "public/assets/articles/dna-rna-nucleotide/dna-rna-nucleotide.webp",
    alt: "ヌクレオチドから一本鎖のRNAと二本鎖のDNAができる関係を示す水彩図",
  },
  {
    slug: "kenko-shokuhin-koukoku",
    eyebrow: "成分と表示の読み方",
    title: "健康食品は、\n何を見て選べばいい？",
    lead: "目立つ言葉より先に、\n確かめる順番があります。",
    answer: "商品・区分・研究・数字・注意。",
    note: "自分で確認できる表示から読み始めます。",
    source: "public/assets/articles/kenko-shokuhin-koukoku/health-food-check.webp",
    alt: "健康食品の無地のパッケージを手に取り、ノートと計算機で表示を確かめる女性の水彩画",
  },
  {
    slug: "kakusan-kenkyu-no-yomikata",
    eyebrow: "研究の読み方",
    title: "研究があることと、\n製品の効果は同じ？",
    lead: "何を調べた研究なのかを、\n最初に確かめます。",
    answer: "同じではありません。",
    note: "対象・方法・原料と量を照らし合わせます。",
    source: "public/assets/articles/kakusan-kenkyu-no-yomikata/research-reading.webp",
    alt: "細胞、動物、人を対象にした研究資料を見比べ、研究段階を確かめる女性の水彩画",
  },
];

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const lines = (value) => escapeHtml(value).split("\n").join("<br>");
const css = `
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/medium.otf") format("opentype"); font-weight: 400 600; }
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/bold.otf") format("opentype"); font-weight: 700 900; }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 100%; height: 100%; }
  body { overflow: hidden; color: #223c50; background: #f8f3e9; font-family: "Karada Yu Gothic", sans-serif; }
  .hero { position: relative; width: 1440px; height: 960px; padding: 68px 82px; background: radial-gradient(circle at 88% 14%, rgba(217,155,61,.17), transparent 31%), radial-gradient(circle at 12% 88%, rgba(77,127,104,.13), transparent 28%), linear-gradient(135deg, #fbf7ef, #edf3ee); }
  .hero::after { content: ""; position: absolute; inset: 28px; border: 1px solid rgba(34,60,80,.1); border-radius: 36px; }
  .brand { position: relative; z-index: 4; display: flex; align-items: center; gap: 14px; color: #001b41; font-size: 28px; font-weight: 800; letter-spacing: .06em; }
  .brand img { width: 48px; height: 48px; object-fit: contain; }
  .copy { position: relative; z-index: 4; width: 650px; margin-top: 92px; }
  .copy small { display: block; color: #bd624d; font-size: 27px; font-weight: 900; letter-spacing: .08em; }
  h1 { margin: 24px 0 0; font-size: 62px; line-height: 1.28; letter-spacing: -.045em; }
  .lead { margin: 28px 0 0; color: #50636a; font-size: 29px; line-height: 1.7; font-weight: 600; }
  .answer { display: inline-block; margin-top: 30px; padding: 17px 23px; border-radius: 18px; color: #fff; background: #bd624d; font-size: 24px; font-weight: 900; }
  .visual { position: absolute; z-index: 2; right: 72px; top: 116px; width: 620px; height: 650px; margin: 0; overflow: hidden; border: 8px solid rgba(255,255,255,.92); border-radius: 36px; background: #fffdf8; box-shadow: 0 20px 46px rgba(34,60,80,.14); }
  .visual img { width: 100%; height: 100%; object-fit: cover; object-position: center; }
  .note { position: absolute; z-index: 4; left: 82px; bottom: 68px; color: #60716b; font-size: 20px; font-weight: 700; }
`;

const browser = await playwright.chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}),
});

for (const item of items) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
  await page.route("https://fontlibrary.local/medium.otf", (route) => route.fulfill({ path: mediumFont, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
  await page.route("https://fontlibrary.local/bold.otf", (route) => route.fulfill({ path: boldFont, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
  await page.route("https://assets.local/illustration", (route) => route.fulfill({ path: path.join(root, item.source), headers: { "access-control-allow-origin": "*" } }));
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${css}</style></head><body><main class="hero">
    <div class="brand"><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ</div>
    <section class="copy"><small>${escapeHtml(item.eyebrow)}</small><h1>${lines(item.title)}</h1><p class="lead">${lines(item.lead)}</p><div class="answer">${escapeHtml(item.answer)}</div></section>
    <figure class="visual"><img src="https://assets.local/illustration" alt="${escapeHtml(item.alt)}"></figure>
    <div class="note">${escapeHtml(item.note)}</div>
  </main></body></html>`;
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  if (!await page.evaluate(() => document.fonts.check('32px "Karada Yu Gothic"'))) throw new Error("Yu Gothic font could not be loaded.");
  await page.evaluate(() => window.scrollTo(0, 0));
  const layout = await page.evaluate(() => ({
    brand: document.querySelector(".brand").getBoundingClientRect().toJSON(),
    visual: document.querySelector(".visual").getBoundingClientRect().toJSON(),
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  }));
  if (layout.brand.x < 0 || layout.brand.y < 0 || layout.visual.x < 0 || layout.visual.y < 0 || layout.scrollX || layout.scrollY) {
    throw new Error(`Hero layout escaped the viewport for ${item.slug}: ${JSON.stringify(layout)}`);
  }
  const output = path.join(root, "public", "assets", "articles", item.slug, `${item.slug}-hero-v2.png`);
  await mkdir(path.dirname(output), { recursive: true });
  await page.screenshot({ path: output, type: "png" });
  await page.close();
}

await browser.close();
console.log(`Rendered ${items.length} article hero images.`);
