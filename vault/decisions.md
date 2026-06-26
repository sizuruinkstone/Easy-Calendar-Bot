# Decisions

最終更新: 2026-06-25

## 採用した技術スタック

- Node.js
- TypeScript
- discord.js
- dotenv
- dayjs
- vitest
- npm overrides

## 選択理由

- Node.js / TypeScript は Discord Bot と相性がよく、型で予定候補オブジェクトを管理しやすい。
- discord.js は Discord Bot 実装の標準的な選択肢。
- dotenv はローカル環境変数を安全に扱うために使う。
- dayjs は軽量で、今回の簡単な日時計算に十分。
- vitest は TypeScript プロジェクトで軽くテストを回しやすい。
- npm overrides は `discord.js` 経由の `undici` を v6 系の修正版へ固定するために使う。

## 重要な設計判断

- `parseScheduleText(text, now, source)` は `now` を必ず受け取る。テストで基準日時を固定するため。
- タイムゾーンは `Asia/Tokyo` 前提にする。
- MVP Phase 1 では Google Calendar / Gmail / Notion 連携を実装しない。
- Discord は `/parse` の雛形だけに留める。
- 自然文解析はルールベースで始め、完璧な日本語解析を目指さない。
- `start` と `end` は ISO 8601 文字列または `null` にする。
- `undici` は `6.27.0` に override し、`npm audit` が 0 件になる状態を優先する。

## 後で見直す可能性がある点

- `confidence` の算出ルール
- 日付と時刻が片方だけある入力の扱い
- `event` と `unknown` の使い分け
- 日付パースの対象年の決め方
- `来週月曜` の定義
- dayjs から date-fns / Temporal への変更可能性
