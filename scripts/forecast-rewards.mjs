import { access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const calculatorRoot = process.env.FORDAYS_REWARD_CALCULATOR_DIR
  ? path.resolve(process.env.FORDAYS_REWARD_CALCULATOR_DIR)
  : path.resolve(projectRoot, "../Fordays報酬計算");
const calculator = path.join(calculatorRoot, "scripts/shopping-mall-forecast.mjs");

try {
  await access(calculator);
} catch {
  throw new Error(
    `Fordays報酬計算の共通計算CLIが見つかりません: ${calculator}\n` +
    "別の場所にある場合はFORDAYS_REWARD_CALCULATOR_DIRを指定してください。"
  );
}

const result = spawnSync(process.execPath, [calculator, ...process.argv.slice(2)], {
  cwd: calculatorRoot,
  stdio: "inherit"
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
