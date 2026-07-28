import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
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

const outputDir = path.join(root, "public", "assets", "brand", "logo-concepts");
await mkdir(outputDir, { recursive: true });

const concepts = [
  {
    id: "a",
    file: "a-hiraku-page.png",
    label: "A｜ひらくページ",
    description: "読む・理解する・対話する",
  },
  {
    id: "b",
    file: "b-voice-bookmark.png",
    label: "B｜声のしおり",
    description: "生涯学習・読書・本人の声",
  },
  {
    id: "c",
    file: "c-untangle-components.png",
    label: "C｜成分をほどく",
    description: "複雑な情報を整理して伝える",
  },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1200, height: 900 },
  deviceScaleFactor: 1,
});

for (const concept of concepts) {
  const symbol = (
    await readFile(path.join(outputDir, concept.file))
  ).toString("base64");
  await page.setContent(
    `<!doctype html>
    <html lang="ja">
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; }
          html, body { margin: 0; width: 1200px; height: 900px; }
          body {
            color: #26332d;
            background:
              radial-gradient(circle at 92% 8%, rgba(201,104,80,.12), transparent 24%),
              #f5f0e6;
            font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
          }
          main { display: grid; grid-template-columns: 460px 1fr; align-items: center; width: 100%; height: 100%; padding: 80px; gap: 82px; }
          .symbol-card { display: grid; place-items: center; width: 460px; height: 620px; border: 1px solid rgba(49,88,73,.14); border-radius: 42px; background: rgba(255,255,255,.56); box-shadow: 0 25px 80px rgba(49,88,73,.08); }
          .symbol { width: 350px; height: 350px; object-fit: contain; }
          .label { color: #c96850; font-size: 29px; font-weight: 700; letter-spacing: .08em; }
          h1 { margin: 32px 0 14px; color: #315849; font-size: 67px; line-height: 1.2; letter-spacing: -.035em; }
          .tagline { margin: 0 0 54px; color: #53645b; font-size: 30px; line-height: 1.6; }
          .description { padding-top: 28px; border-top: 1px solid rgba(49,88,73,.18); color: #6e776f; font-size: 25px; letter-spacing: .04em; }
        </style>
      </head>
      <body>
        <main>
          <div class="symbol-card"><img class="symbol" src="data:image/png;base64,${symbol}" alt=""></div>
          <section>
            <div class="label">${concept.label}</div>
            <h1>からだ成分ラボ</h1>
            <p class="tagline">健康情報を、わかる言葉に。</p>
            <p class="description">${concept.description}</p>
          </section>
        </main>
      </body>
    </html>`,
    { waitUntil: "load" },
  );
  await page.screenshot({
    path: path.join(outputDir, `${concept.id}-preview.png`),
    type: "png",
  });
}

await browser.close();
console.log(`Rendered ${concepts.length} logo previews to ${outputDir}`);
