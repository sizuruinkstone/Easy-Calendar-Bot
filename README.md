# Easy Calendar Bot

ズボラカレンダー / 楽ちんカレンダー系プロジェクトの実装リポジトリです。

Discordから自然文で予定・課題・リマインドを入力し、Google Calendarなどへ楽に登録・確認・通知できるBotを作ります。

## コンセプト

このBotは「Google Calendarを毎日開くためのBot」ではありません。

Google Calendarは、予定保存・同期のための裏方として使います。日常的に触るUIは、以下を想定します。

- Discord Bot
- iPhone純正カレンダー
- iPhone通知
- Discord通知

Google CalendarのWeb/App UIは、管理・デバッグ用途に寄せます。普段の予定確認は、iPhone純正カレンダーかDiscordコマンドで完結させます。

## 最初のMVP

まずは以下だけを目標にします。

1. Discordで `/add text:` を実行
2. 自然文から予定候補を作る
3. 登録前にDiscord上で確認する
4. 確認後にGoogle Calendarへ登録する
5. iPhone純正カレンダーにGoogle Calendarを同期して表示する
6. `/today` `/tomorrow` `/week` で予定を確認する

## カレンダー方針

Phase 1では、Botの登録先はGoogle Calendarにします。

ただし、Google Calendarはあくまで同期基盤です。ユーザーがGoogle Calendar UIを日常的に開く前提にはしません。

```txt
Discord
↓
Easy Calendar Bot
↓
Google Calendar API
↓
iPhone純正カレンダーで表示
```

iPhoneでは、Googleアカウントのカレンダー同期をONにして、純正カレンダーアプリ上で予定を見る運用を想定します。

将来的に、Google Calendar自体を避けたい場合は iCloud Calendar / CalDAV 直接登録も検討します。ただし、Apple IDのアプリ用パスワードやCalDAV実装が絡むため、Phase 1では対象外です。

## Handoff docs

Claude / Codex に作業を渡すときは、以下を使います。

- [Claude Handoff](docs/CLAUDE_HANDOFF.md)
- [Codex Handoff](docs/CODEX_HANDOFF.md)

## 方針

- 新規リポジトリは作らず、この `Easy-Calendar-Bot` 内で実装します。
- 最初からGmail/Notionまで広げず、Discord → Google Calendarの予定登録に集中します。
- Google Calendarは裏方の保存・同期先として扱い、日常UIにはしません。
- 予定の表示・確認はDiscordとiPhone純正カレンダーを主導線にします。
- ユーザーは厳密入力が面倒なので、自然文入力を前提にします。
- ただし登録ミスを避けるため、Google Calendar登録前には必ず確認ステップを挟みます。
- タイムゾーンは `Asia/Tokyo` 固定です。
