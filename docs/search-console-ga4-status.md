# Search Console・GA4確認記録

確認日: 2026-08-16

## Google Search Console

- URLプレフィックスプロパティ `https://karada-seibun-lab.way-hiroshi-66.workers.dev/` は登録済み。
- サイトマップ `/sitemap.xml` は送信済みで、ステータスは「成功」。
- 最終読み込みは2026-08-15、検出URLは30件。
- 2026-08-07更新のページ登録レポートは「登録済み1件・未登録8件」。未登録理由は「検出 - インデックス未登録」で、検証は未開始。
- 現在の公開サイトマップは33URL。このため、Search Consoleの表示は現在の公開状態より1回分古い。
- HTTPSは有効2件・無効0件、パンくずリストは有効1件・無効0件。Core Web Vitalsはデータ不足。

次の運用操作は、現在の `/sitemap.xml` の再送信。外部サービスへの送信操作なので、実行時の承認後に行う。

## Google Analytics 4

- アカウント `Aether co.ltd` 内のプロパティ `からだ成分ラボ` を確認。
- プロパティIDは `548662746`、ウェブストリームIDは `15382745138`。
- 測定ID `G-YW2FNQ70ZT` は `content/site.json` の設定と一致。
- ウェブストリームURLは公開サイトURLと一致し、過去48時間のデータ受信が有効。
- GA4と同じSearch Console URLプレフィックスプロパティは2026-08-05にリンク済み。

## 公開サイトのモバイル横断確認

`npm run check:live` は、公開サイトマップに載る全ページを390×844pxで検査する。

- 全33URLがHTTP 200を返すこと
- 各ページのH1が1件であること
- 横方向の表示あふれがないこと
- 設定済みGA4測定IDがHTMLにあること
- 壊れた画像と同一オリジンの通信失敗がないこと

検査中はGoogle Analytics関連通信を遮断し、監査アクセスを分析データへ加えない。2026-08-16の実行結果は全33URL合格。

実行例:

```sh
CODEX_WORKSPACE_NODE_MODULES=/path/to/node_modules \
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chrome-headless-shell \
npm run check:live
```

Playwrightをプロジェクトへ導入済みの環境では、上記環境変数は不要。
