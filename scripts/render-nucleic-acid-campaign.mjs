import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const fontLibrary = "/Users/yoshiaki/Library/Mobile Documents/com~apple~CloudDocs/FontLibrary/SystemFont";
const mediumFont = path.join(fontLibrary, "Yu Gothic Medium.otf");
const boldFont = path.join(fontLibrary, "Yu Gothic Bold.otf");
const files = [
  "nucleic-acid-quick-guide-2026-09-08.json",
  "what-is-nucleic-acid-2026-09-10.json",
  "nucleotide-structure-2026-09-12.json",
];

let playwright;
try {
  playwright = await import("playwright");
} catch {
  if (!process.env.CODEX_WORKSPACE_NODE_MODULES) throw new Error("Playwright is required.");
  playwright = await import(pathToFileURL(path.join(process.env.CODEX_WORKSPACE_NODE_MODULES, "playwright", "index.mjs")).href);
}

const brandMark = (await readFile(path.join(root, "public", "assets", "brand", "karada-seibun-lab-mark.svg"))).toString("base64");
const escapeHtml = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const lines = (value = "") => escapeHtml(value).split("\n").map((line) => `<span>${line}</span>`).join("");

const visuals = {
  "cover-map": `<div class="visual name-map"><b>核酸</b><i>→</i><span>DNA</span><span>RNA</span><small>ヌクレオチドがつくる</small></div>`,
  "cover-question": `<div class="visual question-mark">核<small>酸</small><i>?</i></div>`,
  "cover-chain": `<div class="visual chain"><span></span><span></span><span></span><span></span><span></span></div>`,
  family: `<div class="visual family"><b>核酸</b><div><span>DNA</span><span>RNA</span></div></div>`,
  "three-parts": `<div class="visual parts"><div class="phosphate">リン酸</div><i>＋</i><div class="sugar">糖</div><i>＋</i><div class="base">塩基</div></div>`,
  roles: `<div class="visual roles"><div><small>DNA</small><b>情報を<br>保つ</b></div><div><small>RNA</small><b>使う場面で<br>働く</b></div></div>`,
  beads: `<div class="visual beads"><span>一粒</span><span>一粒</span><span>一粒</span><span>一粒</span></div>`,
};

const css = `
@font-face{font-family:Karada;src:url(https://font.local/medium.otf) format("opentype");font-weight:400 600}
@font-face{font-family:Karada;src:url(https://font.local/bold.otf) format("opentype");font-weight:700 900}
*{box-sizing:border-box}html,body{margin:0;width:1080px;height:1350px}body{overflow:hidden;background:#fbf7ef;color:#263d34;font-family:Karada,sans-serif}
.slide{position:relative;width:1080px;height:1350px;padding:62px 72px 54px;background:radial-gradient(circle at 92% 8%,rgba(223,162,129,.2),transparent 27%),radial-gradient(circle at 5% 94%,rgba(112,153,120,.18),transparent 30%),#fbf7ef}
.slide:after{content:"";position:absolute;inset:20px;border:1px solid rgba(37,59,53,.09);border-radius:34px;pointer-events:none}
header{display:flex;align-items:center;gap:14px;color:#001b41;font-size:27px;font-weight:800;letter-spacing:.06em}header img{width:48px;height:48px}.page{margin-left:auto;color:#78847d;font-size:22px}
.copy{position:relative;z-index:2;margin-top:48px}.eyebrow{color:#b85f4d;font-size:27px;font-weight:800;letter-spacing:.05em}h1{margin:18px 0 0;font-size:64px;line-height:1.22;letter-spacing:-.04em}h1 span,.body span{display:block}.body{margin:24px 0 0;color:#53645d;font-size:30px;line-height:1.62;font-weight:600}
.visual,.answer{position:absolute;z-index:1;left:76px;right:76px;bottom:150px}.visual{min-height:310px}.name-map,.family{padding:38px;border-radius:38px;background:#fff;box-shadow:0 24px 62px rgba(42,61,50,.13);text-align:center}.name-map b,.family>b{display:block;color:#fff;background:#35634d;border-radius:24px;padding:20px;font-size:42px}.name-map i{display:block;margin:12px;color:#b85f4d;font-size:42px;font-style:normal;font-weight:900}.name-map span,.family span{display:inline-grid;place-items:center;width:42%;margin:0 12px;padding:24px;border-radius:22px;background:#f1e8dd;font-size:38px;font-weight:800}.name-map small{display:block;margin-top:20px;color:#66756d;font-size:24px;font-weight:700}
.family>div{display:flex;justify-content:center;margin-top:28px}.parts{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:center;gap:18px}.parts div{display:grid;place-items:center;min-height:190px;color:#fff;font-size:32px;font-weight:900;box-shadow:0 20px 48px rgba(42,61,50,.12)}.phosphate{border-radius:50%;background:#60886d}.sugar{clip-path:polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%);background:#d59b63}.base{border-radius:28px;background:#b85f4d}.parts i{color:#8a7565;font-size:42px;font-style:normal;font-weight:900}
.roles{display:grid;grid-template-columns:1fr 1fr;gap:24px}.roles div{padding:38px;border-radius:32px;color:#fff;background:#35634d;text-align:center;box-shadow:0 22px 54px rgba(42,61,50,.16)}.roles div:last-child{background:#527b8b}.roles small{font-size:30px;font-weight:800}.roles b{display:block;margin-top:22px;font-size:38px;line-height:1.45}
.beads{display:flex;align-items:center;justify-content:center}.beads span{display:grid;place-items:center;width:190px;height:190px;margin-left:-18px;border:12px solid #fbf7ef;border-radius:50%;color:#fff;background:#548064;font-size:28px;font-weight:900;box-shadow:0 18px 40px rgba(42,61,50,.12)}.beads span:nth-child(2n){background:#c17a61}
.chain{display:flex;justify-content:center;align-items:center}.chain span{width:160px;height:160px;margin-left:-30px;border:10px solid #fbf7ef;border-radius:50%;background:#527b8b;box-shadow:0 20px 45px rgba(42,61,50,.12)}.chain span:nth-child(2n){background:#c47a62}
.question-mark{display:grid;place-items:center;width:430px;min-height:330px;margin:auto;border-radius:50%;color:#fff;background:#35634d;font-size:120px;font-weight:900;box-shadow:0 24px 60px rgba(42,61,50,.18)}.question-mark small{font-size:70px}.question-mark i{position:absolute;right:160px;top:-35px;color:#b85f4d;font-size:100px;font-style:normal}
.answer{padding:54px 46px;border-radius:40px;color:#fff;background:#35634d;box-shadow:0 28px 70px rgba(42,61,50,.2);text-align:center}.answer small{display:block;font-size:24px;font-weight:700;opacity:.82}.answer strong{display:block;margin-top:20px;font-size:43px;line-height:1.5}.answer strong span{display:block}
footer{position:absolute;left:72px;right:72px;bottom:34px;display:flex;align-items:center;gap:18px;color:#68766f;font-size:20px}footer:before{content:"";height:1px;flex:1;background:rgba(35,61,80,.18)}
`;

const browser = await playwright.chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
for (const file of files) {
  const data = JSON.parse(await readFile(path.join(root, "content", "social", file), "utf8"));
  const outputDir = path.join(root, "public", "assets", "social", "daily", data.id);
  await mkdir(outputDir, { recursive: true });
  for (const [index, slide] of data.slides.entries()) {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    await page.route("https://font.local/medium.otf", (route) => route.fulfill({ path: mediumFont, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
    await page.route("https://font.local/bold.otf", (route) => route.fulfill({ path: boldFont, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
    const visual = slide.visual === "answer" ? `<div class="answer"><small>今日の答え</small><strong>${lines(slide.body)}</strong></div>` : visuals[slide.visual];
    if (!visual) throw new Error(`Unknown visual: ${slide.visual}`);
    const body = slide.visual === "answer" ? "" : `<p class="body">${lines(slide.body)}</p>`;
    await page.setContent(`<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${css}</style></head><body><main class="slide"><header><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ<span class="page">${String(index + 1).padStart(2, "0")} / 04</span></header><section class="copy"><div class="eyebrow">${escapeHtml(slide.eyebrow)}</div><h1>${lines(slide.title)}</h1>${body}</section>${visual}<footer>続きはプロフィールのリンクから</footer></main></body></html>`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    if (!await page.evaluate(() => document.fonts.check('32px Karada'))) throw new Error("Yu Gothic font could not be loaded.");
    await page.screenshot({ path: path.join(outputDir, `${String(index + 1).padStart(2, "0")}.png`), type: "png" });
    await page.close();
  }
}
await browser.close();
console.log(`Rendered ${files.length * 4} Instagram slides.`);
