# ズボラカレンダー

予定、課題、バイト、リマインドの登録が面倒な問題を減らすための個人用カレンダー支援 Discord Bot です。

Phase 1 MVP では、Discord の slash command から自然文を予定候補に変換し、確認 UI を通して Google Calendar へ登録できます。`CALENDAR_DRY_RUN=true` にすると Google Calendar へ登録せず、登録予定内容だけを確認できます。

## 解決したい問題

- カレンダーやタスク管理ツールへの手入力が面倒で続かない
- 課題、バイト、リマインド、予定が複数の場所に散らばる
- Discord やメールで見た予定を後で登録し忘れる
- まず予定候補を作って確認できる軽い入口がほしい

## MVP Phase 1

Phase 1 MVP では、次の機能を実装済みです。

- Discord Bot 起動基盤
- `/help`
- `/add text:` による自然文パース
- Discord Embed 確認 UI
- `登録する` / `キャンセル` ボタン
- pending event のメモリ保存と 30 分 TTL
- Google Calendar dry-run
- Google Calendar 本登録
- `/today`
- `/tomorrow`
- `/week`
- Google Calendar からの予定取得
- Google 設定不足、API 失敗時の安全処理
- `/add` 確認時の重複登録対策

## コマンド

- `/help`: 利用できるコマンドと使い方を表示します。
- `/add text:`: 自然文から予定候補を作成し、Embed とボタンで確認します。`登録する` を押すと dry-run または Google Calendar 本登録を実行し、`キャンセル` を押すと登録せずに破棄します。
- `/today`: Google Calendar から今日の予定を取得して表示します。
- `/tomorrow`: Google Calendar から明日の予定を取得して表示します。
- `/week`: Google Calendar から今週の予定を取得して表示します。

使用例:

```text
/help
/add text: 明日17時から23時バイト
/today
/tomorrow
/week
```

`/add` で対応している自然文の例:

- `明日17時からバイト`
- `今日21時に課題`
- `6/28 13:00 物理レポート締切`
- `来週月曜 朝にゴミ出し`

Gmail / Notion の本連携、DB 設計の拡張は Phase 1 MVP の範囲外です。

## セットアップ

```bash
npm install
```

`.env.example` を参考に環境変数を用意します。`.env` はコミットしません。

```env
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=
NOTIFY_CHANNEL_ID=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_CALENDAR_ID=primary
CALENDAR_DRY_RUN=true
TIMEZONE=Asia/Tokyo
```

## 起動方法

開発起動:

```bash
npm run dev
```

slash command を新規追加または更新した場合は、開発用 Discord サーバーに command を再登録します。

```bash
npm run register-commands
```

ビルド後に実行する場合:

```bash
npm run build
npm start
```

## Google Calendar 連携

- `CALENDAR_DRY_RUN=true` の場合、Google Calendar へ予定を登録せず、Discord 上で dry-run 結果を確認します。
- `CALENDAR_DRY_RUN=false` かつ Google 環境変数が設定済みの場合、`/add` の `登録する` ボタンで Google Calendar に予定を本登録します。
- `CALENDAR_DRY_RUN=false` で Google 環境変数が不足している場合は `not-configured` として安全に扱い、Bot は停止しません。
- Google Calendar API が失敗した場合もエラーを Discord に返し、Bot は停止しません。

予定の削除・変更は Phase 1 MVP の対象外です。

iPhone 純正カレンダーで登録済み予定を見るには、iPhone 側で Google アカウントのカレンダー同期を ON にしてください。

## テスト方法

```bash
npm test
npm run typecheck
npm run build
```

lint はまだ導入していません。必要になった段階で ESLint などを追加します。

## 環境変数

`.env` はローカル専用です。API キー、Bot トークン、Google 認証情報を含むため、コミットしません。

- `DISCORD_TOKEN`: Discord Bot トークン。Bot 起動と slash command 登録に使用します。
- `DISCORD_CLIENT_ID`: Discord アプリケーションの Client ID。
- `DISCORD_GUILD_ID`: 開発用 Discord サーバー ID。
- `NOTIFY_CHANNEL_ID`: 将来の自動通知で送信先にする Discord チャンネル ID。未設定でも既存コマンドは動作します。
- `CALENDAR_DRY_RUN`: `true` の場合、Google Calendar へ実登録しません。未指定時のデフォルトは `false` です。Discord 仮動作では `true` にしておけば Google 系環境変数は空で構いません。
- `GOOGLE_CLIENT_ID`: `CALENDAR_DRY_RUN=false` で Google Calendar 本登録を行う場合に必要です。
- `GOOGLE_CLIENT_SECRET`: `CALENDAR_DRY_RUN=false` で Google Calendar 本登録を行う場合に必要です。
- `GOOGLE_REFRESH_TOKEN`: `CALENDAR_DRY_RUN=false` で Google Calendar 本登録を行う場合に必要です。
- `GOOGLE_CALENDAR_ID`: Google Calendar の保存先。未指定時は `primary` を使います。
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

- パーサの対応表現を増やす
- 日付のみ、時刻のみ、曖昧表現の扱いを決める
- confidence の算出ルールを見直す
- Discord 返信フォーマットを整理する
- Gmail / Notion 連携の扱いを決める
- 永続 DB が必要になる条件を整理する

## 関連ドキュメント

- `vault/project-state.md`: 現在の状態と次の作業
- `vault/decisions.md`: 技術選定と設計判断
- `vault/open-loops.md`: 未解決事項
- `vault/context.md`: プロジェクト文脈
- `vault/codex-rules.md`: Codex 作業ルール
- `vault/handoff-template.md`: 次タスク依頼テンプレート
