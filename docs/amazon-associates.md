# Amazonアソシエイト運用メモ

最終確認：2026年8月16日

## 登録状況

- 申請日：2026年8月16日
- アソシエイトID：`widewaystudio-22`
- 公式サイト用トラッキングID：`karadalab-web-22`
- Instagram用トラッキングID：`karadalab-ig-22`
- 現在の申請状態：適格販売3件の発生待ち（最終審査前）
- 登録サイト：`https://karada-seibun-lab.way-hiroshi-66.workers.dev/`
- 登録SNS：`https://www.instagram.com/karada_seibun_lab/`

Amazon公式ヘルプでは、申請後180日以内に自己購入を除く3件以上の適格販売が必要で、その売上が確認されてから申請内容が審査される。申請完了画面で見た日数案内だけを、最終承認の証拠にはしない。

氏名、住所、電話番号、振込先、税務情報などの本人情報は、このリポジトリへ保存しない。

## 現在の公開状態

- 読書ページは本番公開済み：`https://karada-seibun-lab.way-hiroshi-66.workers.dev/books/`
- `content/affiliate.json`の`pageEnabled`と`enabled`は`true`。申請審査に必要な適格販売を発生させるため、申請中も表示・リンク・開示を有効にする。
- `applicationStatus`は最終承認まで`pending-qualifying-sales`とし、Amazonから承認を確認した後だけ`approved`へ変更する。
- 読書ページと運営方針の両方に、指定のアソシエイト表示を掲載済み。
- 2冊のリンクは、トラッキングID付きの商品詳細ページがブラウザで開くことを確認済み。
- 商品画像、価格、在庫は掲載していない。
- Amazonの商品画像、価格、商品説明は、Amazonが提供する許可されたリンク作成機能またはAPI以外から転載しない。

## 登録書籍

- 『発達障害は栄養で良くなる 新時代に希望をもたらす未来医療』：ASIN `4864716714`
- 『核酸の分子栄養学―Molecular Nutrition of Nucleic Acids』：ASIN `4860436148`

読書開始日はAmazonの注文日を採用する。

- 『発達障害は栄養で良くなる』：2026年6月24日
- 『核酸の分子栄養学』：2026年6月24日

公式サイトのリンクには`karadalab-web-22`を使用する。価格と在庫は変動するためサイト側へ固定表示しない。

## 公開中の表示

Amazonリンクを有効にしている間は、読書ページと運営方針に次の表示を掲載する。

> Amazonのアソシエイトとして、植井寛は適格販売により収入を得ています。

各Amazonリンクには、読者がその場で分かるように「広告」を表示し、HTMLでは`rel="sponsored noopener noreferrer"`を付ける。

## トラッキングIDの方針

親となるアソシエイトIDは`widewaystudio-22`とする。媒体別の成果を確認するため、次のトラッキングIDを使用する。

- 公式サイト：`karadalab-web-22`
- Instagram：`karadalab-ig-22`

上記3件はAmazonの管理画面を再読み込みし、実際に発行済みであることを確認した。推測したIDをリンクへ埋め込まない。

## 残っている対応

1. 申請日から180日以内に、自己購入を除く適格販売3件を満たす。
2. Amazonから届く最終審査結果を管理画面でも確認する。
3. 承認後に`content/affiliate.json`の`applicationStatus`を`approved`へ更新する。
4. InstagramでAmazonリンクを共有する場合は、その投稿またはプロフィール上でアフィリエイトリンクであることを明瞭に表示し、登録済みSNSと`karadalab-ig-22`を使う。
5. 書籍、URL、開示文を月1回確認し、リンク切れや登録サイト変更があれば先にAmazon側の登録情報を更新する。

自分のアソシエイトリンクから本人や近親者へ購入を依頼して審査件数を作らない。審査完了までは「Amazon承認済み」と表現しない。

## 公式資料

- [Amazonアソシエイト・プログラム運営規約](https://affiliate.amazon.co.jp/help/operating/agreement/)
- [申請の審査プロセス](https://affiliate.amazon.co.jp/help/node/topic/G8TW5AE9XL2VX9VM/)
- [アカウントの審査と休止](https://affiliate.amazon.co.jp/help/node/topic/G7MJTPEP9NC3YKMG/)
- [商品の紹介で注意すべきこと](https://affiliate.amazon.co.jp/help/node/topic/GKT6X2R3NGW5V23K/)
- [SNSでのアソシエイト表示](https://affiliate.amazon.co.jp/help/node/topic/GPXFHVYZMTGPUMPE/)
- [本人・友人・家族による注文の扱い](https://affiliate.amazon.co.jp/help/node/topic/GPSPSUGXUX7V87QZ/)
