import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, process.env.BUILD_DIR || "dist");
const episodes = await Promise.all(["001", "002", "003"].map(async (id) =>
  JSON.parse(await readFile(path.join(root, "content", "episodes", `${id}.json`), "utf8"))
));
const episode = episodes[0];
const site = JSON.parse(await readFile(path.join(root, "content", "site.json"), "utf8"));
const allArticles = JSON.parse(await readFile(path.join(root, "content", "articles.json"), "utf8"));
const includeDrafts = process.env.INCLUDE_DRAFTS === "1";
const articles = allArticles.filter((article) => !article.draft || includeDrafts);
const ingredients = JSON.parse(await readFile(path.join(root, "content", "ingredients.json"), "utf8"));
const mangaCast = JSON.parse(await readFile(path.join(root, "content", "manga-cast.json"), "utf8"));
const books = JSON.parse(await readFile(path.join(root, "content", "books.json"), "utf8"));
const affiliate = JSON.parse(await readFile(path.join(root, "content", "affiliate.json"), "utf8"));
const booksEnabled = affiliate.amazon.pageEnabled || process.env.INCLUDE_BOOKS === "1";
const amazonAffiliateEnabled = affiliate.amazon.enabled || process.env.ENABLE_AMAZON_PREVIEW === "1";
const episodeTemplate = await readFile(path.join(root, "src", "index.template.html"), "utf8");
const stylesSource = await readFile(path.join(root, "src", "styles.css"));
const stylesVersion = createHash("sha256").update(stylesSource).digest("hex").slice(0, 10);

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function absoluteUrl(pagePath = "/") {
  return new URL(pagePath, `${site.siteUrl}/`).toString();
}

function formatJapaneseDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return `${year}年${month}月${day}日`;
}

function asSentence(value) {
  const text = String(value).trim();
  if (/[！？]$/u.test(text)) return `${text} `;
  return /。$/u.test(text) ? text : `${text}。`;
}

function navLink(href, label, currentPath) {
  const active = currentPath === href || (href !== "/" && currentPath.startsWith(href));
  return `<a href="${href}"${active ? ' aria-current="page"' : ""}>${escapeHtml(label)}</a>`;
}

function siteHeader(currentPath) {
  return `
    <header class="site-header">
      <a class="brand" href="/" aria-label="${escapeHtml(site.siteName)} トップへ">
        <img class="brand-mark" src="/assets/brand/karada-seibun-lab-mark.svg" width="52" height="52" alt="" aria-hidden="true">
        <span>
          <strong>${escapeHtml(site.siteName)}</strong>
          <small>${escapeHtml(site.byline)}</small>
        </span>
      </a>
      <nav class="global-nav" aria-label="サイト内メニュー">
        ${navLink("/articles/", "核酸と成分", currentPath)}
        ${booksEnabled ? navLink("/books/", "読んでいる本", currentPath) : ""}
        ${navLink("/ingredients/", "成分・用語", currentPath)}
        ${navLink("/manga/", "漫画", currentPath)}
        ${navLink("/about/", "植井寛について", currentPath)}
        ${navLink("/editorial-policy/", "編集方針", currentPath)}
      </nav>
    </header>`;
}

function siteFooter() {
  return `
    <footer class="site-footer">
      <strong>${escapeHtml(site.siteName)} <span>${escapeHtml(site.byline)}</span></strong>
      <p>${escapeHtml(site.tagline)}</p>
      <nav aria-label="フッターメニュー">
        <a href="/articles/">記事一覧</a>
        ${booksEnabled ? '<a href="/books/">読んでいる本</a>' : ""}
        <a href="/ingredients/">成分・用語</a>
        <a href="/manga/">漫画</a>
        <a href="/about/">著者情報</a>
        <a href="/editorial-policy/">運営・プライバシー</a>
      </nav>
      <p class="copyright">© 2026 ${escapeHtml(site.siteName)}. All rights reserved.</p>
    </footer>`;
}

function analyticsMarkup() {
  if (!site.gaMeasurementId) return "";
  const id = escapeHtml(site.gaMeasurementId);
  return `
  <script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${id}', { anonymize_ip: true });
  </script>`;
}

function pageShell({
  pathName,
  title,
  description,
  body,
  type = "website",
  image = site.authorImage,
  imageAlt = `${site.siteName} ${site.byline}`,
  structuredData = [],
  bodyClass = ""
}) {
  const pageTitle = pathName === "/" ? `${site.siteName} ${site.byline}` : `${title}｜${site.siteName}`;
  const canonical = absoluteUrl(pathName);
  const socialImage = absoluteUrl(image);
  const schemas = Array.isArray(structuredData) ? structuredData : [structuredData];
  const schemaMarkup = schemas
    .filter(Boolean)
    .map((schema) => `<script type="application/ld+json">${escapeJsonForHtml(schema)}</script>`)
    .join("\n");

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta name="theme-color" content="#f6f0e3">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="author" content="${escapeHtml(site.authorName)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="${type}">
  <meta property="og:locale" content="ja_JP">
  <meta property="og:site_name" content="${escapeHtml(site.siteName)}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${socialImage}">
  <meta property="og:image:alt" content="${escapeHtml(imageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${socialImage}">
  <meta name="twitter:image:alt" content="${escapeHtml(imageAlt)}">
  <title>${escapeHtml(pageTitle)}</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/styles.css?v=${stylesVersion}">
  <script src="/app.js" defer></script>
  ${schemaMarkup}
  ${analyticsMarkup()}
</head>
<body class="${escapeHtml(bodyClass)}">
  <a class="skip-link" href="#main-content">本文へ移動</a>
  <div class="reading-progress" aria-hidden="true"><span></span></div>
  ${siteHeader(pathName)}
  <main id="main-content">${body}</main>
  ${siteFooter()}
</body>
</html>`;
}

function breadcrumb(items) {
  const list = items.map((item, index) => {
    const isLast = index === items.length - 1;
    return `<li>${isLast
      ? `<span aria-current="page">${escapeHtml(item.label)}</span>`
      : `<a href="${item.href}">${escapeHtml(item.label)}</a>`}</li>`;
  }).join("");
  return `<nav class="breadcrumb" aria-label="パンくずリスト"><ol>${list}</ol></nav>`;
}

function authorCard(compact = false) {
  return `
    <section class="author-card${compact ? " compact" : ""}" aria-labelledby="author-card-title">
      <img src="${site.authorImage}" width="1254" height="1254" alt="ノートを持つ植井寛の著者イラスト" loading="lazy">
      <div>
        <p class="eyebrow">AUTHOR</p>
        <h2 id="author-card-title">植井寛</h2>
        <p>核酸について本や資料を読み始めた「からだ成分ラボ」の執筆者です。つまずいた点も隠さず、読者のみなさんと一緒に学びながら、自分の言葉で整理します。</p>
        <a class="text-link" href="/about/">植井寛について読む</a>
      </div>
    </section>`;
}

function renderArticleCard(article) {
  const articlePath = `/articles/${escapeHtml(article.slug)}/`;
  return `
    <article class="article-card">
      <a class="article-card-image" href="${articlePath}" aria-hidden="true" tabindex="-1">
        <img src="${escapeHtml(article.image)}" width="1440" height="960" alt="" loading="lazy">
      </a>
      <div class="article-card-copy">
        <p class="article-category">${escapeHtml(article.category)}</p>
        <h3><a href="${articlePath}">${escapeHtml(article.title)}</a></h3>
        <p>${escapeHtml(article.description)}</p>
        <div class="article-meta"><span>更新 ${escapeHtml(article.updated)}</span><span>${escapeHtml(article.readingTime)}</span></div>
      </div>
    </article>`;
}

function renderBookCard(book, index) {
  const amazonEnabled = amazonAffiliateEnabled && book.amazonUrl;
  const startedMarkup = book.started
    ? `<time datetime="${escapeHtml(book.started)}">${formatJapaneseDate(book.started)}から</time>`
    : "";
  const link = amazonEnabled
    ? `<a class="button book-amazon-link" href="${escapeHtml(book.amazonUrl)}" rel="sponsored noopener noreferrer">Amazonで見る <span>広告</span></a>`
    : "";
  return `
    <article class="book-card">
      <div class="book-cover book-cover-${(index % 2) + 1}" aria-hidden="true">
        <span>${escapeHtml(book.theme)}</span>
        <i></i>
        <strong>READING<br>NOTE</strong>
      </div>
      <div class="book-card-copy">
        <div class="book-meta"><span>${escapeHtml(book.status)}</span>${startedMarkup}</div>
        <h2>${escapeHtml(book.title)}</h2>
        <h3>この本を手に取った理由</h3>
        <p>${escapeHtml(book.whyReading)}</p>
        <blockquote>${escapeHtml(book.question)}</blockquote>
        ${link}
      </div>
    </article>`;
}

function renderBooks() {
  const amazonDisclosure = amazonAffiliateEnabled
    ? `<aside class="affiliate-disclosure" aria-label="広告について"><strong>広告について</strong><p>${escapeHtml(affiliate.amazon.disclosure)}</p></aside>`
    : "";
  const body = `
    <div class="content-container books-container">
      ${breadcrumb([{ href: "/", label: "ホーム" }, { label: "読んでいる本" }])}
      <header class="page-hero books-hero">
        <p class="eyebrow">BOOKSHELF</p>
        <h1>読んでいる本</h1>
        <p>記事の出発点になった本を紹介します。心に残ったことも、まだ分からないことも、読み進めながら言葉にしていきます。</p>
      </header>
      ${amazonDisclosure}
      <section class="book-list" aria-label="読んでいる本の一覧">
        ${books.map(renderBookCard).join("")}
      </section>
      <section class="books-closing">
        <p class="eyebrow">FROM READING TO WRITING</p>
        <h2>本から生まれた疑問を、記事へ。</h2>
        <p>分かったつもりで通り過ぎず、ひとつの疑問を、ひとつの記事で確かめます。</p>
        <a class="text-link" href="/articles/">記事を読んでみる</a>
      </section>
    </div>`;

  return pageShell({
    pathName: "/books/",
    title: "読んでいる本",
    description: "植井寛が、核酸、栄養、体の仕組みを学ぶために読んでいる本と、そこから生まれた疑問を紹介します。",
    body,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "植井寛が読んでいる本",
      itemListElement: books.map((book, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: { "@type": "Book", name: book.title }
      }))
    }
  });
}

function renderHome() {
  const [firstArticle, ...otherArticles] = articles;
  const body = `
    <section class="home-hero">
      <div class="home-hero-copy">
        <p class="hero-kicker"><span>40代からの、やさしい学び直し</span></p>
        <h1>からだのことを、<br><em>わかる言葉で</em><br>学び直す。</h1>
        <p class="hero-copy">本を読み、つまずいたところから、一緒に学ぶ。</p>
        <p class="hero-description">核酸、栄養、健康食品。難しい言葉を一人で抱えず、植井寛が読者のみなさんと一緒に確かめていく場所です。</p>
        <div class="button-row">
          <a class="button primary" href="/articles/kakusan-toha/">最初の記事を読む</a>
          <a class="button secondary" href="/about/">このラボについて</a>
        </div>
        <div class="hero-tags" aria-label="発信方法">
          <span>本と資料</span><span>漫画</span><span>本人の声</span>
        </div>
      </div>
      <figure class="home-hero-visual">
        <img src="/assets/articles/kakusan-toha/learning-together-v2.webp" width="1440" height="960" alt="適度な距離を保ち、それぞれの本を開いて一緒に学ぶ植井寛と女性のイラスト" fetchpriority="high">
        <figcaption><strong>何でも知っている人ではなく、</strong>学びながら、自分の言葉で伝えます。</figcaption>
      </figure>
    </section>

    <section class="learning-rhythm" aria-labelledby="learning-rhythm-title">
      <div class="section-heading-row">
        <div><p class="eyebrow">OUR RHYTHM</p><h2 id="learning-rhythm-title">分からないところから、始めます。</h2></div>
      </div>
      <ol>
        <li><span>01</span><div><strong>本を読む</strong><p>気になった言葉に印をつけます。</p></div></li>
        <li><span>02</span><div><strong>調べてほどく</strong><p>つまずいた点も、そのまま記録します。</p></div></li>
        <li><span>03</span><div><strong>一緒に確かめる</strong><p>漫画や声でも、ゆっくり共有します。</p></div></li>
      </ol>
    </section>

    <section class="featured-reading" aria-labelledby="featured-title">
      <a class="featured-reading-image" href="/articles/${escapeHtml(firstArticle.slug)}/" aria-hidden="true" tabindex="-1">
        <img src="${escapeHtml(firstArticle.image)}" width="1440" height="960" alt="" loading="lazy">
      </a>
      <div>
        <p class="eyebrow">FIRST READING</p>
        <h2 id="featured-title"><a href="/articles/${escapeHtml(firstArticle.slug)}/">${escapeHtml(firstArticle.title)}</a></h2>
        <p>${escapeHtml(firstArticle.lead)}</p>
        <div class="article-meta"><span>更新 ${escapeHtml(firstArticle.updated)}</span><span>${escapeHtml(firstArticle.readingTime)}</span></div>
        <a class="text-link" href="/articles/${escapeHtml(firstArticle.slug)}/">一緒に読み始める</a>
      </div>
    </section>

    <section class="section-block home-article-section" aria-labelledby="latest-title">
      <div class="section-heading-row">
        <div><p class="eyebrow">CONTINUE READING</p><h2 id="latest-title">次に読みたい記事</h2></div>
        <a class="text-link" href="/articles/">すべての記事</a>
      </div>
      <div class="article-grid article-grid-three">${otherArticles.map(renderArticleCard).join("")}</div>
    </section>

    ${booksEnabled ? `<section class="home-books" aria-labelledby="home-books-title">
      <div>
        <p class="eyebrow">ON MY BOOKSHELF</p>
        <h2 id="home-books-title">いま、こんな本を読んでいます。</h2>
        <p>記事のもとになった本と、そこから生まれた疑問を紹介します。</p>
        <a class="text-link" href="/books/">読んでいる本を見る</a>
      </div>
      <div class="home-book-spines" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    </section>` : ""}

    <section class="manga-feature">
      <div class="manga-feature-image">
        <img src="/assets/episodes/001/S01-C01-640.webp" width="640" height="640" alt="昼食を準備する主人公を描いた漫画の一コマ" loading="lazy">
      </div>
      <div>
        <p class="eyebrow">MANGA EPISODE 001</p>
        <h2>${escapeHtml(episode.title)}</h2>
        <p>${escapeHtml(episode.subtitle)}。体の仕組みを体内物流センターに置き換えた、制作確認版の漫画です。</p>
        <a class="button secondary" href="/manga/#cast">登場人物から読む</a>
      </div>
    </section>

    ${authorCard()}`;

  return pageShell({
    pathName: "/",
    title: site.siteName,
    description: site.description,
    body,
    image: "/assets/articles/kakusan-toha/learning-together-v2.webp",
    imageAlt: "本を開き、核酸と健康情報を学ぶからだ成分ラボのイラスト",
    bodyClass: "home-page",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.siteName,
      alternateName: `${site.siteName} ${site.byline}`,
      url: absoluteUrl("/"),
      description: site.description,
      author: {
        "@type": "Person",
        name: site.authorName,
        url: absoluteUrl("/about/")
      }
    }
  });
}

function renderArticleIndex() {
  const body = `
    <div class="content-container">
      ${breadcrumb([{ href: "/", label: "ホーム" }, { label: "核酸と成分の記事" }])}
      <header class="page-hero">
        <p class="eyebrow">ARTICLES</p>
        <h1>核酸と成分の記事</h1>
        <p>気になる成分や研究を、基礎からゆっくり確かめるための記事です。</p>
      </header>
      <div class="article-grid">${articles.map(renderArticleCard).join("")}</div>
    </div>`;

  return pageShell({
    pathName: "/articles/",
    title: "核酸と成分の記事",
    description: "核酸、DNA、RNA、ヌクレオチド、健康食品の表示、研究の読み方を、健康情報を調べる人の目線で整理した記事一覧です。",
    body,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "核酸と成分の記事",
      url: absoluteUrl("/articles/"),
      description: "核酸と健康食品の成分表示、研究を読み解く記事一覧",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: articles.map((article, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: article.title,
          url: absoluteUrl(`/articles/${article.slug}/`)
        }))
      }
    }
  });
}

function renderIngredientVisual(ingredient, compact = false) {
  const items = ingredient.visualItems.map((item, index) =>
    `<span class="ingredient-node node-${index + 1}">${escapeHtml(item)}</span>`
  ).join("");
  return `
    <figure class="ingredient-visual ${compact ? "compact" : ""}" data-group="${escapeHtml(ingredient.group)}">
      <div class="ingredient-orbit" aria-hidden="true">
        <span class="ingredient-symbol">${escapeHtml(ingredient.shortLabel)}</span>
        ${items}
      </div>
      ${compact ? "" : `<figcaption>${escapeHtml(ingredient.visualTitle)}<span class="visually-hidden">。図に含まれる言葉：${ingredient.visualItems.map(escapeHtml).join("、")}</span></figcaption>`}
    </figure>`;
}

function renderIngredientIndexCard(ingredient) {
  return `
    <article class="ingredient-timeline-card">
      <div class="ingredient-timeline-date">
        <span>最初の紹介</span>
        <time datetime="${escapeHtml(ingredient.firstIntroduced)}">${escapeHtml(formatJapaneseDate(ingredient.firstIntroduced))}</time>
      </div>
      ${renderIngredientVisual(ingredient, true)}
      <div class="ingredient-timeline-copy">
        <p class="ingredient-kind">${escapeHtml(ingredient.kind)}</p>
        <h2><a href="/ingredients/${escapeHtml(ingredient.slug)}/">${escapeHtml(ingredient.name)}</a></h2>
        <p>${escapeHtml(ingredient.summary)}</p>
        <dl class="ingredient-dates">
          <div><dt>作成日</dt><dd><time datetime="${escapeHtml(ingredient.created)}">${escapeHtml(formatJapaneseDate(ingredient.created))}</time></dd></div>
          <div><dt>最終更新日</dt><dd><time datetime="${escapeHtml(ingredient.updated)}">${escapeHtml(formatJapaneseDate(ingredient.updated))}</time></dd></div>
        </dl>
        <a class="text-link" href="/ingredients/${escapeHtml(ingredient.slug)}/">詳しく見る</a>
      </div>
    </article>`;
}

function renderIngredientIndex() {
  const chronological = [...ingredients].sort((a, b) =>
    a.firstIntroduced.localeCompare(b.firstIntroduced) || a.created.localeCompare(b.created) || a.name.localeCompare(b.name, "ja")
  );
  const body = `
    <div class="content-container ingredient-index-container">
      ${breadcrumb([{ href: "/", label: "ホーム" }, { label: "記事に出てきた成分・用語" }])}
      <header class="ingredient-index-hero">
        <div>
          <p class="eyebrow">INGREDIENT NOTES</p>
          <h1>記事に出てきた成分・用語</h1>
          <p>漫画や記事に登場した植物素材、成分、核酸の基本用語を、最初に紹介した日からたどれます。</p>
        </div>
        <div class="ingredient-growth-visual" aria-label="小さな丸が少しずつ増えていく成分ノートのイメージ">
          ${chronological.slice(0, 8).map((item, index) => `<span style="--i:${index}">${escapeHtml(item.name)}</span>`).join("")}
        </div>
      </header>

      <section class="ingredient-index-guide" aria-labelledby="ingredient-guide-title">
        <p class="eyebrow">FIND YOUR INTEREST</p>
        <h2 id="ingredient-guide-title">気になる名前から、ひとつずつ。</h2>
        <p>一つのページで、一つの言葉を短く紹介しています。</p>
      </section>

      <div class="ingredient-timeline">${chronological.map(renderIngredientIndexCard).join("")}</div>
    </div>`;

  return pageShell({
    pathName: "/ingredients/",
    title: "記事に出てきた成分・用語",
    description: "漫画や記事に出てきた植物素材、成分、核酸の基本用語を、図と短い解説で紹介します。",
    body,
    bodyClass: "ingredient-index-page",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "記事に出てきた成分・用語",
      url: absoluteUrl("/ingredients/"),
      mainEntity: {
        "@type": "ItemList",
        itemListElement: chronological.map((ingredient, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: ingredient.name,
          url: absoluteUrl(`/ingredients/${ingredient.slug}/`)
        }))
      }
    }
  });
}

function renderIngredient(ingredient) {
  const pathName = `/ingredients/${ingredient.slug}/`;
  const facts = ingredient.facts.map(([title, text], index) => `
    <article class="ingredient-fact-card">
      <span>${String(index + 1).padStart(2, "0")}</span>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(text)}</p>
    </article>`).join("");
  const relation = ingredient.related.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const sources = ingredient.sources.map(([label, url]) =>
    `<li><a href="${escapeHtml(url)}" rel="noopener noreferrer">${escapeHtml(label)}</a></li>`
  ).join("");
  const others = ingredients.filter((item) => item.slug !== ingredient.slug && item.group === ingredient.group).slice(0, 3);

  const body = `
    <div class="ingredient-detail-container">
      ${breadcrumb([
        { href: "/", label: "ホーム" },
        { href: "/ingredients/", label: "成分・用語" },
        { label: ingredient.name }
      ])}
      <article class="ingredient-note">
        <header class="ingredient-detail-hero">
          <div class="ingredient-detail-copy">
            <p class="ingredient-kind">${escapeHtml(ingredient.kind)}</p>
            <h1>${escapeHtml(ingredient.name)}</h1>
            <p class="ingredient-reading">${escapeHtml(ingredient.reading)}</p>
            <p class="ingredient-answer">${escapeHtml(ingredient.summary)}</p>
            <dl class="ingredient-dates prominent">
              <div><dt>作成日</dt><dd><time datetime="${escapeHtml(ingredient.created)}">${escapeHtml(formatJapaneseDate(ingredient.created))}</time></dd></div>
              <div><dt>最終更新日</dt><dd><time datetime="${escapeHtml(ingredient.updated)}">${escapeHtml(formatJapaneseDate(ingredient.updated))}</time></dd></div>
            </dl>
          </div>
          ${renderIngredientVisual(ingredient)}
        </header>

        <p class="ingredient-lead">${escapeHtml(ingredient.lead)}</p>

        <section class="ingredient-facts" aria-label="${escapeHtml(ingredient.name)}について知っておきたいこと">
          ${facts}
        </section>

        <section class="ingredient-relation" aria-labelledby="ingredient-relation-title">
          <div class="ingredient-relation-art" data-group="${escapeHtml(ingredient.group)}" aria-hidden="true">
            <span></span><span></span><span></span><i></i><i></i>
          </div>
          <div>
            <p class="eyebrow">RELATION</p>
            <h2 id="ingredient-relation-title">似た言葉とのつながり</h2>
            <ul>${relation}</ul>
          </div>
        </section>

        <section class="ingredient-first-seen" aria-labelledby="first-seen-title">
          <div><span>最初の紹介</span><time datetime="${escapeHtml(ingredient.firstIntroduced)}">${escapeHtml(formatJapaneseDate(ingredient.firstIntroduced))}</time></div>
          <div><h2 id="first-seen-title">${escapeHtml(ingredient.firstLabel)}</h2><a class="text-link" href="${escapeHtml(ingredient.firstPath)}">この言葉を紹介したページを読む</a></div>
        </section>

        <section class="sources ingredient-sources" aria-labelledby="ingredient-sources-title">
          <h2 id="ingredient-sources-title">確認に使った情報源</h2>
          <ol>${sources}</ol>
        </section>
      </article>

      ${others.length ? `<section class="ingredient-more" aria-labelledby="ingredient-more-title"><h2 id="ingredient-more-title">関連する言葉</h2><div class="ingredient-mini-grid">${others.map((item) => `<a href="/ingredients/${escapeHtml(item.slug)}/">${renderIngredientVisual(item, true)}<strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.summary)}</span></a>`).join("")}</div></section>` : ""}
    </div>`;

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: ingredient.name,
    description: ingredient.summary,
    datePublished: ingredient.created,
    dateModified: ingredient.updated,
    url: absoluteUrl(pathName),
    mainEntity: {
      "@type": "DefinedTerm",
      name: ingredient.name,
      description: ingredient.summary,
      inDefinedTermSet: absoluteUrl("/ingredients/")
    }
  };

  return pageShell({
    pathName,
    title: `${ingredient.name}とは？`,
    description: `${ingredient.name}とは何か、似た言葉とどうつながるのかを、図と短い文章で紹介します。`,
    body,
    bodyClass: "ingredient-detail-page",
    structuredData: pageSchema
  });
}

function renderComparison(rows) {
  if (!rows?.length) return "";
  const [head, ...body] = rows;
  return `
    <div class="table-scroll" role="region" aria-label="用語比較表" tabindex="0">
      <table>
        <thead><tr>${head.map((cell) => `<th scope="col">${escapeHtml(cell)}</th>`).join("")}</tr></thead>
        <tbody>${body.map((row) => `<tr>${row.map((cell, index) => index === 0
          ? `<th scope="row">${escapeHtml(cell)}</th>`
          : `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </div>`;
}

function renderConceptFlow(items, note = "", title = "要点を、順番に見てみる") {
  if (!items?.length) return "";
  const steps = items.map(([eyebrow, title, text], index) => `
    <li>
      <span class="concept-step-number">${String(index + 1).padStart(2, "0")}</span>
      <div>
        <small>${escapeHtml(eyebrow)}</small>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(text)}</p>
      </div>
    </li>`).join("");
  return `
    <section class="concept-map" aria-labelledby="concept-map-title">
      <p class="eyebrow">STUDY MAP</p>
      <h2 id="concept-map-title">${escapeHtml(title)}</h2>
      <ol>${steps}</ol>
      ${note ? `<p class="concept-note">${escapeHtml(note)}</p>` : ""}
    </section>`;
}

function renderArticle(article) {
  const pathName = `/articles/${article.slug}/`;
  const articleBody = article.sections.map((section) => `
    <section>
      <h2>${escapeHtml(section.title)}</h2>
      ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
      ${section.link ? `<a class="article-inline-link" href="${escapeHtml(section.link.href)}">${escapeHtml(section.link.label)}<span aria-hidden="true">→</span></a>` : ""}
    </section>`).join("");
  const sources = article.sources.map((source) => `
    <li><a href="${escapeHtml(source.url)}" rel="noopener noreferrer">${escapeHtml(source.label)}</a></li>`).join("");
  const specifiedRelated = (article.relatedSlugs ?? [])
    .map((slug) => articles.find((candidate) => candidate.slug === slug))
    .filter(Boolean);
  const fallbackRelated = articles
    .filter((candidate) => candidate.slug !== article.slug && !specifiedRelated.includes(candidate))
    .sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category));
  const related = [...specifiedRelated, ...fallbackRelated].slice(0, 3);

  const body = `
    <div class="article-container">
      ${breadcrumb([
        { href: "/", label: "ホーム" },
        { href: "/articles/", label: "記事" },
        { label: article.title }
      ])}
      <article class="knowledge-article">
        <header class="article-header">
          <p class="article-category">${escapeHtml(article.category)}</p>
          <h1>${escapeHtml(article.title)}</h1>
          <p class="article-lead">${escapeHtml(article.lead)}</p>
          <div class="article-meta"><span>公開 ${escapeHtml(article.published)}</span><span>更新 ${escapeHtml(article.updated)}</span><span>${escapeHtml(article.readingTime)}</span><span>執筆：<a href="/about/">植井寛</a></span></div>
        </header>

        ${article.image ? `<figure class="article-hero-image">
          <img src="${escapeHtml(article.image)}" width="1440" height="960" alt="${escapeHtml(article.imageAlt)}" fetchpriority="high">
        </figure>` : ""}

        ${article.authorNote ? `<aside class="learning-note" aria-labelledby="learning-note-title">
          <div class="learning-note-label"><span>植井寛の</span><strong>学びメモ</strong></div>
          <div>
            <h2 id="learning-note-title">${escapeHtml(article.authorNote.title)}</h2>
            <p>${escapeHtml(article.authorNote.body)}</p>
          </div>
        </aside>` : ""}

        <section class="key-points" aria-labelledby="key-points-title">
          <h2 id="key-points-title">この記事の要点</h2>
          <ul>${article.summary.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>
        </section>

        ${renderConceptFlow(article.conceptFlow, article.conceptNote, article.conceptTitle)}
        ${renderComparison(article.comparison)}
        <div class="article-body">${articleBody}</div>

        <section class="sources" aria-labelledby="sources-title">
          <h2 id="sources-title">主な情報源</h2>
          <p>公開日・更新日に確認した一次資料です。外部サイトへ移動します。</p>
          <ol>${sources}</ol>
        </section>

      </article>

      ${authorCard(true)}

      <section class="related-articles" aria-labelledby="related-title">
        <h2 id="related-title">続けて読む</h2>
        <div class="article-grid">${related.map(renderArticleCard).join("")}</div>
      </section>
    </div>`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.published,
    dateModified: article.updated,
    ...(article.image ? {
      image: {
        "@type": "ImageObject",
        url: absoluteUrl(article.image),
        width: 1440,
        height: 960
      }
    } : {}),
    articleSection: article.category,
    inLanguage: "ja-JP",
    mainEntityOfPage: absoluteUrl(pathName),
    author: {
      "@type": "Person",
      name: site.authorName,
      url: absoluteUrl("/about/")
    },
    publisher: {
      "@type": "Organization",
      name: site.siteName,
      url: absoluteUrl("/"),
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/assets/brand/karada-seibun-lab-logo-1200.png")
      }
    }
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "記事", item: absoluteUrl("/articles/") },
      { "@type": "ListItem", position: 3, name: article.title, item: absoluteUrl(pathName) }
    ]
  };

  return pageShell({
    pathName,
    title: article.title,
    description: article.description,
    body,
    type: "article",
    image: article.image || site.authorImage,
    imageAlt: article.imageAlt || `からだ成分ラボ 執筆者 ${site.authorName}`,
    bodyClass: "article-page",
    structuredData: [articleSchema, breadcrumbSchema]
  });
}

function renderAbout() {
  const body = `
    <div class="content-container">
      ${breadcrumb([{ href: "/", label: "ホーム" }, { label: "植井寛について" }])}
      <section class="profile-hero">
        <img src="${site.authorImage}" width="1254" height="1254" alt="ノートを持つ植井寛の著者イラスト">
        <div>
          <p class="eyebrow">ABOUT THE AUTHOR</p>
          <h1>植井寛について</h1>
          <p class="profile-role">からだ成分ラボ 執筆・編集</p>
          <p>何でも知っている先生としてではなく、本や資料を読み、読者のみなさんと一緒に健康食品の成分や体の仕組みを学んでいきます。</p>
        </div>
      </section>

      <div class="prose-layout">
        <section>
          <h2>このサイトを作る理由</h2>
          <p>健康食品を調べると、難しい成分名、研究の見出し、体験談、販売ページが一度に現れます。「成分が体内で大切な役割を持つこと」と「その製品で期待どおりの結果が出ること」が混ざらないよう、情報を一つずつ分けて読む場所を作ります。</p>
          <p>核酸を看板テーマにしていますが、核酸だけを特別扱いせず、原材料、表示量、研究条件、価格、注意事項を同じ手順で確認します。</p>
        </section>

        <section>
          <h2>本と資料をどう読むか</h2>
          <p>本で出会った言葉を出発点に、公的機関、大学、査読論文、製造販売元の公式表示へ読み進めます。最初にどう理解していたか、どこでつまずいたか、調べて何が変わったかまで記録し、自分の言葉でまとめます。</p>
          <p>構成整理や下書きにAIを補助的に利用する場合がありますが、公開前に人が原典と表現を確認します。AIの出力だけを根拠として公開しません。</p>
        </section>

        <section>
          <h2>漫画と声で伝える</h2>
          <p>文章だけではつかみにくい仕組みは漫画や図にし、耳からも理解できるよう短い本人音声と字幕に展開します。急いで結論を出すのではなく、一つずつ言葉をほどく場所を育てます。</p>
          <p>人に伝えることで自分自身の理解も深めながら、生涯学習と執筆活動を続けます。</p>
        </section>
      </div>
    </div>`;

  return pageShell({
    pathName: "/about/",
    title: "植井寛について",
    description: "からだ成分ラボの執筆者・植井寛が、本や資料を読み、漫画と声で伝える理由を紹介します。",
    body,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      mainEntity: {
        "@type": "Person",
        name: site.authorName,
        description: "からだ成分ラボ 執筆・編集",
        image: absoluteUrl(site.authorImage),
        url: absoluteUrl("/about/")
      }
    }
  });
}

function renderEditorialPolicy() {
  const amazonPolicy = amazonAffiliateEnabled ? `
        <section id="affiliate">
          <h2>書籍紹介と広告</h2>
          <p>${escapeHtml(affiliate.amazon.disclosure)}</p>
          <p>書籍の紹介にはアフィリエイトリンクを含む場合があります。リンクを経由して購入されると紹介料が入る場合がありますが、紹介する本や感想は報酬の有無だけで決めません。</p>
        </section>` : "";
  const body = `
    <div class="content-container">
      ${breadcrumb([{ href: "/", label: "ホーム" }, { label: "運営・プライバシー" }])}
      <header class="page-hero">
        <p class="eyebrow">POLICY</p>
        <h1>運営・プライバシー</h1>
        <p>記事の作り方、情報源、訂正、プライバシーについてまとめます。</p>
        <p class="policy-date">制定：2026年7月27日／最終更新：2026年8月16日</p>
      </header>

      <nav class="policy-index" aria-label="このページの目次">
        <a href="#editorial">編集方針</a>
        <a href="#sources">情報源</a>
        <a href="#corrections">訂正方針</a>
        ${amazonAffiliateEnabled ? '<a href="#affiliate">書籍紹介と広告</a>' : ""}
        <a href="#privacy">プライバシー</a>
        <a href="#contact">問い合わせ</a>
      </nav>

      <div class="prose-layout policy-prose">
        <section id="editorial">
          <h2>編集方針</h2>
          <p>核酸や健康食品について、難しい言葉をほどき、原材料・量・価格・研究内容を自分で確かめられる記事を作ります。</p>
          <p>公的資料や原典を確かめ、読んだ本や調べた内容を植井寛の言葉で分かりやすく伝えます。</p>
        </section>

        <section id="sources">
          <h2>情報源と更新</h2>
          <p>公的機関、大学、査読論文、臨床試験登録、製造販売元の最新公式表示を優先します。記事末尾に主な情報源と公開・更新日を示します。価格、原材料、制度、研究状況など変わり得る情報は、更新時に再確認します。</p>
        </section>

        <section id="corrections">
          <h2>訂正方針</h2>
          <p>事実誤認、出典の不一致、誤解を招く表現が見つかった場合は速やかに修正し、結論へ影響する訂正は記事内に更新日と変更内容を記載します。単純な誤字や読みやすさの調整は、本文の修正のみとする場合があります。</p>
        </section>

        ${amazonPolicy}

        <section id="privacy">
          <h2>プライバシー</h2>
          <p>現在、このサイトには問い合わせフォーム、会員登録、購入機能、個人を識別する販売追跡機能はありません。購入者の氏名などを取得・照合しません。</p>
          <p>閲覧状況を把握し、記事やサイトを改善するためにGoogle Analytics 4を利用します。閲覧ページ、参照元、利用端末・ブラウザ、概算地域などがGoogleへ送信される場合があります。氏名や購入者情報をGoogle Analyticsへ送信しません。</p>
          <p>Googleによるデータの取り扱いは<a href="https://policies.google.com/privacy?hl=ja" rel="noopener noreferrer">Googleプライバシーポリシー</a>で確認できます。計測を希望しない場合は、ブラウザのCookie設定または<a href="https://tools.google.com/dlpage/gaoptout?hl=ja" rel="noopener noreferrer">Google アナリティクス オプトアウト アドオン</a>を利用できます。</p>
        </section>

        <section id="contact">
          <h2>問い合わせ</h2>
          <p>記事の訂正依頼と一般的な問い合わせ窓口は、公式SNSアカウント開設時にこのページへ掲載します。個別の診断、治療、服薬、摂取可否の相談には回答しません。</p>
        </section>
      </div>
    </div>`;

  return pageShell({
    pathName: "/editorial-policy/",
    title: "運営・プライバシー",
    description: "からだ成分ラボの記事制作、情報源、訂正、プライバシー、問い合わせ方針です。",
    body
  });
}

let panelIndex = 0;

function renderScriptLine(item) {
  const speaker = item.speaker ? `<span class="speaker">${escapeHtml(item.speaker)}</span>` : "";
  const text = item.kind === "display" || item.kind === "narration"
    ? escapeHtml(item.text)
    : item.kind === "sfx"
      ? `効果音「${escapeHtml(item.text)}」`
      : `「${escapeHtml(item.text)}」`;
  return `<p class="script-line ${escapeHtml(item.kind)}">${speaker}${text}</p>`;
}

function renderPanel(panel, episodeId) {
  const priority = panelIndex < 2;
  panelIndex += 1;
  const base = `/assets/episodes/${episodeId}/${panel.imageBase}`;
  const script = panel.script.map(renderScriptLine).join("\n");
  const scriptBlock = script;

  return `
    <figure class="manga-panel" id="${escapeHtml(panel.id)}">
      <div class="panel-image-wrap">
        <img
          class="panel-image"
          src="${base}-640.webp"
          srcset="${base}-640.webp 640w, ${base}-1254.webp 1254w"
          sizes="(max-width: 760px) calc(100vw - 20px), 736px"
          width="1254"
          height="1254"
          alt="${escapeHtml(panel.alt)}"
          loading="${priority ? "eager" : "lazy"}"
          decoding="async"${priority ? '\n          fetchpriority="high"' : ""}>
      </div>
      <figcaption class="panel-caption">
        <div class="panel-meta">
          <span class="panel-id">${escapeHtml(panel.id)}</span>
          <h3 class="panel-title">${escapeHtml(panel.title)}</h3>
        </div>
        <div class="panel-script">${scriptBlock}</div>
        <div class="work-tools"><button class="copy-script" type="button">セリフをコピー</button></div>
      </figcaption>
    </figure>`;
}

function renderScene(scene, episodeId) {
  const number = String(scene.number).padStart(2, "0");
  return `
    <section class="manga-scene" id="scene-${number}" aria-labelledby="scene-${number}-title">
      <header class="scene-heading">
        <span>${number}</span>
        <h2 id="scene-${number}-title">${escapeHtml(scene.title)}</h2>
      </header>
      ${scene.panels.map((panel) => renderPanel(panel, episodeId)).join("\n")}
    </section>`;
}

function renderEpisode(episode, episodeIndex) {
  panelIndex = 0;
  const sceneNav = episode.scenes.map((scene) => {
    const number = String(scene.number).padStart(2, "0");
    return `<a href="#scene-${number}" title="${escapeHtml(scene.title)}">${number}</a>`;
  }).join("\n");
  const scenes = episode.scenes.map((scene) => renderScene(scene, episode.id)).join("\n");
  const pageTitle = `${episode.title}｜${episode.siteName}`;
  const description = `${asSentence(episode.subtitle)}${asSentence(site.shortTagline)}`;
  const pathName = `/manga/${episode.id}/`;
  const firstPanel = episode.scenes[0].panels[0];
  const socialImage = absoluteUrl(`/assets/episodes/${episode.id}/${firstPanel.imageBase}-1254.webp`);
  const previous = episodes[episodeIndex - 1];
  const next = episodes[episodeIndex + 1];
  const sourceLinks = episode.sourceLinks.length
    ? `<p class="manga-source-links"><strong>参照した研究</strong>${episode.sourceLinks.map((source) => `<a href="${escapeHtml(source.url)}" rel="noopener noreferrer">${escapeHtml(source.label)}</a>`).join("")}</p>`
    : "";
  const episodeNavigation = `
    <nav class="episode-pagination" aria-label="漫画の前後移動">
      ${previous ? `<a class="previous" href="/manga/${previous.id}/"><small>前の話</small><strong>${escapeHtml(previous.title)}</strong></a>` : "<span></span>"}
      ${next ? `<a class="next" href="/manga/${next.id}/"><small>次の話</small><strong>${escapeHtml(next.title)}</strong></a>` : `<a class="next" href="/manga/"><small>漫画一覧へ</small><strong>3話を振り返る</strong></a>`}
    </nav>`;
  const articleSchema = {
    "@type": "Article",
    headline: episode.title,
    description,
    image: {
      "@type": "ImageObject",
      url: socialImage,
      width: 1254,
      height: 1254
    },
    dateModified: site.updated,
    author: { "@type": "Person", name: site.authorName, url: absoluteUrl("/about/") },
    mainEntityOfPage: absoluteUrl(pathName)
  };
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      articleSchema,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "漫画", item: absoluteUrl("/manga/") },
          { "@type": "ListItem", position: 3, name: episode.title, item: absoluteUrl(pathName) }
        ]
      }
    ]
  };

  const replacements = {
    "{{DESCRIPTION}}": description,
    "{{SOCIAL_IMAGE}}": socialImage,
    "{{SOCIAL_IMAGE_ALT}}": firstPanel.alt,
    "{{PAGE_TITLE}}": pageTitle,
    "{{SITE_NAME}}": episode.siteName,
    "{{SITE_TAGLINE}}": site.shortTagline,
    "{{STATUS}}": episode.status,
    "{{EPISODE_ID}}": episode.id,
    "{{EPISODE_NUMBER}}": String(episode.number),
    "{{EPISODE_TITLE}}": episode.title,
    "{{EPISODE_SUBTITLE}}": episode.subtitle,
    "{{EPISODE_QUESTION}}": episode.question,
    "{{EPISODE_CONCLUSION}}": episode.conclusion,
    "{{EDITORIAL_NOTE}}": episode.editorialNote,
    "{{SOURCE_LINKS}}": sourceLinks,
    "{{SCENE_NAV}}": sceneNav,
    "{{SCENES}}": scenes,
    "{{EPISODE_NAVIGATION}}": episodeNavigation,
    "{{CANONICAL}}": absoluteUrl(pathName),
    "{{AUTHOR_NAME}}": site.authorName,
    "{{BOOKS_HEADER_LINK}}": booksEnabled ? '<a href="/books/">読んでいる本</a>' : "",
    "{{BOOKS_FOOTER_LINK}}": booksEnabled ? '<a href="/books/">読んでいる本</a>' : "",
    "{{STYLES_VERSION}}": stylesVersion,
    "{{STRUCTURED_DATA}}": escapeJsonForHtml(schema)
  };

  let html = episodeTemplate;
  for (const [token, value] of Object.entries(replacements)) html = html.replaceAll(token, value);
  return html;
}

function renderMangaIndex() {
  const renderCastCard = (character) => {
    const research = character.research ? `<div class="cast-research">
      <p><strong>研究では</strong>${escapeHtml(character.research)}</p>
      <p><strong>漫画では</strong>${escapeHtml(character.story)}</p>
      <a href="${escapeHtml(character.sourceUrl)}" rel="noopener noreferrer">${escapeHtml(character.sourceLabel)}</a>
    </div>` : "";
    return `<article class="cast-card${character.research ? " ingredient" : ""}">
      <img src="${escapeHtml(character.image)}" width="480" height="480" alt="${escapeHtml(character.name)}の正面設定画" loading="lazy">
      <div class="cast-card-copy">
        <p class="cast-role">${escapeHtml(character.role)}</p>
        <h3>${escapeHtml(character.name)}</h3>
        <p>${escapeHtml(character.description)}</p>
        ${research}
      </div>
    </article>`;
  };
  const storyCastCards = mangaCast.characters.filter((character) => !character.research).map(renderCastCard).join("\n");
  const ingredientCastCards = mangaCast.characters.filter((character) => character.research).map(renderCastCard).join("\n");
  const cards = episodes.map((item) => {
    const firstPanel = item.scenes[0].panels[0];
    const count = item.scenes.reduce((sum, scene) => sum + scene.panels.length, 0);
    return `<article class="manga-index-card">
      <a class="manga-index-image" href="/manga/${item.id}/">
        <img src="/assets/episodes/${item.id}/${firstPanel.imageBase}-640.webp" width="640" height="640" alt="${escapeHtml(firstPanel.alt)}" loading="lazy">
      </a>
      <div><p class="eyebrow">第${item.number}話</p><h2><a href="/manga/${item.id}/">${escapeHtml(item.title)}</a></h2><p>${escapeHtml(item.subtitle)}</p><p class="manga-index-summary">${escapeHtml(item.conclusion)}</p><span>${item.scenes.length}シーン・${count}コマ</span></div>
    </article>`;
  }).join("\n");
  const body = `<div class="content-container manga-index-page">
    ${breadcrumb([{ href: "/", label: "ホーム" }, { label: "漫画" }])}
    <header class="page-hero"><p class="eyebrow">MANGA</p><h1>体内物流センターの物語</h1><p>食事のあとに起きる混雑、食事前の準備、二個目のケーキ。三つの短い話に分けて、順番に読めます。</p></header>
    <section class="cast-section" id="cast" aria-labelledby="cast-title">
      <div class="section-heading-row"><div><p class="eyebrow">CAST</p><h2 id="cast-title">${escapeHtml(mangaCast.title)}</h2><p>${escapeHtml(mangaCast.lead)}</p></div></div>
      <div class="cast-grid">${storyCastCards}</div>
      <div class="ingredient-heading"><p class="eyebrow">INGREDIENT TEAM</p><h3>成分スタッフは、何をヒントにしたキャラクター？</h3><p>研究で扱われているポイントと、漫画の中での仕事を並べて紹介します。</p></div>
      <div class="cast-grid ingredient-grid">${ingredientCastCards}</div>
    </section>
    <div class="episode-list-heading"><p class="eyebrow">STORIES</p><h2>全3話を読む</h2></div>
    <div class="manga-index-list">${cards}</div>
  </div>`;
  return pageShell({ pathName: "/manga/", title: "漫画", description: "体の仕組みを物流センターにたとえた、全3話の漫画です。", body });
}

function render404() {
  const body = `
    <div class="content-container">
      <header class="page-hero">
        <p class="eyebrow">404</p>
        <h1>ページが見つかりません</h1>
        <p>URLが変わったか、ページがまだ公開されていない可能性があります。</p>
        <div class="button-row"><a class="button primary" href="/">トップへ戻る</a><a class="button secondary" href="/articles/">記事を探す</a></div>
      </header>
    </div>`;
  return pageShell({
    pathName: "/404.html",
    title: "ページが見つかりません",
    description: "お探しのページは見つかりませんでした。",
    body
  }).replace('content="index,follow,max-image-preview:large"', 'content="noindex,follow"');
}

async function writePage(relativePath, html) {
  const outputPath = path.join(dist, relativePath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf8");
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(path.join(root, "public"), dist, { recursive: true });
await cp(path.join(root, "src", "styles.css"), path.join(dist, "styles.css"));
await cp(path.join(root, "src", "app.js"), path.join(dist, "app.js"));

await writePage("index.html", renderHome());
await writePage("articles/index.html", renderArticleIndex());
for (const article of articles) {
  await writePage(`articles/${article.slug}/index.html`, renderArticle(article));
}
await writePage("ingredients/index.html", renderIngredientIndex());
for (const ingredient of ingredients) {
  await writePage(`ingredients/${ingredient.slug}/index.html`, renderIngredient(ingredient));
}
await writePage("about/index.html", renderAbout());
if (booksEnabled) await writePage("books/index.html", renderBooks());
await writePage("editorial-policy/index.html", renderEditorialPolicy());
await writePage("manga/index.html", renderMangaIndex());
for (const [index, item] of episodes.entries()) {
  await writePage(`manga/${item.id}/index.html`, renderEpisode(item, index));
}
await writePage("404.html", render404());

const sitemapEntries = [
  { path: "/", lastmod: site.updated },
  { path: "/articles/", lastmod: site.updated },
  ...articles.map((article) => ({
    path: `/articles/${article.slug}/`,
    lastmod: article.updated,
    image: article.image,
    imageTitle: article.title
  })),
  { path: "/ingredients/", lastmod: ingredients.reduce((latest, item) => item.updated > latest ? item.updated : latest, site.updated) },
  ...ingredients.map((ingredient) => ({ path: `/ingredients/${ingredient.slug}/`, lastmod: ingredient.updated })),
  { path: "/manga/", lastmod: site.updated },
  ...episodes.map((item) => ({ path: `/manga/${item.id}/`, lastmod: site.updated })),
  { path: "/about/", lastmod: site.updated },
  ...(booksEnabled ? [{ path: "/books/", lastmod: books.reduce((latest, item) => item.started && item.started > latest ? item.started : latest, site.updated) }] : []),
  { path: "/editorial-policy/", lastmod: site.updated }
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${sitemapEntries.map((entry) => `  <url><loc>${absoluteUrl(entry.path)}</loc><lastmod>${entry.lastmod}</lastmod>${entry.image ? `<image:image><image:loc>${absoluteUrl(entry.image)}</image:loc><image:title>${escapeHtml(entry.imageTitle)}</image:title></image:image>` : ""}</url>`).join("\n")}
</urlset>
`;
await writePage("sitemap.xml", sitemap);
await writePage("robots.txt", `User-agent: *
Allow: /
Sitemap: ${absoluteUrl("/sitemap.xml")}
`);

const mangaPanelCount = episodes.reduce((sum, item) => sum + item.scenes.reduce((sceneSum, scene) => sceneSum + scene.panels.length, 0), 0);
console.log(`Built ${articles.length} articles, ${ingredients.length} ingredient notes, ${episodes.length} manga episodes and ${mangaPanelCount} panels in ${dist}`);
