# Easy Calendar Bot

ズボラカレンダー / 楽ちんカレンダー系プロジェクトの実装リポジトリです。

Discordから自然文で予定・課題・リマインドを入力し、Google Calendarなどへ楽に登録・確認・通知できるBotを作ります。

## 最初のMVP

まずは以下だけを目標にします。

1. Discordで `/add text:` を実行
2. 自然文から予定候補を作る
3. 登録前にDiscord上で確認する
4. 確認後にGoogle Calendarへ登録する
5. `/today` `/tomorrow` `/week` で予定を確認する

## Handoff docs

Claude / Codex に作業を渡すときは、以下を使います。

- [Claude Handoff](docs/CLAUDE_HANDOFF.md)
- [Codex Handoff](docs/CODEX_HANDOFF.md)

## 方針

- 新規リポジトリは作らず、この `Easy-Calendar-Bot` 内で実装します。
- 最初からGmail/Notionまで広げず、Discord → Google Calendarの予定登録に集中します。
- ユーザーは厳密入力が面倒なので、自然文入力を前提にします。
- ただし登録ミスを避けるため、Google Calendar登録前には必ず確認ステップを挟みます。
- タイムゾーンは `Asia/Tokyo` 固定です。
