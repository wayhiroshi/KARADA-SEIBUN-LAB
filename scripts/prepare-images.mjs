import { access, mkdir, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const episodeIds = ["001", "002", "003"];
const variants = [
  { suffix: "640", size: 640, quality: 80 },
  { suffix: "1254", size: 1254, quality: 84 }
];

for (const episodeId of episodeIds) {
  const episode = JSON.parse(await readFile(path.join(root, "content", "episodes", `${episodeId}.json`), "utf8"));
  const outputDir = path.join(root, "public", "assets", "episodes", episodeId);
  await mkdir(outputDir, { recursive: true });

  const panels = episode.scenes.flatMap((scene) => scene.panels);
  for (const panel of panels) {
    const input = path.join(root, panel.source);
    await access(input);
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
  console.log(`Prepared episode ${episodeId}: ${panels.length * variants.length} WebP files`);
}
