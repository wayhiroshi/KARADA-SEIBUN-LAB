import { mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "public", "assets", "manga", "cast");
const workDir = path.join(root, "tmp", "cast-images");
await mkdir(outputDir, { recursive: true });
await mkdir(workDir, { recursive: true });

const cast = [
  ["protagonist", "chara1.png"],
  ["rookie", "chara2.png"],
  ["captain", "chara3.png"],
  ["factory-manager", "chara4.png"],
  ["warehouse-manager", "chara5.png"],
  ["salacia", "chara6.png"],
  ["kothala", "chara7.png"],
  ["mulberry", "chara8.png"],
  ["gymnema", "chara9.png"],
  ["tea-doctor", "chara10.png"]
];

function run(command, args, label) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${label} failed`);
}

for (const [slug, filename] of cast) {
  const input = path.join(root, "assets", filename);
  const cropped = path.join(workDir, `${slug}.png`);
  const output = path.join(outputDir, `${slug}.webp`);
  run("sips", ["-c", "500", "500", "--cropOffset", "245", "5", input, "-o", cropped], `crop ${slug}`);
  run("cwebp", ["-quiet", "-m", "6", "-q", "84", "-resize", "480", "480", cropped, "-o", output], `webp ${slug}`);
}

console.log(`Prepared ${cast.length} cast portraits in ${outputDir}`);
