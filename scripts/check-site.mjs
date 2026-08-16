import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, process.env.BUILD_DIR || "dist");
const episodes = await Promise.all(["001", "002", "003"].map(async (id) =>
  JSON.parse(await readFile(path.join(root, "content", "episodes", `${id}.json`), "utf8"))
));
const site = JSON.parse(await readFile(path.join(root, "content", "site.json"), "utf8"));
const allArticles = JSON.parse(await readFile(path.join(root, "content", "articles.json"), "utf8"));
const includeDrafts = process.env.INCLUDE_DRAFTS === "1";
const articles = allArticles.filter((article) => !article.draft || includeDrafts);
const ingredients = JSON.parse(await readFile(path.join(root, "content", "ingredients.json"), "utf8"));
const books = JSON.parse(await readFile(path.join(root, "content", "books.json"), "utf8"));
const affiliate = JSON.parse(await readFile(path.join(root, "content", "affiliate.json"), "utf8"));
const mangaCast = JSON.parse(await readFile(path.join(root, "content", "manga-cast.json"), "utf8"));
const booksEnabled = affiliate.amazon.pageEnabled || process.env.INCLUDE_BOOKS === "1";
const amazonAffiliateEnabled = affiliate.amazon.enabled || process.env.ENABLE_AMAZON_PREVIEW === "1";
const fixedSocialPosts = JSON.parse(
  await readFile(path.join(root, "content", "social", "fixed-posts.json"), "utf8"),
);
const socialContentDir = path.join(root, "content", "social");
const dailySocialFiles = (await readdir(socialContentDir))
  .filter((filename) => /^[a-z0-9-]+\.json$/u.test(filename) && filename !== "fixed-posts.json")
  .sort();
const dailySocialPosts = await Promise.all(dailySocialFiles.map(async (filename) =>
  JSON.parse(await readFile(path.join(socialContentDir, filename), "utf8"))
));
const panels = episodes.flatMap((episode) => episode.scenes.flatMap((scene) => scene.panels));
const scriptLines = panels.flatMap((panel) => panel.script);
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

async function readPngDimensions(filePath) {
  const buffer = await readFile(filePath);
  const pngSignature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    throw new Error("not a PNG file");
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function readDist(relativePath) {
  return readFile(path.join(dist, relativePath), "utf8");
}

expect(episodes.length === 3, `Expected 3 episodes, got ${episodes.length}`);
expect(panels.length === 65, `Expected 65 panels, got ${panels.length}`);
expect(new Set(panels.map((panel) => panel.id)).size === panels.length, "Panel IDs are not unique");
expect(episodes.map((item) => item.scenes.length).join(",") === "6,6,4", "Episode scene counts must be 6, 6 and 4");
const expectedArticleCount = includeDrafts
  ? allArticles.length
  : allArticles.filter((article) => !article.draft).length;
expect(articles.length === expectedArticleCount, `Expected ${expectedArticleCount} articles, got ${articles.length}`);
expect(new Set(articles.map((article) => article.slug)).size === articles.length, "Article slugs are not unique");
for (const article of articles) {
  expect(typeof article.lead === "string" && article.lead.trim().length > 0, `Article lead is missing: ${article.slug}`);
  expect(typeof article.image === "string" && article.image.startsWith("/assets/articles/"), `Article hero image is missing: ${article.slug}`);
  expect(typeof article.imageAlt === "string" && article.imageAlt.trim().length > 0, `Article hero alt text is missing: ${article.slug}`);
  expect(Array.isArray(article.summary) && article.summary.length === 3, `Article summary must contain exactly 3 points: ${article.slug}`);
  expect(Array.isArray(article.sections) && article.sections.length > 0, `Article sections are missing: ${article.slug}`);
  expect(article.sections?.every((section) => Array.isArray(section.paragraphs) && section.paragraphs.length === 2), `Each article section must contain exactly 2 paragraphs: ${article.slug}`);

  expect(article.styleVersion === "karada-article-v1", `Every article must use karada-article-v1: ${article.slug}`);
  expect(article.authorNote?.title && article.authorNote?.body, `karada-article-v1 requires an author learning note: ${article.slug}`);
  if (article.conceptFlow?.length) {
    expect(article.conceptTitle?.trim(), `Concept flow title is missing: ${article.slug}`);
    expect(article.conceptNote?.trim(), `Concept flow note is missing: ${article.slug}`);
  }
}
expect(ingredients.length === 8, `Expected 8 ingredient notes, got ${ingredients.length}`);
expect(new Set(ingredients.map((ingredient) => ingredient.slug)).size === ingredients.length, "Ingredient slugs are not unique");

const home = await readDist("index.html");
const articleIndex = await readDist("articles/index.html");
const ingredientIndex = await readDist("ingredients/index.html");
const ingredientPages = await Promise.all(ingredients.map((item) => readDist(`ingredients/${item.slug}/index.html`)));
const mangaIndex = await readDist("manga/index.html");
const mangaPages = await Promise.all(episodes.map((item) => readDist(`manga/${item.id}/index.html`)));
const about = await readDist("about/index.html");
const booksPage = booksEnabled ? await readDist("books/index.html") : "";
const policy = await readDist("editorial-policy/index.html");
const robots = await readDist("robots.txt");
const sitemap = await readDist("sitemap.xml");
const notFound = await readDist("404.html");
const builtStyles = await readDist("styles.css");
const builtApp = await readDist("app.js");

expect(home.includes("40代からの、やさしい学び直し"), "Home hero concept is missing");
expect(home.includes("learning-together-v2.webp"), "Home hero image is missing");
expect(home.includes("植井寛"), "Home author identity is missing");
expect(!home.includes("販売導線について"), "Internal sales-operation notice must not appear on home");
expect(!home.includes("fordays-shop.jp"), "Home must not contain a Fordays shopping link before written approval");
expect(!home.includes("noindex,nofollow"), "Home must be indexable");
expect(home.includes('<link rel="canonical"'), "Home canonical is missing");
expect(home.includes('type="application/ld+json"'), "Home structured data is missing");
expect(/img\s*\{[^}]*height:\s*auto;/su.test(builtStyles), "Responsive images must preserve their aspect ratio");

expect(articleIndex.includes("核酸と成分の記事"), "Article index heading is missing");
expect((articleIndex.match(/class="article-card"/g) ?? []).length === articles.length, "Article index card count is inconsistent");
expect(articleIndex.includes('"@type":"ItemList"'), "Article index ItemList structured data is missing");
expect(articleIndex.includes('"@type":"BreadcrumbList"'), "Article index BreadcrumbList structured data is missing");

expect(ingredientIndex.includes("記事に出てきた成分・用語"), "Ingredient index heading is missing");
expect((ingredientIndex.match(/class="ingredient-timeline-card"/g) ?? []).length === ingredients.length, "Ingredient index card count is inconsistent");
expect(ingredientIndex.includes('"@type":"ItemList"'), "Ingredient index ItemList structured data is missing");
expect(ingredientIndex.includes('"@type":"BreadcrumbList"'), "Ingredient index BreadcrumbList structured data is missing");
expect(sitemap.includes(`<loc>${site.siteUrl}/ingredients/</loc>`), "Ingredient index sitemap path is missing");
const ingredientsByFirstIntroduction = [...ingredients].sort((a, b) =>
  a.firstIntroduced.localeCompare(b.firstIntroduced) || a.created.localeCompare(b.created) || a.name.localeCompare(b.name, "ja")
);
const ingredientCardPositions = ingredientsByFirstIntroduction.map((ingredient) =>
  ingredientIndex.indexOf(`<h2><a href="/ingredients/${ingredient.slug}/">`)
);
expect(ingredientCardPositions.every((position) => position >= 0), "An ingredient index link is missing");
expect(ingredientCardPositions.every((position, index) => index === 0 || position > ingredientCardPositions[index - 1]), "Ingredient index must follow first-introduced date order");
for (const [index, ingredient] of ingredients.entries()) {
  const html = ingredientPages[index];
  expect(html.includes(`<h1>${ingredient.name}</h1>`), `Ingredient title missing: ${ingredient.slug}`);
  expect(html.includes(`作成日</dt><dd><time datetime="${ingredient.created}"`), `Ingredient created date missing: ${ingredient.slug}`);
  expect(html.includes(`最終更新日</dt><dd><time datetime="${ingredient.updated}"`), `Ingredient updated date missing: ${ingredient.slug}`);
  expect(html.includes('"@type":"DefinedTerm"'), `Ingredient DefinedTerm structured data missing: ${ingredient.slug}`);
  expect(html.includes('"@type":"BreadcrumbList"'), `Ingredient BreadcrumbList structured data missing: ${ingredient.slug}`);
  expect((html.match(/class="ingredient-fact-card"/g) ?? []).length === 3, `Ingredient visual fact cards must be 3: ${ingredient.slug}`);
  expect(html.includes(`図に含まれる言葉：${ingredient.visualItems.join("、")}`), `Ingredient visual text alternative missing: ${ingredient.slug}`);
  expect(ingredientIndex.includes(`<dt>作成日</dt><dd><time datetime="${ingredient.created}">${ingredient.created.replace(/^(\d{4})-(\d{2})-(\d{2})$/u, (_, y, m, d) => `${Number(y)}年${Number(m)}月${Number(d)}日`)}</time>`), `Ingredient index created date missing: ${ingredient.slug}`);
  expect(ingredientIndex.includes(`<dt>最終更新日</dt><dd><time datetime="${ingredient.updated}">${ingredient.updated.replace(/^(\d{4})-(\d{2})-(\d{2})$/u, (_, y, m, d) => `${Number(y)}年${Number(m)}月${Number(d)}日`)}</time>`), `Ingredient index updated date missing: ${ingredient.slug}`);
  expect(sitemap.includes(`<loc>${site.siteUrl}/ingredients/${ingredient.slug}/</loc><lastmod>${ingredient.updated}</lastmod>`), `Ingredient sitemap entry missing: ${ingredient.slug}`);
}

for (const article of articles) {
  const html = await readDist(`articles/${article.slug}/index.html`);
  expect(html.includes(article.title), `Article title missing: ${article.slug}`);
  expect(!html.includes("筆者と広告の関係"), `Repeated advertising disclosure must not appear: ${article.slug}`);
  expect(html.includes("主な情報源"), `Sources missing: ${article.slug}`);
  expect(html.includes('href="/about/"'), `Author link missing: ${article.slug}`);
  expect(html.includes('"@type":"Article"'), `Article structured data missing: ${article.slug}`);
  if (article.image) {
    expect(html.includes(`\"image\":{\"@type\":\"ImageObject\",\"url\":\"${site.siteUrl}${article.image}\"`), `Article image structured data missing: ${article.slug}`);
    expect(html.includes(`<meta property="og:image" content="${site.siteUrl}${article.image}">`), `Article Open Graph image mismatch: ${article.slug}`);
    expect(sitemap.includes(`<image:loc>${site.siteUrl}${article.image}</image:loc>`), `Sitemap article image missing: ${article.slug}`);
  }
  expect(html.includes('<meta name="twitter:card" content="summary_large_image">'), `Large Twitter card missing: ${article.slug}`);
  expect(html.includes(`<link rel="canonical" href="${site.siteUrl}/articles/${article.slug}/">`), `Canonical mismatch: ${article.slug}`);
  expect(sitemap.includes(`<loc>${site.siteUrl}/articles/${article.slug}/</loc>`), `Sitemap article path missing: ${article.slug}`);
  expect(sitemap.includes(`<loc>${site.siteUrl}/articles/${article.slug}/</loc><lastmod>${article.updated}</lastmod>`), `Sitemap article date mismatch: ${article.slug}`);
  expect(!html.includes("fordays-shop.jp"), `Shopping link must not appear in educational article: ${article.slug}`);
  if (article.image?.startsWith("/assets/")) {
    try {
      await access(path.join(root, "public", article.image));
    } catch {
      failures.push(`Article image is missing: ${article.image}`);
    }
  }
}

expect((mangaIndex.match(/class="manga-index-card"/g) ?? []).length === 3, "Manga index must contain 3 episode cards");
expect((mangaIndex.match(/class="cast-card(?: ingredient)?"/g) ?? []).length === 10, "Manga index must contain 10 cast cards");
expect((mangaIndex.match(/class="cast-research"/g) ?? []).length === 4, "Manga index must contain 4 ingredient research cards");
expect(mangaPages.reduce((sum, html) => sum + (html.match(/<figure class="manga-panel"/g) ?? []).length, 0) === 65, "Built manga must contain 65 panel figures");
expect(mangaPages.reduce((sum, html) => sum + (html.match(/class="script-line /g) ?? []).length, 0) === scriptLines.length, "Built manga script-line count is inconsistent");
for (const [index, html] of mangaPages.entries()) {
  const item = episodes[index];
  expect(!html.includes("{{"), `Unexpanded template token found in manga ${item.id}`);
  expect(html.includes('meta name="robots" content="index,follow,max-image-preview:large"'), `Manga robots meta is missing: ${item.id}`);
  expect(html.includes(`${site.siteUrl}/manga/${item.id}/`), `Manga canonical is missing: ${item.id}`);
  expect(!html.includes("このコマにはセリフはありません"), `Silent panel placeholder must not be shown: ${item.id}`);
  expect(!html.includes("この漫画の読み方"), `Manga must start with the story, not an editorial note: ${item.id}`);
  expect(!html.includes("この話の疑問"), `Manga must not explain its question before the story: ${item.id}`);
  expect(!html.includes(item.question), `Manga question must remain internal metadata: ${item.id}`);
  expect(!html.includes(item.conclusion), `Manga conclusion must not spoil the story opening: ${item.id}`);
  expect(!html.includes('class="panel-id"'), `Production panel IDs must not be visible: ${item.id}`);
  expect(!html.includes('class="panel-title"'), `Production panel titles must not be visible: ${item.id}`);
  expect(item.status === "公開版（台詞下置き）", `Manga status must identify the public accessible format: ${item.id}`);
}

const publicMangaHtml = [home, mangaIndex, ...mangaPages].join("\n");
for (const authorOnlyPhrase of [
  "制作確認",
  "セリフをコピー",
  "描かない",
  "表示しない",
  "説明しない",
  "顔にしない",
  "漫画では、",
  "タブレットの片隅に",
  "ここからは、成分研究",
]) {
  expect(!publicMangaHtml.includes(authorOnlyPhrase), `Author-only phrase leaked into public manga: ${authorOnlyPhrase}`);
}
expect(!builtApp.includes("workMode"), "Public JavaScript must not expose production review mode");
expect(
  panels.every((panel) => !/(?:描かない|表示しない|説明しない|使わない|顔にしない)/u.test(panel.alt)),
  "Production directions must not appear in manga alt text",
);
expect(mangaCast.characters.every((character) => !character.story?.startsWith("漫画では")), "Cast copy must address readers, not creators");

const mangaCopy = JSON.stringify(episodes);
for (const misleadingClaim of [
  "お茶が働きはじめれば",
  "ギムネマによって甘味センサー",
  "食事の少し前にお茶を飲むと、体内物流はどう変わる",
]) {
  expect(!mangaCopy.includes(misleadingClaim), `Misleading manga efficacy claim remains: ${misleadingClaim}`);
}
expect(episodes[1].sourceLinks.length === 3, "Episode 002 must link its three research sources");
expect(episodes[2].sourceLinks.length === 1, "Episode 003 must link its Gymnema research source");

expect(about.includes("本と資料をどう読むか"), "About learning-process section is missing");
expect(about.includes("漫画と声で伝える"), "About communication section is missing");
expect(about.includes('"@type":"BreadcrumbList"'), "About BreadcrumbList structured data is missing");
expect(!about.includes("フォーデイズ会員"), "Internal advertising relationship must not be repeated on About");
expect(policy.includes("編集方針"), "Editorial policy section is missing");
expect(!policy.includes("フォーデイズ会員"), "Internal sales relationship must not appear without a sales route");
expect(policy.includes("運営・プライバシー"), "Operations and privacy heading is missing");
expect(policy.includes('"@type":"BreadcrumbList"'), "Editorial policy BreadcrumbList structured data is missing");
expect(mangaIndex.includes('"@type":"BreadcrumbList"'), "Manga index BreadcrumbList structured data is missing");
expect(books.length === 2, `Expected 2 reading books, got ${books.length}`);
if (booksEnabled) {
  expect(booksPage.includes("読んでいる本"), "Books page heading is missing");
  expect((booksPage.match(/class="book-card"/g) ?? []).length === books.length, "Books page card count is inconsistent");
  expect(books.every((book) => booksPage.includes(book.title)), "A reading book title is missing");
  expect(booksPage.includes('"@type":"ItemList"'), "Books ItemList structured data is missing");
  expect(booksPage.includes('"@type":"BreadcrumbList"'), "Books BreadcrumbList structured data is missing");
  expect(sitemap.includes(`<loc>${site.siteUrl}/books/</loc>`), "Books sitemap path is missing");
} else {
  expect(!home.includes('href="/books/"'), "Books page must stay out of production navigation before approval");
  expect(!sitemap.includes(`<loc>${site.siteUrl}/books/</loc>`), "Books page must stay out of production sitemap before approval");
}
if (booksEnabled && amazonAffiliateEnabled) {
  expect(
    ["pending-qualifying-sales", "approved"].includes(affiliate.amazon.applicationStatus),
    "Amazon application status must be pending-qualifying-sales or approved",
  );
  expect(/^\d{4}-\d{2}-\d{2}$/u.test(affiliate.amazon.appliedOn), "Amazon application date is invalid");
  expect(affiliate.amazon.trackingId.trim().length > 0, "Amazon tracking ID is required when affiliate is enabled");
  expect(books.every((book) => book.amazonUrl.includes(affiliate.amazon.trackingId)), "Every Amazon URL must contain the configured tracking ID");
  expect(books.every((book) => /^https:\/\/www\.amazon\.co\.jp\/dp\/[A-Z0-9]{10}\/\?tag=[a-z0-9-]+$/u.test(book.amazonUrl)), "Every Amazon URL must use a direct product link and configured tag");
  expect(booksPage.includes(affiliate.amazon.disclosure), "Amazon Associates disclosure is missing from books page");
  expect(policy.includes(affiliate.amazon.disclosure), "Amazon Associates disclosure is missing from policy page");
  expect((booksPage.match(/rel="sponsored noopener noreferrer"/g) ?? []).length === books.length, "Every Amazon link must be marked sponsored");
} else if (booksEnabled) {
  expect(!booksPage.includes("amazon.co.jp"), "Amazon links must stay hidden until affiliate is enabled");
  expect(!booksPage.includes(affiliate.amazon.disclosure), "Amazon disclosure must not claim participation before activation");
}
expect(policy.includes("プライバシー"), "Privacy policy section is missing");
expect(/^G-[A-Z0-9]+$/u.test(site.gaMeasurementId), "GA4 measurement ID is missing or invalid");
expect(policy.includes("Google Analytics 4"), "GA4 privacy disclosure is missing");
expect(home.includes(`googletagmanager.com/gtag/js?id=${site.gaMeasurementId}`), "GA4 loader is missing");
expect(home.includes(`gtag('config', '${site.gaMeasurementId}'`), "GA4 configuration is missing");

expect(robots.includes("Allow: /"), "robots.txt must allow crawling");
expect(robots.includes(`Sitemap: ${site.siteUrl}/sitemap.xml`), "robots.txt sitemap URL is missing");
expect(!robots.includes("Disallow: /"), "robots.txt must not block the site");
for (const pagePath of ["/", "/articles/", "/ingredients/", ...(booksEnabled ? ["/books/"] : []), "/manga/", "/manga/001/", "/manga/002/", "/manga/003/", "/about/", "/editorial-policy/"]) {
  expect(sitemap.includes(`<loc>${new URL(pagePath, `${site.siteUrl}/`)}</loc>`), `Sitemap path missing: ${pagePath}`);
}
expect(notFound.includes('content="noindex,follow"'), "404 page must be noindex");

const articlePages = await Promise.all(articles.map(async (article) => ({
  path: `/articles/${article.slug}/`,
  html: await readDist(`articles/${article.slug}/index.html`)
})));
const htmlPages = [
  { path: "/", html: home },
  { path: "/articles/", html: articleIndex },
  ...articlePages,
  { path: "/ingredients/", html: ingredientIndex },
  ...ingredients.map((ingredient, index) => ({ path: `/ingredients/${ingredient.slug}/`, html: ingredientPages[index] })),
  { path: "/manga/", html: mangaIndex },
  ...episodes.map((episode, index) => ({ path: `/manga/${episode.id}/`, html: mangaPages[index] })),
  { path: "/about/", html: about },
  ...(booksEnabled ? [{ path: "/books/", html: booksPage }] : []),
  { path: "/editorial-policy/", html: policy },
  { path: "/404.html", html: notFound }
];
const allHtml = htmlPages.map((page) => page.html);
const indexablePages = htmlPages.filter((page) => page.path !== "/404.html");
const pagePaths = new Set(htmlPages.map((page) => page.path));
const sitemapPaths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => new URL(match[1]).pathname);

expect(sitemapPaths.length === indexablePages.length, `Sitemap path count mismatch: expected ${indexablePages.length}, got ${sitemapPaths.length}`);
expect(new Set(sitemapPaths).size === sitemapPaths.length, "Sitemap contains duplicate paths");
for (const page of indexablePages) expect(sitemapPaths.includes(page.path), `Indexable page is missing from sitemap: ${page.path}`);

const titles = [];
const descriptions = [];
function findStructuredDataNodes(value, type) {
  if (!value || typeof value !== "object") return [];
  const matches = value["@type"] === type ? [value] : [];
  return matches.concat(Object.values(value).flatMap((child) => findStructuredDataNodes(child, type)));
}

for (const page of htmlPages) {
  const title = page.html.match(/<title>([^<]+)<\/title>/u)?.[1];
  const description = page.html.match(/<meta name="description" content="([^"]+)">/u)?.[1];
  const canonical = page.html.match(/<link rel="canonical" href="([^"]+)">/u)?.[1];
  const expectedCanonical = new URL(page.path, `${site.siteUrl}/`).toString();
  expect(page.html.includes('<html lang="ja">'), `Japanese language declaration is missing: ${page.path}`);
  expect((page.html.match(/<h1(?:\s|>)/gu) ?? []).length === 1, `Page must contain exactly one h1: ${page.path}`);
  expect(Boolean(title), `Title is missing: ${page.path}`);
  expect(Boolean(description), `Meta description is missing: ${page.path}`);
  expect(canonical === expectedCanonical, `Canonical mismatch: ${page.path}`);
  if (page.path !== "/404.html") {
    titles.push(title);
    descriptions.push(description);
    expect(page.html.includes('meta name="robots" content="index,follow,max-image-preview:large"'), `Index robots directive is missing: ${page.path}`);
    expect(page.html.includes(`<meta property="og:url" content="${expectedCanonical}">`), `Open Graph URL mismatch: ${page.path}`);
    expect(page.html.includes('<meta property="og:image" content="https://'), `Absolute Open Graph image is missing: ${page.path}`);
    expect(page.html.includes('<meta name="twitter:card" content="summary_large_image">'), `Twitter card is missing: ${page.path}`);
  }
  const structuredData = [];
  for (const match of page.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gu)) {
    try {
      structuredData.push(JSON.parse(match[1]));
    } catch {
      failures.push(`Invalid JSON-LD: ${page.path}`);
    }
  }
  if (page.path !== "/" && page.path !== "/404.html") {
    const breadcrumbNodes = structuredData.flatMap((item) => findStructuredDataNodes(item, "BreadcrumbList"));
    expect(breadcrumbNodes.length === 1, `Page must contain one BreadcrumbList: ${page.path}`);
    if (breadcrumbNodes.length === 1) {
      const items = breadcrumbNodes[0].itemListElement;
      expect(Array.isArray(items) && items.length >= 2, `BreadcrumbList must contain at least two items: ${page.path}`);
      expect(items?.at(-1)?.item === expectedCanonical, `BreadcrumbList current URL mismatch: ${page.path}`);
    }
  }
  for (const match of page.html.matchAll(/<a[^>]+href="([^"]+)"/gu)) {
    const href = match[1];
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    const linkedPath = new URL(href, `${site.siteUrl}/`).pathname;
    expect(pagePaths.has(linkedPath), `Broken internal page link from ${page.path} to ${linkedPath}`);
  }
}
expect(new Set(titles).size === titles.length, "Indexable pages contain duplicate titles");
expect(new Set(descriptions).size === descriptions.length, "Indexable pages contain duplicate meta descriptions");
expect(!allHtml.some((html) => /招待(?:用)?URL[^<]{0,30}href=/u.test(html)), "Invite URL must not be implemented");
const publishedImageSources = allHtml.flatMap((html) =>
  [...html.matchAll(/<img[^>]+src="([^"]+)"/giu)].map((match) => match[1])
);
expect(
  publishedImageSources.every((src) =>
    src.startsWith("/assets/episodes/")
    || src.startsWith("/assets/manga/cast/")
    || src.startsWith("/assets/articles/")
    || src === "/assets/brand/uehi-hiroshi-v2.png"
    || src === "/assets/brand/karada-seibun-lab-mark.svg"
  ),
  "Unexpected image source found; official product images must not be published before approval"
);

let imageBytes = 0;
for (const episode of episodes) {
  const episodePanels = episode.scenes.flatMap((scene) => scene.panels);
  const publicImageDir = path.join(root, "public", "assets", "episodes", episode.id);
  for (const panel of episodePanels) {
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
}

try {
  await access(path.join(root, "public", "assets", "brand", "uehi-hiroshi-v2.png"));
} catch {
  failures.push("Author illustration is missing");
}

for (const character of JSON.parse(await readFile(path.join(root, "content", "manga-cast.json"), "utf8")).characters) {
  try {
    await access(path.join(root, "public", character.image));
  } catch {
    failures.push(`Missing cast portrait: ${character.image}`);
  }
}

try {
  await access(path.join(root, "public", "assets", "articles", "kakusan-toha", "learning-together-v2.webp"));
} catch {
  failures.push("Learning-together article illustration is missing");
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

const allSocialPosts = [
  ...fixedSocialPosts.posts.map((post) => ({ ...post, category: "fixed" })),
  ...dailySocialPosts.map((post) => ({ ...post, category: "daily" })),
];
let socialSlides = 0;
for (const post of allSocialPosts) {
  expect(typeof post.id === "string" && post.id.length > 0, "Social post ID is missing");
  expect(Array.isArray(post.slides) && post.slides.length > 0, `Social slides are missing: ${post.id}`);
  expect(["ready", "published"].includes(post.status), `Invalid social status: ${post.id}`);
  if (post.category === "daily") {
    expect(typeof post.caption === "string" && post.caption.trim().length > 0, `Social caption is missing: ${post.id}`);
  }
  if (post.instagramUrl) {
    expect(
      /^https:\/\/www\.instagram\.com\/karada_seibun_lab\/p\/[A-Za-z0-9_-]+\/$/u.test(post.instagramUrl),
      `Invalid Instagram URL: ${post.id}`,
    );
  }
  expect(
    (post.status === "published") === Boolean(post.instagramUrl),
    `Published status and Instagram URL must match: ${post.id}`,
  );

  const postDir = path.join(root, "public", "assets", "social", post.category, post.id);
  let outputSlides = [];
  try {
    outputSlides = (await readdir(postDir)).filter((filename) => filename.endsWith(".png")).sort();
  } catch {
    failures.push(`Missing social post directory: ${postDir}`);
  }
  expect(outputSlides.length === post.slides.length, `Social slide count mismatch: ${post.id}`);

  for (const [index] of post.slides.entries()) {
    socialSlides += 1;
    const slidePath = path.join(postDir, `${String(index + 1).padStart(2, "0")}.png`);
    try {
      const dimensions = await readPngDimensions(slidePath);
      expect(
        dimensions.width === 1080 && dimensions.height === 1350,
        `Social slide must be 1080x1350: ${slidePath}`,
      );
    } catch (error) {
      failures.push(`Invalid social slide: ${slidePath} (${error.message})`);
    }
  }
}
expect(allSocialPosts.length === 9, `Expected 9 social post sets, got ${allSocialPosts.length}`);
expect(socialSlides === 45, `Expected 45 social slides, got ${socialSlides}`);
const publishedSocialPosts = allSocialPosts.filter((post) => post.status === "published").length;
expect(publishedSocialPosts === 8, `Expected 8 published social posts, got ${publishedSocialPosts}`);

if (failures.length) {
  console.error("Site check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  articles: articles.length,
  ingredientNotes: ingredients.length,
  episodes: episodes.length,
  scenes: episodes.reduce((sum, item) => sum + item.scenes.length, 0),
  panels: panels.length,
  scriptLines: scriptLines.length,
  webpFiles: panels.length * 2,
  socialPosts: allSocialPosts.length,
  publishedSocialPosts,
  socialSlides,
  imageMiB: Number((imageBytes / 1024 / 1024).toFixed(1)),
  indexedPaths: sitemapPaths.length
}, null, 2));
