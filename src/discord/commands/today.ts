import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type InteractionReplyOptions,
} from "discord.js";

import { listTodayCalendarEvents } from "../../calendar/calendarClient";
import type { CalendarListedEvent, CalendarListResult } from "../../calendar/types";
import { buildCalendarListReply, formatCalendarEventLine } from "./calendarListView";

export const TODAY_COMMAND_NAME = "today";

export const todayCommand = new SlashCommandBuilder()
  .setName(TODAY_COMMAND_NAME)
  .setDescription("今日の予定を表示します");

export async function handleTodayCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const result = await listTodayCalendarEvents();

  await interaction.reply(buildTodayReply(result));
}

export function buildTodayReply(result: CalendarListResult): InteractionReplyOptions {
  return buildCalendarListReply(result, {
    title: "今日の予定",
    emptyMessage: "今日の予定はありません。",
  });
}

export function formatTodayEventLine(
  event: CalendarListedEvent,
  timezoneName: string,
): string {
  return formatCalendarEventLine(event, timezoneName);
}
