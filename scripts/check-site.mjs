import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const episode = JSON.parse(await readFile(path.join(root, "content", "episodes", "001.json"), "utf8"));
const html = await readFile(path.join(root, "dist", "index.html"), "utf8");
const panels = episode.scenes.flatMap((scene) => scene.panels);
const scriptLines = panels.flatMap((panel) => panel.script);
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

expect(episode.scenes.length === 17, `Expected 17 scenes, got ${episode.scenes.length}`);
expect(panels.length === 87, `Expected 87 panels, got ${panels.length}`);
expect(new Set(panels.map((panel) => panel.id)).size === panels.length, "Panel IDs are not unique");
expect(!panels.some((panel) => panel.id === "S01-C02"), "Rejected panel S01-C02 must not be published");
expect((html.match(/<figure class="manga-panel"/g) ?? []).length === 87, "Built HTML must contain 87 panel figures");
expect((html.match(/class="script-line /g) ?? []).length === scriptLines.length + 3, "Built HTML script-line count is inconsistent");
expect(!html.includes("{{"), "Unexpanded template token found in index.html");
expect(html.includes('meta name="robots" content="noindex,nofollow"'), "Draft noindex meta is missing");

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

if (failures.length) {
  console.error("Site check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  scenes: episode.scenes.length,
  panels: panels.length,
  scriptLines: scriptLines.length,
  webpFiles: publicImages.length,
  imageMiB: Number((imageBytes / 1024 / 1024).toFixed(1))
}, null, 2));
