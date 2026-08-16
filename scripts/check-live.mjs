import path from "node:path";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const defaultBaseUrl = "https://karada-seibun-lab.way-hiroshi-66.workers.dev";
const baseUrl = (process.env.LIVE_SITE_URL || defaultBaseUrl).replace(/\/$/u, "");
const root = path.resolve(import.meta.dirname, "..");
const site = JSON.parse(await readFile(path.join(root, "content", "site.json"), "utf8"));
const expectedMeasurementId = site.analytics?.measurementId || "";

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

const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`);
if (!sitemapResponse.ok) {
  throw new Error(`Sitemap returned HTTP ${sitemapResponse.status}`);
}

const sitemap = await sitemapResponse.text();
const baseOrigin = new URL(baseUrl).origin;
const pageUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)]
  .map((match) => new URL(new URL(match[1]).pathname, `${baseUrl}/`).toString())
  .filter((url) => !/\.(?:avif|gif|jpe?g|png|svg|webp)$/iu.test(new URL(url).pathname));

const browser = await playwright.chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {}),
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });

// The audit should not add synthetic visits to analytics reports.
await context.route(/google-analytics\.com|googletagmanager\.com|doubleclick\.net/iu, (route) => route.abort());

const page = await context.newPage();
const results = [];

for (const url of pageUrls) {
  const firstPartyFailures = [];
  const requestFailureListener = (request) => {
    if (new URL(request.url()).origin === baseOrigin) {
      firstPartyFailures.push({
        url: request.url(),
        error: request.failure()?.errorText || "request failed",
      });
    }
  };
  page.on("requestfailed", requestFailureListener);

  let status = 0;
  let navigationError = "";
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
    status = response?.status() || 0;
    await page.waitForTimeout(200);
  } catch (error) {
    navigationError = error instanceof Error ? error.message : String(error);
  }

  const metrics = navigationError
    ? {}
    : await page.evaluate((measurementId) => ({
        h1Count: document.querySelectorAll("h1").length,
        viewportWidth: document.documentElement.clientWidth,
        documentWidth: document.documentElement.scrollWidth,
        analyticsConfigured:
          !measurementId || [...document.scripts].some((script) => `${script.src}\n${script.textContent}`.includes(measurementId)),
        distortedImages: [...document.images].flatMap((image) => {
          const rendered = image.getBoundingClientRect();
          const sourceWidth = image.naturalWidth || Number(image.getAttribute("width"));
          const sourceHeight = image.naturalHeight || Number(image.getAttribute("height"));
          if (!rendered.width || !rendered.height || !sourceWidth || !sourceHeight || getComputedStyle(image).objectFit !== "fill") {
            return [];
          }
          const sourceRatio = sourceWidth / sourceHeight;
          const renderedRatio = rendered.width / rendered.height;
          return Math.abs(sourceRatio - renderedRatio) / sourceRatio > 0.02
            ? [{ src: image.currentSrc || image.src, sourceRatio, renderedRatio }]
            : [];
        }),
        brokenImages: [...document.images]
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.currentSrc || image.src),
      }), expectedMeasurementId);

  page.off("requestfailed", requestFailureListener);
  results.push({ url, status, navigationError, firstPartyFailures, ...metrics });
}

await browser.close();

const issues = results.filter(
  (result) =>
    result.status !== 200 ||
    result.navigationError ||
    result.h1Count !== 1 ||
    result.documentWidth > result.viewportWidth ||
    !result.analyticsConfigured ||
    result.distortedImages?.length ||
    result.brokenImages?.length ||
    result.firstPartyFailures.length
);

console.log(`Live mobile audit: ${results.length} pages checked at 390x844`);
for (const result of results) {
  const overflow = Math.max(0, (result.documentWidth || 0) - (result.viewportWidth || 0));
  console.log(
    `${issues.includes(result) ? "FAIL" : "PASS"} ${new URL(result.url).pathname} ` +
      `(HTTP ${result.status}, h1=${result.h1Count ?? "?"}, overflow=${overflow}px, ` +
      `analytics=${result.analyticsConfigured ? "ok" : "missing"}, distorted-images=${result.distortedImages?.length || 0}, ` +
      `broken-images=${result.brokenImages?.length || 0}, ` +
      `failed-requests=${result.firstPartyFailures.length})`
  );
}

if (issues.length) {
  console.error(JSON.stringify(issues, null, 2));
  process.exitCode = 1;
} else {
  console.log("Live mobile audit passed.");
}
