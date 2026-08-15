import { mkdir, readFile, rm } from "node:fs/promises";
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
    throw new Error(
      "Playwright is required. Install it locally or set CODEX_WORKSPACE_NODE_MODULES.",
    );
  }
  playwright = await import(
    pathToFileURL(
      path.join(process.env.CODEX_WORKSPACE_NODE_MODULES, "playwright", "index.mjs"),
    ).href
  );
}
const { chromium } = playwright;

const content = JSON.parse(
  await readFile(path.join(root, "content", "social", "fixed-posts.json"), "utf8"),
);
const portrait = (
  await readFile(path.join(root, "public", "assets", "brand", "uehi-hiroshi-v2.png"))
).toString("base64");
const brandMark = (
  await readFile(path.join(root, "public", "assets", "brand", "karada-seibun-lab-mark.svg"))
).toString("base64");
const outputRoot = path.join(root, "public", "assets", "social", "fixed");

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

const escapeHtml = (value = "") =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const renderLines = (value = "") =>
  escapeHtml(value)
    .split("\n")
    .map((line) => `<span>${line}</span>`)
    .join("");

const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {}),
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await page.route("https://fontlibrary.local/yu-gothic-medium.otf", (route) =>
  route.fulfill({
    path: yuGothicMediumPath,
    contentType: "font/otf",
    headers: { "access-control-allow-origin": "*" },
  }),
);
await page.route("https://fontlibrary.local/yu-gothic-bold.otf", (route) =>
  route.fulfill({
    path: yuGothicBoldPath,
    contentType: "font/otf",
    headers: { "access-control-allow-origin": "*" },
  }),
);

for (const post of content.posts) {
  const postDir = path.join(outputRoot, post.id);
  await mkdir(postDir, { recursive: true });

  for (const [index, slide] of post.slides.entries()) {
    const points = slide.points?.length
      ? `<ul>${slide.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>`
      : "";
    const portraitMarkup = slide.portrait
      ? `<div class="portrait"><img src="data:image/png;base64,${portrait}" alt=""></div>`
      : "";
    const number = slide.number
      ? `<div class="number">${escapeHtml(slide.number)}</div>`
      : "";

    await page.setContent(
      `<!doctype html>
      <html lang="ja">
        <head>
          <meta charset="utf-8">
          <style>
            @font-face {
              font-family: "Karada Yu Gothic";
              src: url("https://fontlibrary.local/yu-gothic-medium.otf") format("opentype");
              font-style: normal;
              font-weight: 400 600;
            }
            @font-face {
              font-family: "Karada Yu Gothic";
              src: url("https://fontlibrary.local/yu-gothic-bold.otf") format("opentype");
              font-style: normal;
              font-weight: 700 900;
            }
            * { box-sizing: border-box; }
            html, body { width: 1080px; height: 1350px; margin: 0; }
            body {
              overflow: hidden;
              color: #24332b;
              background:
                radial-gradient(circle at 90% 7%, rgba(215, 171, 90, .18), transparent 26%),
                radial-gradient(circle at 10% 91%, rgba(102, 137, 111, .16), transparent 28%),
                #f7f2e8;
              font-family: "Karada Yu Gothic", sans-serif;
            }
            .canvas { position: relative; width: 100%; height: 100%; padding: 76px 76px 62px; }
            .brand { display: flex; align-items: center; gap: 16px; color: #001b41; font-size: 28px; font-weight: 700; letter-spacing: .06em; }
            .brand-mark { display: block; width: 52px; height: 52px; object-fit: contain; }
            .page { margin-left: auto; color: #6d766f; font-size: 24px; letter-spacing: .08em; }
            header { display: flex; align-items: center; }
            main { display: flex; flex-direction: column; justify-content: center; min-height: 1050px; padding: 60px 4px 30px; }
            .eyebrow { color: #607768; font-size: 31px; font-weight: 700; letter-spacing: .08em; margin-bottom: 34px; }
            h1 { margin: 0; font-size: 79px; line-height: 1.25; letter-spacing: -.035em; font-weight: 800; }
            h1 span, .body span { display: block; }
            .body { margin-top: 50px; color: #48554e; font-size: 36px; line-height: 1.75; font-weight: 500; }
            ul { list-style: none; display: grid; gap: 18px; padding: 0; margin: 42px 0 0; }
            li { position: relative; padding: 20px 26px 20px 66px; border: 2px solid rgba(74, 100, 84, .22); border-radius: 24px; background: rgba(255,255,255,.56); font-size: 31px; line-height: 1.45; font-weight: 650; }
            li::before { content: "✓"; position: absolute; left: 25px; top: 19px; color: #d9785d; font-weight: 900; }
            .number { position: absolute; top: 180px; right: 84px; color: rgba(215, 120, 93, .18); font: 900 310px/1 Georgia, serif; }
            .portrait { position: absolute; right: 72px; bottom: 90px; width: 370px; height: 370px; border-radius: 50%; overflow: hidden; border: 16px solid rgba(255,255,255,.82); box-shadow: 0 28px 70px rgba(56, 70, 60, .20); }
            .portrait img { width: 100%; height: 100%; object-fit: cover; }
            footer { position: absolute; left: 76px; right: 76px; bottom: 48px; display: flex; align-items: center; color: #6c776f; font-size: 23px; }
            footer::before { content: ""; flex: 1; height: 1px; background: rgba(65, 84, 72, .20); margin-right: 22px; }
            .accent-coral h1 { color: #ad563f; }
            .accent-green h1 { color: #3f6552; }
            .accent-gold h1 { color: #8a672a; }
            .portrait + .content { max-width: 590px; }
          </style>
        </head>
        <body class="accent-${escapeHtml(slide.accent || "default")}">
          <div class="canvas">
            <header>
              <div class="brand"><img class="brand-mark" src="data:image/svg+xml;base64,${brandMark}" alt="">からだ成分ラボ</div>
              <div class="page">${index + 1} / ${post.slides.length}</div>
            </header>
            ${number}
            ${portraitMarkup}
            <main class="content">
              <div class="eyebrow">${escapeHtml(slide.eyebrow)}</div>
              <h1>${renderLines(slide.title)}</h1>
              ${slide.body ? `<div class="body">${renderLines(slide.body)}</div>` : ""}
              ${points}
            </main>
            <footer>植井寛｜@karada_seibun_lab</footer>
          </div>
        </body>
      </html>`,
      { waitUntil: "load" },
    );

    await page.evaluate(() => document.fonts.ready);
    const fontLoaded = await page.evaluate(() => document.fonts.check('36px "Karada Yu Gothic"'));
    if (!fontLoaded) {
      throw new Error("Yu Gothic font could not be loaded from the local FontLibrary.");
    }

    const filename = `${String(index + 1).padStart(2, "0")}.png`;
    await page.screenshot({ path: path.join(postDir, filename), type: "png" });
  }
}

await browser.close();
console.log(
  `Rendered ${content.posts.reduce((sum, post) => sum + post.slides.length, 0)} slides to ${outputRoot}`,
);
