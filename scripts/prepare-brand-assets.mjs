import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "logo.svg");
const outputDir = path.join(root, "public", "assets", "brand");
const fullSvgPath = path.join(outputDir, "karada-seibun-lab-logo.svg");
const markSvgPath = path.join(outputDir, "karada-seibun-lab-mark.svg");
const faviconPath = path.join(root, "public", "favicon.svg");

const source = await readFile(sourcePath, "utf8");
const defs = source.match(/<defs>[\s\S]*?<\/defs>/u)?.[0];
const markGroup = source.match(/<g>[\s\S]*?<\/g>/u)?.[0];

if (!defs || !markGroup) {
  throw new Error("logo.svgからシンボルを抽出できませんでした。SVG構造を確認してください。");
}

const markSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="150 0 1050 1050" role="img" aria-labelledby="title">
  <title id="title">からだ成分ラボ</title>
  ${defs}
  ${markGroup}
</svg>
`;

await mkdir(outputDir, { recursive: true });
await writeFile(fullSvgPath, source, "utf8");
await writeFile(markSvgPath, markSvg, "utf8");
await writeFile(faviconPath, markSvg, "utf8");

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

const fullSvgData = Buffer.from(source).toString("base64");
const markSvgData = Buffer.from(markSvg).toString("base64");
const browser = await playwright.chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1200, height: 1468 },
  deviceScaleFactor: 1,
});

await page.setContent(
  `<style>
    * { box-sizing: border-box; }
    html, body { width: 1200px; height: 1468px; margin: 0; background: transparent; }
    img { display: block; width: 1200px; height: 1468px; object-fit: contain; }
  </style>
  <img src="data:image/svg+xml;base64,${fullSvgData}" alt="">`,
  { waitUntil: "load" },
);
await page.screenshot({
  path: path.join(outputDir, "karada-seibun-lab-logo-1200.png"),
  omitBackground: true,
});

await page.setViewportSize({ width: 1024, height: 1024 });
await page.setContent(
  `<style>
    * { box-sizing: border-box; }
    html, body { width: 1024px; height: 1024px; margin: 0; background: #fff; }
    body { display: grid; place-items: center; padding: 92px; }
    img { display: block; width: 100%; height: 100%; object-fit: contain; }
  </style>
  <img src="data:image/svg+xml;base64,${markSvgData}" alt="">`,
  { waitUntil: "load" },
);
await page.screenshot({
  path: path.join(outputDir, "karada-seibun-lab-avatar-1024.png"),
});

await browser.close();
console.log(`Prepared brand assets from ${sourcePath}`);
