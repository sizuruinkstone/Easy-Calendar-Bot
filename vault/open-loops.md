# Open Loops

最終更新: 2026-06-25

## 未解決の問題

- Discord コマンド登録方法が未実装。
- Discord Bot の起動確認は未実施。
- lint は未導入。
- `start` が作れない入力をどう確認フローへ回すか未決定。
- `end` の推定ルールが未定義。
- 日付だけ、時刻だけ、曜日だけの入力の扱いが未定義。

## 詰まりそうな点

- 日本語自然文解析を広げすぎると保守しづらくなる。
- 外部 API 連携を急ぐと OAuth と認証で範囲が膨らむ。
- Discord の slash command 登録と Bot 起動確認には実トークンが必要。

## 後で調査すること

- Discord コマンド登録の最小実装
- Google Calendar 登録前の確認 UI
- 課題や締切を calendar event と task のどちらで扱うか
- Gmail / Notion 連携前のデータモデル

## 次回以降に回すタスク

- `/parse` コマンド登録スクリプト作成
- `明後日`, `今週`, `来月`, `午前`, `午後` の対応
- 曖昧な入力の `confidence` と確認メッセージ設計
- README の Discord 起動手順更新
