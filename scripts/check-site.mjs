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
const booksEnabled = affiliate.amazon.pageEnabled || process.env.INCLUDE_BOOKS === "1";
const amazonAffiliateEnabled = affiliate.amazon.enabled || process.env.ENABLE_AMAZON_PREVIEW === "1";
const fixedSocialPosts = JSON.parse(
  await readFile(path.join(root, "content", "social", "fixed-posts.json"), "utf8"),
);
const dnaBaseballPost = JSON.parse(
  await readFile(path.join(root, "content", "social", "dna-baseball-2026-08-06.json"), "utf8"),
);
const dnaTranscriptionPost = JSON.parse(
  await readFile(path.join(root, "content", "social", "dna-transcription-2026-08-10.json"), "utf8"),
);
const rnaMrnaPost = JSON.parse(
  await readFile(path.join(root, "content", "social", "rna-mrna-2026-08-11.json"), "utf8"),
);
const nucleotideFormulaPost = JSON.parse(
  await readFile(path.join(root, "content", "social", "nucleotide-formula-2026-08-11.json"), "utf8"),
);
const panels = episodes.flatMap((episode) => episode.scenes.flatMap((scene) => scene.panels));
const scriptLines = panels.flatMap((panel) => panel.script);
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
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

  if (article.published >= "2026-08-15") {
    expect(article.styleVersion === "karada-article-v1", `New article must use karada-article-v1: ${article.slug}`);
  }
  if (article.styleVersion === "karada-article-v1") {
    expect(article.authorNote?.title && article.authorNote?.body, `karada-article-v1 requires an author learning note: ${article.slug}`);
    if (article.conceptFlow?.length) {
      expect(article.conceptTitle?.trim(), `Concept flow title is missing: ${article.slug}`);
      expect(article.conceptNote?.trim(), `Concept flow note is missing: ${article.slug}`);
    }
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

expect(home.includes("40代からの、やさしい学び直し"), "Home hero concept is missing");
expect(home.includes("learning-together-v2.webp"), "Home hero image is missing");
expect(home.includes("植井寛"), "Home author identity is missing");
expect(!home.includes("販売導線について"), "Internal sales-operation notice must not appear on home");
expect(!home.includes("fordays-shop.jp"), "Home must not contain a Fordays shopping link before written approval");
expect(!home.includes("noindex,nofollow"), "Home must be indexable");
expect(home.includes('<link rel="canonical"'), "Home canonical is missing");
expect(home.includes('type="application/ld+json"'), "Home structured data is missing");

expect(articleIndex.includes("核酸と成分の記事"), "Article index heading is missing");
expect((articleIndex.match(/class="article-card"/g) ?? []).length === articles.length, "Article index card count is inconsistent");
expect(articleIndex.includes('"@type":"ItemList"'), "Article index ItemList structured data is missing");

expect(ingredientIndex.includes("記事に出てきた成分・用語"), "Ingredient index heading is missing");
expect((ingredientIndex.match(/class="ingredient-timeline-card"/g) ?? []).length === ingredients.length, "Ingredient index card count is inconsistent");
expect(ingredientIndex.includes('"@type":"ItemList"'), "Ingredient index ItemList structured data is missing");
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
}

expect(about.includes("本と資料をどう読むか"), "About learning-process section is missing");
expect(about.includes("漫画と声で伝える"), "About communication section is missing");
expect(!about.includes("フォーデイズ会員"), "Internal advertising relationship must not be repeated on About");
expect(policy.includes("編集方針"), "Editorial policy section is missing");
expect(!policy.includes("フォーデイズ会員"), "Internal sales relationship must not appear without a sales route");
expect(policy.includes("運営・プライバシー"), "Operations and privacy heading is missing");
expect(books.length === 2, `Expected 2 reading books, got ${books.length}`);
if (booksEnabled) {
  expect(booksPage.includes("読んでいる本"), "Books page heading is missing");
  expect((booksPage.match(/class="book-card"/g) ?? []).length === books.length, "Books page card count is inconsistent");
  expect(books.every((book) => booksPage.includes(book.title)), "A reading book title is missing");
  expect(booksPage.includes('"@type":"ItemList"'), "Books ItemList structured data is missing");
  expect(sitemap.includes(`<loc>${site.siteUrl}/books/</loc>`), "Books sitemap path is missing");
} else {
  expect(!home.includes('href="/books/"'), "Books page must stay out of production navigation before approval");
  expect(!sitemap.includes(`<loc>${site.siteUrl}/books/</loc>`), "Books page must stay out of production sitemap before approval");
}
if (booksEnabled && amazonAffiliateEnabled) {
  expect(affiliate.amazon.trackingId.trim().length > 0, "Amazon tracking ID is required when affiliate is enabled");
  expect(books.every((book) => book.amazonUrl.includes(affiliate.amazon.trackingId)), "Every Amazon URL must contain the configured tracking ID");
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

const allHtml = [home, articleIndex, ingredientIndex, ...ingredientPages, mangaIndex, ...mangaPages, about, ...(booksEnabled ? [booksPage] : []), policy, notFound];
for (const article of articles) allHtml.push(await readDist(`articles/${article.slug}/index.html`));
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

for (const [index] of dnaBaseballPost.slides.entries()) {
  const slidePath = path.join(
    root,
    "public",
    "assets",
    "social",
    "daily",
    dnaBaseballPost.id,
    `${String(index + 1).padStart(2, "0")}.png`,
  );
  try {
    await access(slidePath);
  } catch {
    failures.push(`Missing DNA baseball social slide: ${slidePath}`);
  }
}
expect(dnaBaseballPost.slides.length === 5, `Expected 5 DNA baseball slides, got ${dnaBaseballPost.slides.length}`);

for (const [index] of dnaTranscriptionPost.slides.entries()) {
  const slidePath = path.join(
    root,
    "public",
    "assets",
    "social",
    "daily",
    dnaTranscriptionPost.id,
    `${String(index + 1).padStart(2, "0")}.png`,
  );
  try {
    await access(slidePath);
  } catch {
    failures.push(`Missing DNA transcription social slide: ${slidePath}`);
  }
}
expect(dnaTranscriptionPost.slides.length === 5, `Expected 5 DNA transcription slides, got ${dnaTranscriptionPost.slides.length}`);

for (const [index] of rnaMrnaPost.slides.entries()) {
  const slidePath = path.join(
    root,
    "public",
    "assets",
    "social",
    "daily",
    rnaMrnaPost.id,
    `${String(index + 1).padStart(2, "0")}.png`,
  );
  try {
    await access(slidePath);
  } catch {
    failures.push(`Missing RNA and mRNA social slide: ${slidePath}`);
  }
}
expect(rnaMrnaPost.slides.length === 4, `Expected 4 RNA and mRNA slides, got ${rnaMrnaPost.slides.length}`);

for (const [index] of nucleotideFormulaPost.slides.entries()) {
  const slidePath = path.join(
    root,
    "public",
    "assets",
    "social",
    "daily",
    nucleotideFormulaPost.id,
    `${String(index + 1).padStart(2, "0")}.png`,
  );
  try {
    await access(slidePath);
  } catch {
    failures.push(`Missing nucleotide/formula social slide: ${slidePath}`);
  }
}
expect(nucleotideFormulaPost.slides.length === 4, `Expected 4 nucleotide/formula slides, got ${nucleotideFormulaPost.slides.length}`);

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
  fixedSocialSlides: socialSlides,
  imageMiB: Number((imageBytes / 1024 / 1024).toFixed(1)),
  indexedPaths: 1 + 1 + articles.length + 1 + ingredients.length + 1 + episodes.length + 1 + 1
}, null, 2));
