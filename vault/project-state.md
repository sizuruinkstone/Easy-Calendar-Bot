# Project State

最終更新: 2026-06-25

## 現在の実装状況

ズボラカレンダーの初期セットアップを開始した。Node.js / TypeScript / Vitest の最小構成を追加し、自然文から予定候補を作る `parseScheduleText` を実装した。

Discord は本格実装ではなく、`/parse` コマンド定義と応答処理の雛形のみを追加している。

## 完了済み

- `package.json` を追加
- TypeScript 設定を追加
- Vitest テストを追加
- `ParsedSchedule` / `ScheduleType` 型を追加
- `parseScheduleText(text, now, source)` を追加
- 最低 4 ケースのパーサテストを追加
- `.env.example` を追加
- README を MVP Phase 1 に合わせて更新
- vault ディレクトリと 6 ファイルを追加
- Discord `/parse` の雛形を追加
- `npm test`, `npm run typecheck`, `npm run build`, `npm audit` が通る状態にした

## 未完了

- Discord コマンド登録スクリプト
- Discord Bot の実運用確認
- Google Calendar / Gmail / Notion 連携
- OAuth / 認証まわり
- lint 導入
- パーサの複雑な日本語表現対応

## 次にやること

1. `/parse` コマンド登録スクリプトを追加する
2. パーサの対応表現を少しずつ増やす
3. 曖昧な入力の確認フローを設計する

## 直近の作業メモ

- 今回は外部 API 連携を意図的に避けた。
- 日付計算は `dayjs` + `Asia/Tokyo` 前提で実装した。
- `now` を引数で受け取り、テストで基準日を固定できるようにした。
- `来週月曜` は現在日から見た次の月曜として扱う。2026-06-25 木曜基準では 2026-06-29。
- `discord.js` 経由の `undici` audit 警告は npm `overrides` で `undici@6.27.0` に固定して解消した。
- lint はまだ導入していないため `npm run lint` は script 未定義。
