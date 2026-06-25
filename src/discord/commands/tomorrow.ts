import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type InteractionReplyOptions,
} from "discord.js";

import { listTomorrowCalendarEvents } from "../../calendar/calendarClient";
import type { CalendarListedEvent, CalendarListResult } from "../../calendar/types";
import { buildCalendarListReply, formatCalendarEventLine } from "./calendarListView";

export const TOMORROW_COMMAND_NAME = "tomorrow";

export const tomorrowCommand = new SlashCommandBuilder()
  .setName(TOMORROW_COMMAND_NAME)
  .setDescription("明日の予定を表示します");

export async function handleTomorrowCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const result = await listTomorrowCalendarEvents();

  await interaction.reply(buildTomorrowReply(result));
}

export function buildTomorrowReply(result: CalendarListResult): InteractionReplyOptions {
  return buildCalendarListReply(result, {
    title: "明日の予定",
    emptyMessage: "明日の予定はありません。",
  });
}

export function formatTomorrowEventLine(
  event: CalendarListedEvent,
  timezoneName: string,
): string {
  return formatCalendarEventLine(event, timezoneName);
}
