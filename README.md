# ズボラカレンダー

予定、課題、バイト、リマインドの登録が面倒な問題を減らすための個人用カレンダー支援プロジェクトです。

自然文やリンクを投げるだけで、予定候補の作成、確認、登録、通知まで進められる仕組みを目指します。初期段階では外部 API 連携を広げず、自然文を予定候補に変換する小さい MVP から始めます。

## 解決したい問題

- カレンダーやタスク管理ツールへの手入力が面倒で続かない
- 課題、バイト、リマインド、予定が複数の場所に散らばる
- Discord やメールで見た予定を後で登録し忘れる
- まず予定候補を作って確認できる軽い入口がほしい

## MVP Phase 1

今回の MVP は、自然文を `ParsedSchedule` に変換するルールベースのパーサです。

対応例:

- `明日17時からバイト`
- `今日21時に課題`
- `6/28 13:00 物理レポート締切`
- `来週月曜 朝にゴミ出し`

出力例:

```json
{
  "title": "バイト",
  "type": "work",
  "start": "2026-06-26T17:00:00+09:00",
  "end": null,
  "source": "manual",
  "rawText": "明日17時からバイト",
  "confidence": 0.8
}
```

## 将来的に作りたい機能

- Discord から自然文を投げて予定候補を作成する
- 候補を確認して Google Calendar などへ登録する
- Gmail から課題、面談、支払い、締切などを抽出する
- Notion と連携して課題や予定の状態を整理する
- 今日、明日、今週の予定やリマインドを Discord に通知する

Google Calendar / Gmail / Notion の本連携、OAuth、DB 設計の拡張は今回の範囲外です。

## セットアップ

```bash
npm install
```

`.env.example` を参考に環境変数を用意します。`.env` はコミットしません。

```env
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_CALENDAR_ID=primary
CALENDAR_DRY_RUN=true
TIMEZONE=Asia/Tokyo
```

## 起動方法

開発用 Discord サーバーに slash command を登録する場合:

```bash
npm run register-commands
```

Discord Bot を開発起動する場合:

```bash
npm run dev
```

ビルド後に実行する場合:

```bash
npm run build
npm start
```

Discord Bot は現時点では `/help` と `/add text:` を実装しています。`/add` は自然文から予定候補を作り、Embed と「登録する」「キャンセル」ボタンで確認します。confirm は `calendarClient` 境界を通りますが、`CALENDAR_DRY_RUN=true` では Google Calendar へ実登録しません。Google Calendar 本登録は Step 3B で実装予定です。

## テスト方法

```bash
npm test
npm run typecheck
```

lint はまだ導入していません。必要になった段階で ESLint などを追加します。

## 環境変数

- `DISCORD_TOKEN`: Discord Bot トークン。Bot 起動と slash command 登録に使用します。
- `DISCORD_CLIENT_ID`: Discord アプリケーションの Client ID。
- `DISCORD_GUILD_ID`: 開発用 Discord サーバー ID。
- `CALENDAR_DRY_RUN`: `true` の場合、confirm 後も Google Calendar へ実登録しません。Discord 仮動作では Google 系環境変数は空で構いません。
- `GOOGLE_CLIENT_ID`: Google Calendar 連携用。Step 3B までは未使用です。
- `GOOGLE_CLIENT_SECRET`: Google Calendar 連携用。Step 3B までは未使用です。
- `GOOGLE_REFRESH_TOKEN`: Google Calendar 連携用。Step 3B までは未使用です。
- `GOOGLE_CALENDAR_ID`: Google Calendar の保存先。Step 3B までは未使用です。
- `TIMEZONE`: 想定タイムゾーン。初期値は `Asia/Tokyo` です。

## AI 実装ループ運用

このプロジェクトでは Codex と Claude を併用して開発します。

役割分担:

- Codex: 実装、テスト追加、リファクタ、差分作成
- Claude: 設計レビュー、仕様整理、実装方針レビュー、次タスク作成
- Human: 最終判断、方向修正、仕様決定

作業ループ:

1. Human が小さいタスクを渡す
2. Codex が実装する
3. Codex が test / typecheck / lint を実行する
4. Codex が vault を更新する
5. Claude が必要に応じてレビューする
6. Human が OK / NG を判断する
7. 次タスクへ進む

## 今後の TODO

- `/parse` コマンド登録用スクリプトを追加する
- パーサの対応表現を増やす
- 日付のみ、時刻のみ、曖昧表現の扱いを決める
- confidence の算出ルールを見直す
- Discord 返信フォーマットを整理する
- Google Calendar 連携の前に確認フローを設計する

## 関連ドキュメント

- `vault/project-state.md`: 現在の状態と次の作業
- `vault/decisions.md`: 技術選定と設計判断
- `vault/open-loops.md`: 未解決事項
- `vault/context.md`: プロジェクト文脈
- `vault/codex-rules.md`: Codex 作業ルール
- `vault/handoff-template.md`: 次タスク依頼テンプレート
