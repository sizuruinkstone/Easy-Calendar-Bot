import {
  EmbedBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type InteractionReplyOptions,
} from "discord.js";

import { listWeekCalendarEvents } from "../../calendar/calendarClient";
import type { CalendarListResult } from "../../calendar/types";
import {
  CALENDAR_LIST_EMBED_COLOR,
  formatCalendarDateHeading,
  formatCalendarEventLine,
  getCalendarEventDateKey,
} from "./calendarListView";

export const WEEK_COMMAND_NAME = "week";

export const weekCommand = new SlashCommandBuilder()
  .setName(WEEK_COMMAND_NAME)
  .setDescription("今後7日間の予定を表示します");

export async function handleWeekCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const result = await listWeekCalendarEvents();

  await interaction.reply(buildWeekReply(result));
}

export function buildWeekReply(result: CalendarListResult): InteractionReplyOptions {
  if (!result.success) {
    return {
      content: result.message,
      ephemeral: true,
    };
  }

  if (result.events.length === 0) {
    return {
      content: "今後7日間の予定はありません。",
      ephemeral: true,
    };
  }

  return {
    embeds: [
      new EmbedBuilder()
        .setTitle("今後7日間の予定")
        .setDescription(formatWeekEventGroups(result))
        .setColor(CALENDAR_LIST_EMBED_COLOR),
    ],
    ephemeral: true,
  };
}

export function formatWeekEventGroups(
  result: Extract<CalendarListResult, { success: true }>,
): string {
  const groupedEvents = new Map<string, string[]>();

  for (const event of result.events) {
    const dateKey = getCalendarEventDateKey(event, result.range.timezone);
    const lines = groupedEvents.get(dateKey) ?? [];
    lines.push(`* ${formatCalendarEventLine(event, result.range.timezone)}`);
    groupedEvents.set(dateKey, lines);
  }

  return Array.from(groupedEvents.entries())
    .map(([dateKey, lines]) =>
      [formatCalendarDateHeading(dateKey, result.range.timezone), "", ...lines].join("\n"),
    )
    .join("\n\n");
}
