# ad-copy-checker

Check ad copy against each platform's character limits, formatting rules, and risky expressions before you submit. Everything runs in the browser — your text is never sent anywhere.

媒体ごとの文字数・表記ルール・注意が必要な表現を、入稿前にまとめて確認できるツールです。処理はすべてブラウザ内で完結し、入力内容は外部に送信されません。

## Features / 主な機能

- **Platforms / 対応媒体:** Google Search (RSA), Yahoo! Search (RSA), Google Display (RDA), Meta, LINE Ads
- **Character count / 文字数:** full-width = 2 / half-width = 1 counting for Google & Yahoo!, plain counting for Meta & LINE. The part over the limit is marked.
- **Formatting rules / 表記ルール:** exclamation marks, bracket pairs (Yahoo! Search), emoji, platform-dependent characters, half-width kana, decorative or repeated symbols, phone numbers, all caps, extra spaces
- **Risky expressions / 注意表現:** superlatives & No.1 claims, guarantees, health/efficacy claims (PMD Act), price/time-limited offers, click bait
- **Item checks / 個数チェック:** duplicates, too many / too few items
- **Clean up / 整形:** full-width letters & numbers → half-width, half-width kana → full-width, remove extra spaces
- **Export / 書き出し:** copy results for spreadsheets (TSV) or save as CSV
- **UI:** English / 日本語, dark (default) / light theme

## Usage / 使い方

Open `index.html` in your browser. No build or server needed.

`index.html` をブラウザで開くだけで使えます。ビルドやサーバーは不要です。

## Files / ファイル構成

| File | Role |
|---|---|
| `index.html` | Page layout |
| `style.css` | Styles (dark / light themes) |
| `app.js` | Checking logic and UI |
| `rules.js` | Platform specs and risky-expression lists — update here when platform rules change |
| `i18n.js` | UI text (English / Japanese) |

## Disclaimer / 注意

Results are a guide only. Always follow each platform's ad policies and the laws that apply to your product. Platform specs in `rules.js` may change — check the latest platform help pages.

判定は目安です。最終的な判断は各媒体の広告ポリシーと、商材ごとの法令（景品表示法・薬機法など）に従ってください。`rules.js` の規定値は変わることがあるため、最新の媒体ヘルプで確認してください。
