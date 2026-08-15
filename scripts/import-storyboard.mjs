import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "docs", "manga-revised-script-3episodes.md");
const outputDir = path.join(root, "content", "episodes");
const markdown = await readFile(sourcePath, "utf8");

const episodeMeta = {
  "001": {
    title: "新人配送員、初ランチ便！",
    subtitle: "普通に食事をしたとき、体内物流センターでは？",
    question: "いつものように食事をすると、体の中ではどんなことが起きる？",
    conclusion: "お茶を飲まず、いつものように食事をした主人公。糖分が一度に届いた体内工場と配送センターは、たちまち大忙しになります。"
  },
  "002": {
    title: "ランチ前の準備チーム",
    subtitle: "サラシア・コタラヒムブツ・桑葉（DNJ）が動き出す",
    question: "食事の少し前にお茶を飲むと、体内物流はどう変わる？",
    conclusion: "サラシア、コタラヒムブツ、桑葉（DNJ）の準備チームが先に動いたことで、糖分の流れに少し変化があったようです。"
  },
  "003": {
    title: "二個目のケーキ、どうする？",
    subtitle: "ギムネマで、甘味センサーが少し緩やかに",
    question: "甘味の感じ方が少しやわらぐと、二個目のケーキはどうなる？",
    conclusion: "ギムネマによって甘味センサーの反応が少し緩やかになったようです。主人公は我慢するのではなく、二個目をどうするか自分で決めます。"
  }
};

const imageSources = {
  "E01-S01-C01": "generated/S03-C02.png",
  "E01-S01-C02": "generated/S03-C03.png",
  "E01-S01-C03": "generated/v2/episode-01/E01-S01-C03.png",
  "E01-S02-C01": "generated/S01-C01-v2.png",
  "E01-S02-C02": "generated/S01-C03.png",
  "E01-S02-C03": "generated/v2/episode-01/E01-S02-C03.png",
  "E01-S03-C01": "generated/S02-C01.png",
  "E01-S03-C02": "generated/identity_v2/S02-C02.png",
  "E01-S03-C03": "generated/v2/episode-01/E01-S03-C03.png",
  "E01-S03-C04": "generated/v2/episode-01/E01-S03-C04.png",
  "E01-S04-C01": "generated/S03-C04.png",
  "E01-S04-C02": "generated/v2/episode-01/E01-S04-C02.png",
  "E01-S04-C03": "generated/v2/episode-01/E01-S04-C03-v2.png",
  "E01-S04-C04": "generated/v2/episode-01/E01-S04-C04.png",
  "E01-S05-C01": "generated/v2/episode-01/E01-S05-C01.png",
  "E01-S05-C02": "generated/v2/episode-01/E01-S05-C02.png",
  "E01-S05-C03": "generated/v2/episode-01/E01-S05-C03.png",
  "E01-S05-C04": "generated/S05-C04.png",
  "E01-S06-C01": "generated/S06-C01.png",
  "E01-S06-C02": "generated/S06-C02.png",
  "E01-S06-C03": "generated/S06-C03.png",
  "E01-S06-C04": "generated/S06-C04.png",

  "E02-S01-C01": "generated/v2/episode-02/E02-S01-C01-v2.png",
  "E02-S01-C02": "generated/S07-C02.png",
  "E02-S01-C03": "generated/S07-C03.png",
  "E02-S01-C04": "generated/v2/episode-02/E02-S01-C04.png",
  "E02-S01-C05": "generated/v2/episode-02/E02-S01-C05.png",
  "E02-S02-C01": "generated/S08-C01.png",
  "E02-S02-C02": "generated/identity_v2/S08-C02.png",
  "E02-S02-C03": "generated/v2/episode-02/E02-S02-C03.png",
  "E02-S02-C04": "generated/v2/episode-02/E02-S02-C04-v2.png",
  "E02-S03-C01": "generated/identity_v2/S09-C01.png",
  "E02-S03-C02": "generated/identity_v2/S09-C02.png",
  "E02-S03-C03": "generated/identity_v2/S09-C03.png",
  "E02-S03-C04": "generated/identity_v2/S09-C04.png",
  "E02-S03-C05": "generated/v2/episode-02/E02-S03-C05-v3.png",
  "E02-S04-C01": "generated/S10-C01.png",
  "E02-S04-C02": "generated/identity_v2/S10-C02.png",
  "E02-S04-C03": "generated/v2/episode-02/E02-S04-C03-v2.png",
  "E02-S04-C04": "generated/S10-C04.png",
  "E02-S04-C05": "generated/v2/episode-02/E02-S04-C05.png",
  "E02-S04-C06": "generated/identity_v2/S10-C06.png",
  "E02-S05-C01": "generated/S11-C01.png",
  "E02-S05-C02": "generated/S11-C02.png",
  "E02-S05-C03": "generated/S11-C03.png",
  "E02-S05-C04": "generated/v2/episode-02/E02-S05-C04.png",
  "E02-S06-C01": "generated/v2/episode-02/E02-S06-C01.png",
  "E02-S06-C02": "generated/v2/episode-02/E02-S06-C02.png",
  "E02-S06-C03": "generated/v2/episode-02/E02-S06-C03.png",
  "E02-S06-C04": "generated/v2/episode-02/E02-S06-C04.png"
};

for (const episodeNumber of ["01", "02", "03"]) {
  const id = `00${Number(episodeNumber)}`;
  const panelCount = episodeNumber === "01" ? 22 : episodeNumber === "02" ? 28 : 15;
  for (let scene = 1; scene <= 6; scene += 1) {
    for (let panel = 1; panel <= panelCount; panel += 1) {
      const key = `E${episodeNumber}-S${String(scene).padStart(2, "0")}-C${String(panel).padStart(2, "0")}`;
      if (episodeNumber === "03") imageSources[key] = `generated/v2/episode-03/${key}.png`;
    }
  }
}

const ignoredLabels = new Set([
  "既存素材候補", "カメラ", "描画内容", "注意", "注記", "演技", "新人の演技", "編集意図", "話数仕様", "台詞なし"
]);
const narrationLabels = new Set(["ナレーション", "ラストの小さな文字", "次回への短い柱文"]);
const broadcastLabels = new Set(["館内放送", "無線の声", "電話の声", "センサー音声", "センサー表示"]);
const narrationSpeakers = {
  "ナレーション": "ナレーション",
  "ラストの小さな文字": "",
  "次回への短い柱文": "次回予告"
};

function unquote(value) {
  return value.trim().replace(/^「|」$/gu, "").trim();
}

function parseQuotedItems(value, fallbackSpeaker, kind) {
  const items = [];
  const pattern = /([^「」]*?)「([^」]+)」/gu;
  let match;
  while ((match = pattern.exec(value))) {
    const possibleSpeaker = match[1].trim().replace(/[、,:：]$/u, "");
    items.push({ kind, speaker: possibleSpeaker || fallbackSpeaker, text: match[2].trim() });
  }
  if (!items.length && value.trim()) items.push({ kind, speaker: fallbackSpeaker, text: unquote(value) });
  return items;
}

const episodes = new Map();
let currentEpisode = null;
let currentScene = null;
let currentPanel = null;

for (const line of markdown.split(/\r?\n/u)) {
  const episodeMatch = line.match(/^# 第([123])話[　\s]+(.+)$/u);
  if (episodeMatch) {
    const id = String(Number(episodeMatch[1])).padStart(3, "0");
    currentEpisode = {
      id,
      number: Number(episodeMatch[1]),
      siteName: "からだ成分ラボ",
      siteTagline: "まんがでわかる、栄養と健康成分",
      ...episodeMeta[id],
      status: "台詞下置き版",
      scenes: []
    };
    episodes.set(id, currentEpisode);
    currentScene = null;
    currentPanel = null;
    continue;
  }

  const sceneMatch = line.match(/^## E\d{2}-S(\d{2})[　\s]+(.+)$/u);
  if (sceneMatch && currentEpisode) {
    currentScene = {
      id: `S${sceneMatch[1]}`,
      number: Number(sceneMatch[1]),
      title: sceneMatch[2].trim(),
      panels: []
    };
    currentEpisode.scenes.push(currentScene);
    currentPanel = null;
    continue;
  }

  const panelMatch = line.match(/^### (E\d{2}-S\d{2}-C\d{2})[　\s]+(.+)$/u);
  if (panelMatch && currentScene) {
    const source = imageSources[panelMatch[1]];
    if (!source) throw new Error(`No image source mapped for ${panelMatch[1]}`);
    currentPanel = {
      id: panelMatch[1],
      title: panelMatch[2].trim(),
      description: "",
      script: [],
      imageBase: panelMatch[1],
      source
    };
    currentScene.panels.push(currentPanel);
    continue;
  }

  if (!currentPanel) continue;
  const field = line.match(/^- \*\*(.+?)\*\*[：:](.*)$/u);
  if (!field) continue;
  const label = field[1].trim();
  const value = field[2].trim();
  if (label === "描画内容") {
    currentPanel.description = value;
    continue;
  }
  if (label === "ナレーション小注" || label === "ページ下注記") continue;
  if (ignoredLabels.has(label)) continue;
  if (label === "効果音") {
    currentPanel.script.push(...parseQuotedItems(value, "", "sfx"));
  } else if (narrationLabels.has(label)) {
    currentPanel.script.push(...parseQuotedItems(value, narrationSpeakers[label], "narration"));
  } else if (broadcastLabels.has(label)) {
    currentPanel.script.push(...parseQuotedItems(value, label, "broadcast"));
  } else {
    currentPanel.script.push(...parseQuotedItems(value, label === "台詞" ? "" : label, "speech"));
  }
}

await mkdir(outputDir, { recursive: true });
for (const [id, episode] of episodes) {
  for (const scene of episode.scenes) {
    for (const panel of scene.panels) {
      panel.alt = panel.description || `${scene.title}「${panel.title}」の漫画コマ`;
    }
  }
  await writeFile(path.join(outputDir, `${id}.json`), `${JSON.stringify(episode, null, 2)}\n`, "utf8");
  const count = episode.scenes.reduce((sum, scene) => sum + scene.panels.length, 0);
  console.log(`Imported episode ${id}: ${episode.scenes.length} scenes, ${count} panels`);
}
