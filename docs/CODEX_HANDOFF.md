# Codex Handoff: Easy Calendar Bot MVP追加実装

## 対象リポジトリ

- Repository: `sizuruinkstone/Easy-Calendar-Bot`
- 新規リポジトリは作成しない
- この既存リポジトリ内に、Discordから自然文でGoogle Calendarへ予定登録するMVP機能を追加する

## 目的

Discordから自然文で予定を入力し、Google Calendarに登録できるBotを作る。

最初のMVPは以下。

1. Discordで `/add text:` を実行
2. 入力された自然文から予定候補を作る
3. Discord上で確認メッセージを出す
4. ユーザーが確認ボタンを押したらGoogle Calendarに登録
5. 登録結果をDiscordに返す

## 重要方針

- ユーザーは厳密な予定入力が面倒
- 自然文入力を前提にする
- Google Calendar登録前には必ず確認を挟む
- タイムゾーンは `Asia/Tokyo`
- 最初からGmail/Notion連携は実装しない
- Phase 1ではGoogle Calendar登録だけに集中する
- 既存構成がある場合は既存コードを尊重し、最小差分で実装する

## 最初に確認すること

まずリポジトリの現状を確認する。

- `package.json`
- `README.md`
- `src/` 配下
- 既存のDiscord Bot実装の有無
- Google Calendar連携の有無
- `.env.example` の有無
- TypeScript設定の有無

確認後、以下を短く報告する。

1. 現在の構成
2. すでに実装済みの機能
3. 足りない機能
4. Phase 1 MVPに必要な変更ファイル
5. 実装手順

## 技術スタック案

既存構成がなければ以下で始める。

- Node.js
- TypeScript
- discord.js
- Google Calendar API
- dotenv
- zod
- dayjs または luxon
- SQLite または JSON保存

## 環境変数

`.env.example` を作成する。

```env
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_CALENDAR_ID=primary

TIMEZONE=Asia/Tokyo
```

## 実装するコマンド

### `/help`

Botの使い方を表示する。

### `/add text:`

自然文から予定候補を作る。

例:

```txt
/add text: 明日17時から23時バイト
```

Botの返答例:

```txt
以下の内容で登録しますか？

タイトル: バイト
開始: 2026-06-26 17:00
終了: 2026-06-26 23:00
種別: work
登録先: Google Calendar
```

ボタン:

- 登録する
- キャンセル

### `/today`

今日の予定をGoogle Calendarから取得して表示する。

### `/tomorrow`

明日の予定をGoogle Calendarから取得して表示する。

### `/week`

今週の予定をGoogle Calendarから取得して表示する。

## 自然文パース仕様

Phase 1では完璧なLLMパースは不要。まずはルールベースで最低限動くようにする。

対応する表現:

- 今日
- 明日
- 明後日
- 今週土曜
- 来週月曜
- 6/30
- 6月30日
- 17時
- 17:00
- 17時から23時
- 午後5時から
- 17-23

タイトル推定:

- 「バイト」が含まれる → タイトル: バイト、種別: work
- 「授業」「講義」「実験」が含まれる → 種別: class
- 「課題」「レポート」「提出」が含まれる → 種別: task
- 「支払い」「振込」「契約」が含まれる → 種別: payment
- それ以外 → 種別: general

終了時刻がない場合:

- eventならデフォルト1時間
- taskなら終日または締切扱い
- reminderならその時刻のみ

ただしPhase 1ではtask / reminderの扱いは深追いしなくてよい。基本はGoogle Calendar eventとして扱う。

## ディレクトリ構成案

既存構成がない場合の案。

```txt
src/
  index.ts
  config.ts

  discord/
    client.ts
    commands/
      help.ts
      add.ts
      today.ts
      tomorrow.ts
      week.ts
    interactions.ts
    registerCommands.ts

  calendar/
    googleCalendarClient.ts
    createEvent.ts
    listEvents.ts

  parser/
    parseNaturalText.ts
    types.ts

  storage/
    pendingEvents.ts

  utils/
    date.ts
    logger.ts
```

## データ型案

```ts
export type EventKind =
  | "work"
  | "class"
  | "task"
  | "payment"
  | "general";

export type ParsedEventCandidate = {
  title: string;
  kind: EventKind;
  start: string; // ISO string
  end?: string; // ISO string
  allDay?: boolean;
  description?: string;
  confidence: "high" | "medium" | "low";
  needsConfirmation: boolean;
  originalText: string;
};
```

## pending event

Discordの確認ボタン用に、登録前の予定候補を一時保存する。

最初はメモリ保存でOK。

```ts
type PendingEvent = {
  id: string;
  userId: string;
  channelId: string;
  candidate: ParsedEventCandidate;
  createdAt: string;
};
```

将来的にSQLiteへ移行できるように、保存処理は `storage/pendingEvents.ts` に分離する。

## Google Calendar登録

Google Calendar APIで以下を実装する。

- `createCalendarEvent(candidate)`
- `listEvents({ start, end })`

登録する内容:

```ts
{
  summary: candidate.title,
  start: {
    dateTime: candidate.start,
    timeZone: "Asia/Tokyo"
  },
  end: {
    dateTime: candidate.end,
    timeZone: "Asia/Tokyo"
  },
  description: `Original input: ${candidate.originalText}`
}
```

## Discord確認UI

`/add` 実行後、以下のボタンを出す。

- `confirm_add_event`
- `cancel_add_event`

登録ボタンが押されたら:

1. pending eventを取得
2. 押したユーザーが作成者本人か確認
3. Google Calendarに登録
4. pending eventを削除
5. 完了メッセージを出す

キャンセルの場合:

1. pending eventを削除
2. キャンセルメッセージを出す

## 実装優先順位

### Step 1

- TypeScript環境
- dotenv
- discord.js起動
- `/help` 実装

### Step 2

- `/add` コマンド作成
- ルールベース自然文パーサー作成
- 確認メッセージ表示
- pending event保存

### Step 3

- Google Calendar API接続
- 確認ボタンから予定登録

### Step 4

- `/today`
- `/tomorrow`
- `/week`

### Step 5

- README整備
- `.env.example`
- 実行手順
- 検証コマンド

## package.json scripts案

```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit",
    "register-commands": "tsx src/discord/registerCommands.ts"
  }
}
```

## 検証コマンド

READMEに以下を書く。

```bash
npm install
npm run build
npm run typecheck
npm start
```

可能なら以下も用意する。

```bash
npm run dev
npm run register-commands
```

## 禁止事項

- `.env` や認証情報をコミットしない
- Google Calendarへ確認なしで登録しない
- いきなりGmail/Notion連携まで広げない
- 巨大な一枚実装にしない
- APIキーやOAuthトークンをコードに直書きしない
- ユーザーの既存予定を勝手に削除・変更しない
- 新規リポジトリを作らない
- 既存構成を無視して全面作り直ししない

## 完了条件

以下が動けばPhase 1完了。

1. Discord Botが起動する
2. `/help` が動く
3. `/add text: 明日17時から23時バイト` が予定候補を返す
4. 確認ボタンが表示される
5. 登録ボタンでGoogle Calendarに予定が作成される
6. `/today` で今日の予定が見られる
7. READMEにセットアップ方法がある

## 追加で余裕があれば

- `/add` の解析結果が曖昧なとき `confidence: low` にする
- 曖昧な予定は登録ボタンを出さず、追加質問する
- 登録後にGoogle Calendarのイベントリンクを返す
- バイト予定はタイトルに `[バイト]` を付ける
- 課題系は終日イベントにする
