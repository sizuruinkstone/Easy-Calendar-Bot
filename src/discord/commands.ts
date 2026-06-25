import { SlashCommandBuilder } from "discord.js";

export const parseCommand = new SlashCommandBuilder()
  .setName("parse")
  .setDescription("自然文を予定候補に変換します")
  .addStringOption((option) =>
    option
      .setName("text")
      .setDescription("例: 明日17時からバイト")
      .setRequired(true),
  );

export const commands = [parseCommand.toJSON()];
