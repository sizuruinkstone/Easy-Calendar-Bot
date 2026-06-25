import { SlashCommandBuilder } from "discord.js";

export const HELP_COMMAND_NAME = "help";

export const helpCommand = new SlashCommandBuilder()
  .setName(HELP_COMMAND_NAME)
  .setDescription("Easy Calendar Botの使い方を表示します");

export const HELP_MESSAGE = [
  "このBotはDiscordから雑に予定を入れるためのBotです。",
  "`/add text:` で自然文から予定候補を作り、Discord上で確認できます。",
  "`/today` でGoogle Calendarから今日の予定を確認できます。",
  "",
  "現在のコマンド:",
  "- /add text:",
  "- /today",
  "- /help",
  "",
  "今後の予定:",
  "- /tomorrow",
  "- /week",
].join("\n");
