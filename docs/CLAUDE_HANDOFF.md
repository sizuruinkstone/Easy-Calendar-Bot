# Claude Handoff: Easy Calendar Bot

## 役割

Claudeには、設計整理・仕様レビュー・Codex向けタスク分割を担当してもらう。

このプロジェクトでは、Claudeを「いきなり実装する係」ではなく、まず仕様を絞ってCodexが迷わず作業できる状態にする係として使う。

## 対象リポジトリ

- Repository: `sizuruinkstone/Easy-Calendar-Bot`
- 新規リポジトリは作成しない
- この既存リポジトリ内に段階的に機能を追加する

## プロジェクト概要

Easy Calendar Botは、TimeTreeやGoogle Calendarへの手入力が面倒な問題を減らすためのDiscord中心の予定管理Bot。

ユーザーは大学生で、授業・課題・バイト・支払い・個人予定・リマインドが混ざっている。厳密なフォーム入力では続かないので、Discordで雑に自然文入力できる体験を優先する。

最終的にはDiscord / Gmail / Google Calendar / Notionなどを連携したいが、最初から全部はやらない。

## UI方針

重要: ユーザーはGoogle CalendarのUIが好きではない。

そのため、Google Calendarは「日常的に開くカレンダーアプリ」ではなく、予定保存・同期のための裏方として使う。

日常利用の主導線は以下。

- Discord Bot
- iPhone純正カレンダー
- iPhone通知
- Discord通知

Google Calendar Web/App UIは、管理・デバッグ用途とする。

```txt
Discord
↓
Easy Calendar Bot
↓
Google Calendar API
↓
iPhone純正カレンダーに同期表示
```

Phase 1でiCloud Calendar / CalDAV 直接登録は扱わない。まずはGoogle Calendar APIだけで実装し、iPhone純正カレンダーにGoogleアカウントを同期して見る運用にする。

## 最初のMVP

Discordで雑に予定を書いたら、Botが解釈して確認し、Google Calendarに登録できるようにする。

例:

ユーザー:

```txt
/add text: 明日17時から23時バイト
```

Bot:

```txt
以下の内容で登録しますか？

タイトル: バイト
開始: 2026-06-26 17:00
終了: 2026-06-26 23:00
種別: work
登録先: Google Calendar（裏方同期）
表示: iPhone純正カレンダーに同期
```

ユーザーが確認ボタンを押すとGoogle Calendarに登録する。

## 優先順位

### Phase 1: Discord → Google Calendar予定登録

- Discord Bot
- `/add text:`
- 自然文入力の日時・タイトル・種別推定
- 登録前の確認
- Google Calendarへの登録
- Google Calendarは裏方同期基盤として扱う
- iPhone純正カレンダーで見られる運用をREADMEに明記する
- タイムゾーンは `Asia/Tokyo`
- `/today` `/tomorrow` `/week`

### Phase 2: 予定確認・リマインド

- 今日の予定
- 明日の予定
- 今週の予定
- バイト予定一覧
- 課題締切一覧
- 朝・夜の自動通知
- Google Calendar UIを開かなくても生活できるDiscord表示を強化する

### Phase 3: Gmail連携

- 大学・授業・課題・バイト・支払い系メールを確認
- 対応が必要そうなものだけ通知
- 課題締切や面談予定を予定候補として抽出

### Phase 4: Notion連携 / iCloud検討

- 課題・タスクをNotion DBにも保存
- カレンダー予定とタスクを分けて管理
- 完了/未完了の状態管理
- Google Calendar自体を避けたくなった場合、iCloud Calendar / CalDAV 直接登録を検討する

## 重要な設計方針

1. ユーザーは厳密入力が面倒なので、入力は雑でよい設計にする。
2. Calendar登録前には必ず確認を挟む。
3. 曖昧な情報は勝手に確定しない。
4. 最初から多機能にしすぎず、予定登録だけを強くする。
5. GmailやNotionは最初から深追いしない。
6. 予定・課題・リマインドは概念を分ける。
7. ユーザーの生活導線はDiscord中心にする。
8. 予定の表示導線はiPhone純正カレンダーを優先する。
9. Google Calendar UIを日常利用前提にしない。
10. Codexへの依頼は小さく、変更範囲・禁止事項・検証コマンドを明示する。

## 想定コマンド

### Phase 1で必要

- `/help`
  - 使い方を表示する
- `/add text:`
  - 自然文から予定候補を作る
- `/today`
  - 今日の予定
- `/tomorrow`
  - 明日の予定
- `/week`
  - 今週の予定

### 後回し

- `/remind`
- `/tasks`
- `/gmail-check`
- `/notion-sync`
- `/month`

## 自然文入力例

- 明日17時から23時バイト
- 来週火曜の3限に物理実験
- 6/30 17時までにレポート2提出
- 今日22時に洗濯リマインド
- 土曜の夜にClaudeでハンドオフ見直す
- 来月5日にクレカ支払い確認
- 6/15から19までイオン休業
- 来週火曜のみ？
- 5/30 LOL大会
- 19日パチンコ

## データ分類

### event

カレンダーに入れる予定。

例:

- 授業
- バイト
- 面談
- 遊び
- 通院
- 予約

### task

期限はあるが、時間帯をブロックしないもの。

例:

- レポート提出
- 課題
- メール返信
- 支払い確認

### reminder

指定時刻に通知だけほしいもの。

例:

- 洗濯
- 薬
- 出発
- 持ち物確認

### tentative

確定ではないが、忘れないために置いておきたい予定。

例:

- 校正バイト候補日
- のみ？
- 旅行候補日
- どっちかでいく

## Claudeにやってほしいこと

1. MVPの仕様を整理する
2. Discordコマンド設計を改善する
3. 自然文解析の仕様を決める
4. Google Calendarに入れるもの / Notionに入れるもの / reminderだけで済むものを分類するルールを作る
5. Google Calendar UIを開かなくて済むUXになっているかレビューする
6. iPhone純正カレンダーで見る前提の説明がREADMEにあるか確認する
7. Codexに渡す実装タスクを小さく分割する
8. 曖昧な入力時のBot応答例を作る
9. ユーザーが面倒に感じないUXを優先してレビューする

## Claudeの出力形式

以下の形式で返す。

1. MVP仕様
2. コマンド一覧
3. 自然文解析ルール
4. データモデル
5. エッジケース
6. Codex向け実装タスク
7. UI導線レビュー
8. 次にやること

## 注意

- 完璧なカレンダーアプリを作ろうとしない
- 最初は「雑入力 → 確認 → Google Calendar登録」に集中する
- Google Calendarは裏方同期基盤として扱う
- Google Calendar UIを日常利用前提にしない
- iPhone純正カレンダーで見る運用を優先する
- Phase 1でiCloud Calendar / CalDAV直接登録に広げない
- ユーザーは面倒なフォーム入力が嫌い
- 手間が増える提案は避ける
- ただし予定登録ミスはかなり困るので確認ステップは必須
- 新規リポジトリを作らない
- 既存構成を無視して全面作り直ししない
