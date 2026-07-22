import { mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const episode = JSON.parse(await (await import("node:fs/promises")).readFile(path.join(root, "content", "episodes", "001.json"), "utf8"));
const sourceDir = path.join(root, "generated");
const outputDir = path.join(root, "public", "assets", "episodes", "001");

await mkdir(outputDir, { recursive: true });

const panels = episode.scenes.flatMap((scene) => scene.panels);
const variants = [
  { suffix: "640", size: 640, quality: 80 },
  { suffix: "1254", size: 1254, quality: 84 }
];

for (const panel of panels) {
  const input = path.join(sourceDir, `${panel.imageBase}.png`);
  for (const variant of variants) {
    const output = path.join(outputDir, `${panel.imageBase}-${variant.suffix}.webp`);
    const result = spawnSync("cwebp", [
      "-quiet",
      "-m", "6",
      "-q", String(variant.quality),
      "-resize", String(variant.size), String(variant.size),
      input,
      "-o", output
    ], { stdio: "inherit" });
    if (result.status !== 0) throw new Error(`cwebp failed for ${panel.id} (${variant.suffix})`);
  }
}

console.log(`Prepared ${panels.length * variants.length} WebP files in ${outputDir}`);
