import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const episode = JSON.parse(await readFile(path.join(root, "content", "episodes", "001.json"), "utf8"));
const site = JSON.parse(await readFile(path.join(root, "content", "site.json"), "utf8"));
const articles = JSON.parse(await readFile(path.join(root, "content", "articles.json"), "utf8"));
const episodeTemplate = await readFile(path.join(root, "src", "index.template.html"), "utf8");

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
        ${navLink("/manga/001/", "漫画", currentPath)}
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
        <a href="/manga/001/">漫画</a>
        <a href="/about/">著者情報</a>
        <a href="/editorial-policy/">編集・広告・プライバシー方針</a>
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
  structuredData = [],
  bodyClass = ""
}) {
  const pageTitle = pathName === "/" ? `${site.siteName} ${site.byline}` : `${title}｜${site.siteName}`;
  const canonical = absoluteUrl(pathName);
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
  <meta property="og:image" content="${absoluteUrl(site.authorImage)}">
  <meta name="twitter:card" content="summary">
  <title>${escapeHtml(pageTitle)}</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/styles.css">
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
        <h2 id="author-card-title">植井寛（ペンネーム）</h2>
        <p>健康食品の成分名や研究、広告を生活者の目線で読み解く「からだ成分ラボ」の執筆者です。医師・薬剤師・管理栄養士などの資格者としてではなく、一次資料と公式表示を確認して情報を整理します。</p>
        <p class="relationship-note">フォーデイズ会員です。製品を紹介する広告投稿から購入があった場合、紹介者に販売ボーナス等が反映されます。一般解説と販売投稿は分離します。</p>
        <a class="text-link" href="/about/">著者と運営方針を詳しく読む</a>
      </div>
    </section>`;
}

function renderArticleCard(article) {
  return `
    <article class="article-card">
      <p class="article-category">${escapeHtml(article.category)}</p>
      <h3><a href="/articles/${escapeHtml(article.slug)}/">${escapeHtml(article.title)}</a></h3>
      <p>${escapeHtml(article.description)}</p>
      <div class="article-meta"><span>更新 ${escapeHtml(article.updated)}</span><span>${escapeHtml(article.readingTime)}</span></div>
    </article>`;
}

function renderHome() {
  const body = `
    <section class="home-hero">
      <div>
        <p class="eyebrow">KARADA SEIBUN LAB</p>
        <h1>50代から、<br>成分名に振り回されない。</h1>
        <p class="hero-copy">漫画でほどく、からだ成分ラボ。</p>
        <p class="hero-description">${escapeHtml(site.description)}</p>
        <div class="button-row">
          <a class="button primary" href="/articles/kakusan-toha/">核酸の基礎から読む</a>
          <a class="button secondary" href="/manga/001/">漫画を読む</a>
        </div>
      </div>
      <div class="hero-note" aria-label="このサイトの三つの約束">
        <span>01</span><p><strong>成分と製品を分ける</strong>一般的な説明を、特定製品の効果へ置き換えません。</p>
        <span>02</span><p><strong>研究の限界も書く</strong>対象、期間、研究段階、利益相反まで確認します。</p>
        <span>03</span><p><strong>広告関係を隠さない</strong>販売投稿は一般情報と分離し、PRであることを明示します。</p>
      </div>
    </section>

    <section class="section-block" aria-labelledby="latest-title">
      <div class="section-heading-row">
        <div><p class="eyebrow">START HERE</p><h2 id="latest-title">核酸と健康食品を、基礎から読む</h2></div>
        <a class="text-link" href="/articles/">すべての記事</a>
      </div>
      <div class="article-grid">${articles.map(renderArticleCard).join("")}</div>
    </section>

    <section class="manga-feature">
      <div class="manga-feature-image">
        <img src="/assets/episodes/001/S01-C01-640.webp" width="640" height="640" alt="昼食を準備する主人公を描いた漫画の一コマ" loading="lazy">
      </div>
      <div>
        <p class="eyebrow">MANGA EPISODE 001</p>
        <h2>${escapeHtml(episode.title)}</h2>
        <p>${escapeHtml(episode.subtitle)}。体の仕組みを体内物流センターに置き換えた、制作確認版の漫画です。</p>
        <a class="button secondary" href="/manga/001/">17シーンの漫画を読む</a>
      </div>
    </section>

    ${authorCard()}

    <aside class="separation-notice">
      <strong>販売導線について</strong>
      <p>このサイトには、フォーデイズショッピングモールの個人用招待URL・QRや、販売投稿への誘導を掲載していません。媒体ごとの利用条件についてフォーデイズから書面確認を得るまでは、健康情報サイトと販売SNSを分離します。</p>
    </aside>`;

  return pageShell({
    pathName: "/",
    title: site.siteName,
    description: site.description,
    body,
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
        <p>広告の言葉に急かされず、成分・研究・製品表示を自分で確かめるための基礎資料です。</p>
      </header>
      <div class="article-grid">${articles.map(renderArticleCard).join("")}</div>
      <aside class="information-note">
        <strong>記事の位置づけ</strong>
        <p>診断、治療、予防を目的とした医療情報ではありません。体調や服薬に不安がある場合は、医師・薬剤師などへ相談してください。</p>
      </aside>
    </div>`;

  return pageShell({
    pathName: "/articles/",
    title: "核酸と成分の記事",
    description: "核酸、DNA、RNA、ヌクレオチド、健康食品広告、研究の読み方を生活者目線で整理した記事一覧です。",
    body,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "核酸と成分の記事",
      url: absoluteUrl("/articles/"),
      description: "核酸と健康食品の成分表示、研究、広告を読み解く記事一覧"
    }
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

function renderArticle(article) {
  const pathName = `/articles/${article.slug}/`;
  const articleBody = article.sections.map((section) => `
    <section>
      <h2>${escapeHtml(section.title)}</h2>
      ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    </section>`).join("");
  const sources = article.sources.map((source) => `
    <li><a href="${escapeHtml(source.url)}" rel="noopener noreferrer">${escapeHtml(source.label)}</a></li>`).join("");
  const related = articles.filter((candidate) => candidate.slug !== article.slug).slice(0, 3);

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

        <aside class="relationship-disclosure" aria-label="筆者と広告の関係">
          <strong>筆者と広告の関係</strong>
          <p>筆者はフォーデイズ会員です。製品を紹介する広告投稿から購入があった場合、紹介者に販売ボーナス等が反映されます。この記事は一般情報であり、個人用招待URL・QRや購入リンクは掲載していません。</p>
        </aside>

        <section class="key-points" aria-labelledby="key-points-title">
          <h2 id="key-points-title">この記事の要点</h2>
          <ul>${article.summary.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>
        </section>

        ${renderComparison(article.comparison)}
        <div class="article-body">${articleBody}</div>

        <section class="sources" aria-labelledby="sources-title">
          <h2 id="sources-title">主な情報源</h2>
          <p>公開日・更新日に確認した一次資料です。外部サイトへ移動します。</p>
          <ol>${sources}</ol>
        </section>

        <aside class="medical-note">
          <strong>健康情報について</strong>
          <p>この記事は一般的な情報提供を目的とし、診断・治療・予防や、特定製品の効果を保証するものではありません。健康づくりはバランスのよい食生活が基本です。通院中・服薬中など不安がある場合は医療機関へ相談してください。</p>
        </aside>
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
    mainEntityOfPage: absoluteUrl(pathName),
    author: {
      "@type": "Person",
      name: site.authorName,
      url: absoluteUrl("/about/")
    },
    publisher: {
      "@type": "Organization",
      name: site.siteName,
      url: absoluteUrl("/")
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
          <p>植井寛はペンネームです。健康食品の成分名や研究、広告の読み方を、50代以降の生活者が自分で確かめられる形に整理します。</p>
        </div>
      </section>

      <div class="prose-layout">
        <section>
          <h2>このサイトを作る理由</h2>
          <p>健康食品を調べると、難しい成分名、研究の見出し、体験談、販売ページが一度に現れます。「成分が体内で大切な役割を持つこと」と「その製品で期待どおりの結果が出ること」が混ざらないよう、情報を一つずつ分けて読む場所を作ります。</p>
          <p>核酸を看板テーマにしていますが、核酸だけを特別扱いせず、原材料、表示量、研究条件、価格、注意事項を同じ手順で確認します。</p>
        </section>

        <section>
          <h2>専門資格と情報の作り方</h2>
          <p>医師・薬剤師・管理栄養士などの資格者として執筆しているものではありません。公的機関、大学、査読論文、製造販売元の公式表示を優先し、出典と更新日を記事ごとに示します。</p>
          <p>構成整理や下書きにAIを補助的に利用する場合がありますが、公開前に人が原典と表現を確認します。AIの出力だけを根拠として公開しません。</p>
        </section>

        <section>
          <h2>フォーデイズとの関係</h2>
          <p>植井寛はフォーデイズ会員で、Natural DNコラーゲンを実際に利用しています。味、費用、手間、続け方など観察できる使用経験は、事実と主観を分けて記録します。体調改善や若返りなどの効果を体験談から断定しません。</p>
          <p>フォーデイズ製品を紹介する広告投稿から購入があった場合、紹介者に販売ボーナス等が反映されます。購入者は公式ショッピングモールでは会員登録なしに通常価格で購入でき、販売・配送はフォーデイズ社が行います。一般情報の記事と製品の販売投稿は分離します。</p>
          <p><a href="https://fordays.jp/howto/" rel="noopener noreferrer">フォーデイズ公式「購入をお考えの方へ」</a></p>
        </section>
      </div>
    </div>`;

  return pageShell({
    pathName: "/about/",
    title: "植井寛について",
    description: "からだ成分ラボの執筆者・植井寛の立場、情報の作り方、フォーデイズとの関係を明示します。",
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
  const body = `
    <div class="content-container">
      ${breadcrumb([{ href: "/", label: "ホーム" }, { label: "編集・広告・プライバシー方針" }])}
      <header class="page-hero">
        <p class="eyebrow">POLICY</p>
        <h1>編集・広告・プライバシー方針</h1>
        <p>読者が「誰が、どの立場で、どう作った情報か」を確認できるよう、運営基準を公開します。</p>
        <p class="policy-date">制定・最終更新：2026年7月27日</p>
      </header>

      <nav class="policy-index" aria-label="このページの目次">
        <a href="#editorial">編集方針</a>
        <a href="#advertising">広告方針</a>
        <a href="#sources">情報源</a>
        <a href="#corrections">訂正方針</a>
        <a href="#privacy">プライバシー</a>
        <a href="#contact">問い合わせ</a>
      </nav>

      <div class="prose-layout policy-prose">
        <section id="editorial">
          <h2>編集方針</h2>
          <ul>
            <li>成分の一般解説と、特定製品の効果を分けます。</li>
            <li>研究を紹介するときは、対象、期間、研究段階、限界、利益相反を確認します。</li>
            <li>病気の診断、治療、予防、身体機能の改善を食品の効果として断定しません。</li>
            <li>読者に役立つ独立した内容を優先し、検索順位だけを目的に大量生成しません。</li>
            <li>AIを補助的に使う場合も、原典確認と最終判断は人が行います。</li>
          </ul>
        </section>

        <section id="advertising">
          <h2>広告・利害関係の方針</h2>
          <p>執筆者はフォーデイズ会員です。フォーデイズ製品の広告投稿を行い、招待コード経由の購入により販売ボーナス等が反映される可能性があります。</p>
          <p>販売投稿では、冒頭または見落とされない位置に「PR」または「広告」を表示し、公式ガイドに従って公式ショッピングモールロゴを掲載します。一般解説記事から研究を購入理由へ直接接続しません。</p>
          <p>フォーデイズから媒体利用について書面回答を得るまで、このサイトには個人用招待URL・QR、販売SNSへの計画的導線、有料広告を設置しません。</p>
        </section>

        <section id="sources">
          <h2>情報源と更新</h2>
          <p>公的機関、大学、査読論文、臨床試験登録、製造販売元の最新公式表示を優先します。記事末尾に主な情報源と公開・更新日を示します。価格、原材料、制度、研究状況など変わり得る情報は、更新時に再確認します。</p>
        </section>

        <section id="corrections">
          <h2>訂正方針</h2>
          <p>事実誤認、出典の不一致、誤解を招く表現が見つかった場合は速やかに修正し、結論へ影響する訂正は記事内に更新日と変更内容を記載します。単純な誤字や読みやすさの調整は、本文の修正のみとする場合があります。</p>
        </section>

        <section id="privacy">
          <h2>プライバシー</h2>
          <p>現在、このサイトには問い合わせフォーム、会員登録、購入機能、個人を識別する販売追跡機能はありません。購入者の氏名などを取得・照合しません。</p>
          <p>アクセス解析を導入する場合は、利用目的、取得項目、提供先、オプトアウト方法をこのページへ追記してから有効化します。現在はアクセス解析IDが未設定のため、Google Analyticsの計測タグは出力されません。</p>
        </section>

        <section id="contact">
          <h2>問い合わせ</h2>
          <p>記事の訂正依頼と一般的な問い合わせ窓口は、公式SNSアカウント開設時にこのページへ掲載します。個別の診断、治療、服薬、摂取可否の相談には回答しません。</p>
        </section>
      </div>
    </div>`;

  return pageShell({
    pathName: "/editorial-policy/",
    title: "編集・広告・プライバシー方針",
    description: "からだ成分ラボの編集基準、広告関係、情報源、訂正、プライバシー、問い合わせ方針です。",
    body
  });
}

let panelIndex = 0;

function renderScriptLine(item) {
  const speaker = item.speaker ? `<span class="speaker">${escapeHtml(item.speaker)}</span>` : "";
  const text = item.kind === "display"
    ? escapeHtml(item.text)
    : item.kind === "sfx"
      ? `効果音「${escapeHtml(item.text)}」`
      : `「${escapeHtml(item.text)}」`;
  return `<p class="script-line ${escapeHtml(item.kind)}">${speaker}${text}</p>`;
}

function renderPanel(panel) {
  const priority = panelIndex < 2;
  panelIndex += 1;
  const base = `/assets/episodes/001/${panel.imageBase}`;
  const script = panel.script.map(renderScriptLine).join("\n");
  const scriptBlock = script || '<p class="script-line narration">このコマにはセリフはありません。</p>';

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

function renderScene(scene) {
  const number = String(scene.number).padStart(2, "0");
  return `
    <section class="manga-scene" id="scene-${number}" aria-labelledby="scene-${number}-title">
      <header class="scene-heading">
        <span>${number}</span>
        <h2 id="scene-${number}-title">${escapeHtml(scene.title)}</h2>
      </header>
      ${scene.panels.map(renderPanel).join("\n")}
    </section>`;
}

function renderEpisode() {
  panelIndex = 0;
  const sceneNav = episode.scenes.map((scene) => {
    const number = String(scene.number).padStart(2, "0");
    return `<a href="#scene-${number}" title="${escapeHtml(scene.title)}">${number}</a>`;
  }).join("\n");
  const scenes = episode.scenes.map(renderScene).join("\n");
  const pageTitle = `${episode.title}｜${episode.siteName}`;
  const description = `${episode.subtitle}。${site.shortTagline}。`;
  const pathName = "/manga/001/";
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: episode.title,
    description,
    datePublished: "2026-07-22",
    dateModified: site.updated,
    author: { "@type": "Person", name: site.authorName, url: absoluteUrl("/about/") },
    mainEntityOfPage: absoluteUrl(pathName)
  };

  const replacements = {
    "{{DESCRIPTION}}": description,
    "{{PAGE_TITLE}}": pageTitle,
    "{{SITE_NAME}}": episode.siteName,
    "{{SITE_TAGLINE}}": site.shortTagline,
    "{{STATUS}}": episode.status,
    "{{EPISODE_ID}}": episode.id,
    "{{EPISODE_TITLE}}": episode.title,
    "{{EPISODE_SUBTITLE}}": episode.subtitle,
    "{{SCENE_NAV}}": sceneNav,
    "{{SCENES}}": scenes,
    "{{CANONICAL}}": absoluteUrl(pathName),
    "{{AUTHOR_NAME}}": site.authorName,
    "{{STRUCTURED_DATA}}": escapeJsonForHtml(schema)
  };

  let html = episodeTemplate;
  for (const [token, value] of Object.entries(replacements)) html = html.replaceAll(token, value);
  return html;
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
await writePage("about/index.html", renderAbout());
await writePage("editorial-policy/index.html", renderEditorialPolicy());
await writePage("manga/001/index.html", renderEpisode());
await writePage("404.html", render404());

const sitemapPaths = [
  "/",
  "/articles/",
  ...articles.map((article) => `/articles/${article.slug}/`),
  "/manga/001/",
  "/about/",
  "/editorial-policy/"
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPaths.map((pagePath) => `  <url><loc>${absoluteUrl(pagePath)}</loc><lastmod>${site.updated}</lastmod></url>`).join("\n")}
</urlset>
`;
await writePage("sitemap.xml", sitemap);
await writePage("robots.txt", `User-agent: *
Allow: /
Sitemap: ${absoluteUrl("/sitemap.xml")}
`);

console.log(`Built ${articles.length} articles, ${episode.scenes.length} manga scenes and ${panelIndex} panels in ${dist}`);
