import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const episode = JSON.parse(await readFile(path.join(root, "content", "episodes", "001.json"), "utf8"));
const template = await readFile(path.join(root, "src", "index.template.html"), "utf8");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderScriptLine(item) {
  const speaker = item.speaker ? `<span class="speaker">${escapeHtml(item.speaker)}</span>` : "";
  const text = item.kind === "display"
    ? escapeHtml(item.text)
    : item.kind === "sfx"
      ? `効果音「${escapeHtml(item.text)}」`
      : `「${escapeHtml(item.text)}」`;
  return `<p class="script-line ${escapeHtml(item.kind)}">${speaker}${text}</p>`;
}

let panelIndex = 0;

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

const sceneNav = episode.scenes.map((scene) => {
  const number = String(scene.number).padStart(2, "0");
  return `<a href="#scene-${number}" title="${escapeHtml(scene.title)}">${number}</a>`;
}).join("\n");

const scenes = episode.scenes.map(renderScene).join("\n");
const pageTitle = `${episode.title}｜${episode.siteName}`;
const description = `${episode.subtitle}。${episode.siteTagline}。`;

const replacements = {
  "{{DESCRIPTION}}": description,
  "{{PAGE_TITLE}}": pageTitle,
  "{{SITE_NAME}}": episode.siteName,
  "{{SITE_TAGLINE}}": episode.siteTagline,
  "{{STATUS}}": episode.status,
  "{{EPISODE_ID}}": episode.id,
  "{{EPISODE_TITLE}}": episode.title,
  "{{EPISODE_SUBTITLE}}": episode.subtitle,
  "{{SCENE_NAV}}": sceneNav,
  "{{SCENES}}": scenes
};

let html = template;
for (const [token, value] of Object.entries(replacements)) html = html.replaceAll(token, value);

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(path.join(root, "public"), dist, { recursive: true });
await cp(path.join(root, "src", "styles.css"), path.join(dist, "styles.css"));
await cp(path.join(root, "src", "app.js"), path.join(dist, "app.js"));
await writeFile(path.join(dist, "index.html"), html, "utf8");
await writeFile(path.join(dist, "robots.txt"), "User-agent: *\nDisallow: /\n", "utf8");

console.log(`Built ${episode.scenes.length} scenes and ${panelIndex} panels in ${dist}`);
