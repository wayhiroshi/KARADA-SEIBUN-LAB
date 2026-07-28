import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const episode = JSON.parse(await readFile(path.join(root, "content", "episodes", "001.json"), "utf8"));
const site = JSON.parse(await readFile(path.join(root, "content", "site.json"), "utf8"));
const articles = JSON.parse(await readFile(path.join(root, "content", "articles.json"), "utf8"));
const fixedSocialPosts = JSON.parse(
  await readFile(path.join(root, "content", "social", "fixed-posts.json"), "utf8"),
);
const panels = episode.scenes.flatMap((scene) => scene.panels);
const scriptLines = panels.flatMap((panel) => panel.script);
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

async function readDist(relativePath) {
  return readFile(path.join(dist, relativePath), "utf8");
}

expect(episode.scenes.length === 17, `Expected 17 scenes, got ${episode.scenes.length}`);
expect(panels.length === 87, `Expected 87 panels, got ${panels.length}`);
expect(new Set(panels.map((panel) => panel.id)).size === panels.length, "Panel IDs are not unique");
expect(!panels.some((panel) => panel.id === "S01-C02"), "Rejected panel S01-C02 must not be published");
expect(articles.length === 4, `Expected 4 launch articles, got ${articles.length}`);
expect(new Set(articles.map((article) => article.slug)).size === articles.length, "Article slugs are not unique");

const home = await readDist("index.html");
const articleIndex = await readDist("articles/index.html");
const manga = await readDist("manga/001/index.html");
const about = await readDist("about/index.html");
const policy = await readDist("editorial-policy/index.html");
const robots = await readDist("robots.txt");
const sitemap = await readDist("sitemap.xml");
const notFound = await readDist("404.html");

expect(home.includes("50代から、"), "Home hero concept is missing");
expect(home.includes("植井寛"), "Home author identity is missing");
expect(home.includes("販売導線について"), "Home sales/editorial separation notice is missing");
expect(!home.includes("fordays-shop.jp"), "Home must not contain a Fordays shopping link before written approval");
expect(!home.includes("noindex,nofollow"), "Home must be indexable");
expect(home.includes('<link rel="canonical"'), "Home canonical is missing");
expect(home.includes('type="application/ld+json"'), "Home structured data is missing");

expect(articleIndex.includes("核酸と成分の記事"), "Article index heading is missing");
expect((articleIndex.match(/class="article-card"/g) ?? []).length === articles.length, "Article index card count is inconsistent");

for (const article of articles) {
  const html = await readDist(`articles/${article.slug}/index.html`);
  expect(html.includes(article.title), `Article title missing: ${article.slug}`);
  expect(html.includes("筆者と広告の関係"), `Disclosure missing: ${article.slug}`);
  expect(html.includes("主な情報源"), `Sources missing: ${article.slug}`);
  expect(html.includes('href="/about/"'), `Author link missing: ${article.slug}`);
  expect(html.includes('"@type":"Article"'), `Article structured data missing: ${article.slug}`);
  expect(html.includes(`<link rel="canonical" href="${site.siteUrl}/articles/${article.slug}/">`), `Canonical mismatch: ${article.slug}`);
  expect(!html.includes("fordays-shop.jp"), `Shopping link must not appear in educational article: ${article.slug}`);
}

expect((manga.match(/<figure class="manga-panel"/g) ?? []).length === 87, "Built manga must contain 87 panel figures");
expect((manga.match(/class="script-line /g) ?? []).length === scriptLines.length + 3, "Built manga script-line count is inconsistent");
expect(!manga.includes("{{"), "Unexpanded template token found in manga");
expect(manga.includes('meta name="robots" content="index,follow,max-image-preview:large"'), "Manga index robots meta is missing");
expect(manga.includes(`${site.siteUrl}/manga/001/`), "Manga canonical is missing");

expect(about.includes("ペンネーム"), "About page must state the pen name");
expect(about.includes("フォーデイズ会員"), "About page relationship disclosure is missing");
expect(about.includes("医師・薬剤師・管理栄養士"), "About page credential boundary is missing");
expect(policy.includes("編集方針"), "Editorial policy section is missing");
expect(policy.includes("広告・利害関係の方針"), "Advertising policy section is missing");
expect(policy.includes("プライバシー"), "Privacy policy section is missing");
expect(policy.includes("アクセス解析IDが未設定"), "Analytics status disclosure is missing");
expect(!home.includes("googletagmanager.com"), "GA tag must not be emitted while measurement ID is empty");

expect(robots.includes("Allow: /"), "robots.txt must allow crawling");
expect(robots.includes(`Sitemap: ${site.siteUrl}/sitemap.xml`), "robots.txt sitemap URL is missing");
expect(!robots.includes("Disallow: /"), "robots.txt must not block the site");
for (const pagePath of ["/", "/articles/", "/manga/001/", "/about/", "/editorial-policy/"]) {
  expect(sitemap.includes(`<loc>${new URL(pagePath, `${site.siteUrl}/`)}</loc>`), `Sitemap path missing: ${pagePath}`);
}
expect(notFound.includes('content="noindex,follow"'), "404 page must be noindex");

const allHtml = [home, articleIndex, manga, about, policy, notFound];
for (const article of articles) allHtml.push(await readDist(`articles/${article.slug}/index.html`));
expect(!allHtml.some((html) => /招待(?:用)?URL[^<]{0,30}href=/u.test(html)), "Invite URL must not be implemented");
const publishedImageSources = allHtml.flatMap((html) =>
  [...html.matchAll(/<img[^>]+src="([^"]+)"/giu)].map((match) => match[1])
);
expect(
  publishedImageSources.every((src) =>
    src.startsWith("/assets/episodes/001/")
    || src === "/assets/brand/uehi-hiroshi-v2.png"
    || src === "/assets/brand/karada-seibun-lab-mark.svg"
  ),
  "Unexpected image source found; official product images must not be published before approval"
);

const publicImageDir = path.join(root, "public", "assets", "episodes", "001");
const publicImages = (await readdir(publicImageDir)).filter((name) => name.endsWith(".webp"));
expect(publicImages.length === 174, `Expected 174 WebP files, got ${publicImages.length}`);

let imageBytes = 0;
for (const panel of panels) {
  for (const suffix of ["640", "1254"]) {
    const imagePath = path.join(publicImageDir, `${panel.imageBase}-${suffix}.webp`);
    try {
      await access(imagePath);
      imageBytes += (await stat(imagePath)).size;
    } catch {
      failures.push(`Missing image: ${imagePath}`);
    }
  }
}

try {
  await access(path.join(root, "public", "assets", "brand", "uehi-hiroshi-v2.png"));
} catch {
  failures.push("Author illustration is missing");
}

for (const asset of [
  "karada-seibun-lab-logo.svg",
  "karada-seibun-lab-mark.svg",
  "karada-seibun-lab-logo-1200.png",
  "karada-seibun-lab-avatar-1024.png",
]) {
  try {
    await access(path.join(root, "public", "assets", "brand", asset));
  } catch {
    failures.push(`Brand asset is missing: ${asset}`);
  }
}

let socialSlides = 0;
for (const post of fixedSocialPosts.posts) {
  for (const [index] of post.slides.entries()) {
    socialSlides += 1;
    const slidePath = path.join(
      root,
      "public",
      "assets",
      "social",
      "fixed",
      post.id,
      `${String(index + 1).padStart(2, "0")}.png`,
    );
    try {
      await access(slidePath);
    } catch {
      failures.push(`Missing social slide: ${slidePath}`);
    }
  }
}
expect(socialSlides === 19, `Expected 19 fixed social slides, got ${socialSlides}`);

if (failures.length) {
  console.error("Site check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  articles: articles.length,
  scenes: episode.scenes.length,
  panels: panels.length,
  scriptLines: scriptLines.length,
  webpFiles: publicImages.length,
  fixedSocialSlides: socialSlides,
  imageMiB: Number((imageBytes / 1024 / 1024).toFixed(1)),
  indexedPaths: 1 + 1 + articles.length + 1 + 1 + 1
}, null, 2));
