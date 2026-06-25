import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
  EmbedBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type InteractionReplyOptions,
} from "discord.js";

import { listTodayCalendarEvents } from "../../calendar/calendarClient";
import type { CalendarListedEvent, CalendarListResult } from "../../calendar/types";

dayjs.extend(utc);
dayjs.extend(timezone);

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
  if (!result.success) {
    return {
      content: result.message,
      ephemeral: true,
    };
  }

  if (result.events.length === 0) {
    return {
      content: "今日の予定はありません。",
      ephemeral: true,
    };
  }

  return {
    embeds: [
      new EmbedBuilder()
        .setTitle("今日の予定")
        .setDescription(
          result.events
            .map((event) => `* ${formatTodayEventLine(event, result.range.timezone)}`)
            .join("\n"),
        )
        .setColor(0x2f80ed),
    ],
    ephemeral: true,
  };
}

export function formatTodayEventLine(
  event: CalendarListedEvent,
  timezoneName: string,
): string {
  if (event.allDay) {
    return `終日 ${event.title}`;
  }

  const start = dayjs(event.start).tz(timezoneName).format("HH:mm");
  const end = event.end ? dayjs(event.end).tz(timezoneName).format("HH:mm") : null;

  return end ? `${start}-${end} ${event.title}` : `${start} ${event.title}`;
}
