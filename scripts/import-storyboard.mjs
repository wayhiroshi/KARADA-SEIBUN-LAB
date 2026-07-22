import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "manga_storyboard.md");
const outputPath = path.join(root, "content", "episodes", "001.json");
const markdown = await readFile(sourcePath, "utf8");

const episode = {
  id: "001",
  siteName: "からだ成分ラボ",
  siteTagline: "まんがでわかる、栄養と健康成分",
  title: "ランチ15分前、からだの中では？",
  subtitle: "糖の流れを整える、体内物流チームの物語",
  status: "制作確認版",
  scenes: []
};

let scene = null;
let panel = null;

function flushPanel() {
  if (!panel || !scene) return;
  if (panel.title.includes("欠番")) {
    panel = null;
    return;
  }
  panel.imageBase = panel.id;
  panel.alt = panel.description || `${scene.title}の${panel.id}`;
  scene.panels.push(panel);
  panel = null;
}

function flushScene() {
  flushPanel();
  if (scene?.panels.length) episode.scenes.push(scene);
  scene = null;
}

function cleanValue(value) {
  return value.trim().replace(/。?$/, (match) => match);
}

function parseScript(kind, raw, defaultSpeaker = "") {
  const value = raw.trim();
  const quoted = value.match(/^(.+?)「([\s\S]*)」$/);
  if (quoted) {
    return {
      kind,
      speaker: quoted[1].trim().replace(/[：:]$/, ""),
      text: quoted[2].trim()
    };
  }
  const onlyQuote = value.match(/^「([\s\S]*)」$/);
  if (onlyQuote) {
    return { kind, speaker: defaultSpeaker, text: onlyQuote[1].trim() };
  }
  return { kind, speaker: defaultSpeaker, text: value };
}

for (const line of markdown.split(/\r?\n/)) {
  const sceneMatch = line.match(/^# シーン(\d{2})[　\s]+(.+)$/);
  if (sceneMatch) {
    flushScene();
    scene = {
      id: `S${sceneMatch[1]}`,
      number: Number(sceneMatch[1]),
      title: sceneMatch[2].trim(),
      panels: []
    };
    continue;
  }

  const panelMatch = line.match(/^## (S\d{2}-C\d{2})[　\s]+(.+)$/);
  if (panelMatch && scene) {
    flushPanel();
    panel = {
      id: panelMatch[1],
      title: panelMatch[2].trim(),
      description: "",
      script: []
    };
    continue;
  }

  if (!panel) continue;

  const field = line.match(/^- \*\*(.+?)\*\*[：:](.*)$/);
  if (!field) continue;

  const label = field[1].trim();
  const value = cleanValue(field[2]);

  if (label === "描画内容") {
    panel.description = value;
    continue;
  }

  const kindMap = {
    "台詞": "speech",
    "ナレーション": "narration",
    "効果音": "sfx",
    "館内放送": "broadcast",
    "無線の声": "broadcast",
    "電話の声": "broadcast",
    "センサー音声": "broadcast",
    "センサー表示": "display"
  };

  if (kindMap[label]) {
    const defaultSpeaker = label === "台詞" || label === "効果音" ? "" : label;
    panel.script.push(parseScript(kindMap[label], value, defaultSpeaker));
  }
}

flushScene();

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(episode, null, 2)}\n`, "utf8");

const panelCount = episode.scenes.reduce((sum, item) => sum + item.panels.length, 0);
console.log(`Imported ${episode.scenes.length} scenes and ${panelCount} panels to ${outputPath}`);
