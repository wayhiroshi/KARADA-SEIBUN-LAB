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

const posts = [
  {
    file: "do-supplements-really-help-2026-08-19.json",
    illustration: "do-supplements-really-help/dining-table-support-v1.png",
    theme: "coral",
  },
  {
    file: "what-do-diet-supplements-help-2026-08-20.json",
    illustration: "what-do-diet-supplements-help/roles-at-table-v1.png",
    theme: "blue",
  },
  {
    file: "is-salacia-an-ingredient-2026-08-21.json",
    illustration: "is-salacia-an-ingredient/botanical-discovery-v1.png",
    theme: "green",
  },
];

const brandMark = (await readFile(path.join(root, "public", "assets", "brand", "karada-seibun-lab-mark.svg"))).toString("base64");
const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const lines = (value = "") => escapeHtml(value).split("\n").map((line) => `<span>${line}</span>`).join("");

const diagrams = {
  "meal-balance": `<div class="diagram balance">
    <div class="plate"><span>食べた量</span><b>だけではなく</b></div>
    <div class="arrow">→</div>
    <div class="plate emphasis"><span>食事の中身</span><b>を見る</b></div>
  </div>`,
  support: `<div class="diagram support"><div class="meal">毎日の食事</div><div class="plus">＋</div><div class="supplement">足りないところを<br><b>小さく補う</b></div></div>`,
  roles: `<div class="role-grid">
    <div><b>吸</b><span>吸収</span></div><div><b>食</b><span>食欲</span></div><div><b>代</b><span>代謝</span></div><div><b>栄</b><span>栄養補給</span></div>
  </div>`,
  labels: `<div class="label-flow"><div><small>1</small><b>目的</b><span>何を助けたい？</span></div><i>→</i><div><small>2</small><b>成分</b><span>何に関わる？</span></div><i>→</i><div><small>3</small><b>表示</b><span>役割を確かめる</span></div></div>`,
  plant: `<div class="plant-card"><div class="leaf">葉</div><div><small>成分名ではなく</small><strong>植物の仲間の名前</strong><p>いくつもの種類を含みます</p></div></div>`,
  digestion: `<div class="digestion"><div><b>糖質</b><span>ご飯・パンなど</span></div><i>→</i><div class="enzyme"><b>消化酵素</b><span>小さく分ける</span></div><i>→</i><div><b>吸収</b><span>体に取り込む</span></div></div>`,
};

const css = `
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/medium.otf") format("opentype"); font-weight: 400 600; }
  @font-face { font-family: "Karada Yu Gothic"; src: url("https://fontlibrary.local/bold.otf") format("opentype"); font-weight: 700 900; }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1080px; height: 1350px; }
  body { overflow: hidden; color: #253b35; background: #fbf7ef; font-family: "Karada Yu Gothic", sans-serif; }
  .slide { --accent:#bd624d; --deep:#345847; --wash:rgba(214,137,109,.16); position: relative; width: 1080px; height: 1350px; padding: 62px 72px 56px; background: radial-gradient(circle at 92% 7%, var(--wash), transparent 27%), radial-gradient(circle at 7% 94%, rgba(117,153,126,.14), transparent 30%), #fbf7ef; }
  .slide.blue { --accent:#527c91; --deep:#34566a; --wash:rgba(105,158,179,.16); }
  .slide.green { --accent:#62845d; --deep:#31584a; --wash:rgba(119,160,111,.18); }
  .slide::after { content:""; position:absolute; inset:20px; border:1px solid rgba(37,59,53,.09); border-radius:34px; pointer-events:none; }
  header { position:relative; z-index:6; display:flex; align-items:center; gap:14px; color:#001b41; font-size:27px; font-weight:800; letter-spacing:.06em; }
  header img { width:48px; height:48px; object-fit:contain; }
  .page { margin-left:auto; color:#78847d; font-size:22px; letter-spacing:.08em; }
  .copy { position:relative; z-index:5; margin-top:48px; }
  .eyebrow { color:var(--accent); font-size:27px; font-weight:800; letter-spacing:.05em; }
  h1 { margin:18px 0 0; color:#263d34; font-size:65px; line-height:1.21; letter-spacing:-.045em; }
  h1 span, .body span { display:block; }
  .body { margin:24px 0 0; color:#53645d; font-size:30px; line-height:1.62; font-weight:600; }
  .art { position:absolute; z-index:1; left:0; right:0; bottom:0; height:720px; background:url("https://assets.local/illustration.png") center bottom/cover no-repeat; }
  .art::before { content:""; position:absolute; inset:0; background:linear-gradient(#fbf7ef 0%,rgba(251,247,239,.1) 32%,rgba(251,247,239,0) 55%); }
  .diagram, .role-grid, .label-flow, .plant-card, .digestion, .answer-card { position:absolute; z-index:4; left:76px; right:76px; bottom:150px; }
  .balance { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:24px; }
  .plate { display:grid; place-items:center; min-height:250px; padding:30px; border-radius:50%; background:#fff; border:4px solid rgba(37,59,53,.12); box-shadow:0 24px 60px rgba(42,61,50,.12); text-align:center; }
  .plate span { font-size:29px; color:#65736c; }.plate b { font-size:36px; color:#304c40; }.plate.emphasis { border-color:var(--accent); }.arrow,.plus { color:var(--accent); font-size:58px; font-weight:900; }
  .support { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:28px; }
  .meal,.supplement { display:grid; place-items:center; min-height:230px; padding:36px; border-radius:34px; background:#fff; box-shadow:0 22px 55px rgba(42,61,50,.12); text-align:center; font-size:34px; font-weight:800; line-height:1.5; }
  .supplement { color:#fff; background:var(--deep); }.supplement b { color:#fff3cb; }
  .role-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .role-grid div { display:flex; align-items:center; gap:22px; min-height:142px; padding:24px 32px; border-radius:28px; background:#fff; box-shadow:0 18px 44px rgba(42,61,50,.1); font-size:33px; font-weight:800; }
  .role-grid b { display:grid; place-items:center; width:68px; height:68px; border-radius:50%; color:#fff; background:var(--accent); }
  .label-flow { display:grid; grid-template-columns:1fr auto 1fr auto 1fr; align-items:stretch; gap:13px; }
  .label-flow div { min-height:260px; padding:30px 18px; border-radius:28px; background:#fff; box-shadow:0 18px 45px rgba(42,61,50,.1); text-align:center; }
  .label-flow small { display:grid; place-items:center; width:42px; height:42px; margin:0 auto 19px; border-radius:50%; color:#fff; background:var(--accent); font-size:22px; font-weight:900; }
  .label-flow b { display:block; font-size:32px; }.label-flow span { display:block; margin-top:16px; color:#607069; font-size:22px; line-height:1.5; font-weight:700; }.label-flow i { align-self:center; color:var(--accent); font-size:38px; font-style:normal; font-weight:900; }
  .plant-card { display:flex; align-items:center; gap:42px; padding:44px 50px; border-radius:38px; background:#fff; box-shadow:0 24px 62px rgba(42,61,50,.13); }
  .leaf { display:grid; place-items:center; width:190px; height:190px; border-radius:72% 28% 70% 30% / 68% 32% 68% 32%; color:#fff; background:linear-gradient(145deg,#7fa673,#496f4f); transform:rotate(-10deg); font-size:46px; font-weight:900; }
  .plant-card small { display:block; color:#718078; font-size:25px; font-weight:700; }.plant-card strong { display:block; margin-top:12px; font-size:40px; }.plant-card p { margin:13px 0 0; color:#607069; font-size:25px; font-weight:600; }
  .digestion { display:grid; grid-template-columns:1fr auto 1fr auto 1fr; align-items:center; gap:14px; }
  .digestion div { display:grid; place-items:center; min-height:230px; padding:24px 15px; border-radius:32px; background:#fff; box-shadow:0 20px 50px rgba(42,61,50,.1); text-align:center; }
  .digestion .enzyme { color:#fff; background:var(--deep); }.digestion b { font-size:31px; }.digestion span { margin-top:14px; color:#66756d; font-size:21px; font-weight:700; }.digestion .enzyme span { color:#eaf2eb; }.digestion i { color:var(--accent); font-size:38px; font-style:normal; font-weight:900; }
  .answer-card { padding:55px 48px; border-radius:40px; color:#fff; background:var(--deep); box-shadow:0 28px 70px rgba(42,61,50,.2); text-align:center; }
  .answer-card small { display:block; font-size:24px; font-weight:700; opacity:.82; }.answer-card strong { display:block; margin-top:20px; font-size:44px; line-height:1.45; }
  footer { position:absolute; z-index:6; left:72px; right:72px; bottom:34px; display:flex; align-items:center; gap:18px; color:#68766f; font-size:20px; }
  footer::before { content:""; height:1px; flex:1; background:rgba(35,61,80,.18); }
`;

const browser = await playwright.chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}),
});

for (const spec of posts) {
  const data = JSON.parse(await readFile(path.join(root, "content", "social", spec.file), "utf8"));
  const illustrationPath = path.join(root, "public", "assets", "source-illustrations", spec.illustration);
  const outputDir = path.join(root, "public", "assets", "social", "daily", data.id);
  await mkdir(outputDir, { recursive: true });

  for (const [index, slide] of data.slides.entries()) {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    await page.route("https://fontlibrary.local/medium.otf", (route) => route.fulfill({ path: mediumFont, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
    await page.route("https://fontlibrary.local/bold.otf", (route) => route.fulfill({ path: boldFont, contentType: "font/otf", headers: { "access-control-allow-origin": "*" } }));
    await page.route("https://assets.local/illustration.png", (route) => route.fulfill({ path: illustrationPath, contentType: "image/png", headers: { "access-control-allow-origin": "*" } }));

    const visual = slide.visual === "cover"
      ? `<div class="art"></div>`
      : slide.visual === "answer"
        ? `<div class="answer-card"><small>一つずつ、確かめていく</small><strong>${lines(slide.body)}</strong></div>`
        : diagrams[slide.visual] || "";
    const body = slide.visual === "answer" ? "" : `<p class="body">${lines(slide.body)}</p>`;
    const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${css}</style></head><body><main class="slide ${spec.theme}">
      <header><img src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ<span class="page">${String(index + 1).padStart(2, "0")} / ${String(data.slides.length).padStart(2, "0")}</span></header>
      <section class="copy"><div class="eyebrow">${escapeHtml(slide.eyebrow)}</div><h1>${lines(slide.title)}</h1>${body}</section>
      ${visual}<footer>詳しい説明と情報源は公式サイトへ</footer>
    </main></body></html>`;
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    if (!await page.evaluate(() => document.fonts.check('32px "Karada Yu Gothic"'))) throw new Error("Yu Gothic font could not be loaded.");
    await page.screenshot({ path: path.join(outputDir, `${String(index + 1).padStart(2, "0")}.png`), type: "png" });
    await page.close();
  }
}

await browser.close();
console.log(`Rendered ${posts.length * 4} Instagram slides.`);
