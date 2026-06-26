import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type InteractionReplyOptions,
} from "discord.js";

import {
  listTodayCalendarEvents,
  listTomorrowCalendarEvents,
} from "../../calendar/calendarClient";
import type { CalendarListResult } from "../../calendar/types";
import { buildScheduleNotification } from "../../notification/buildScheduleNotification";

export const NOTIFY_TEST_COMMAND_NAME = "notify-test";

export const notifyTestCommand = new SlashCommandBuilder()
  .setName(NOTIFY_TEST_COMMAND_NAME)
  .setDescription("今日・明日の通知プレビューを表示します");

export async function handleNotifyTestCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const [todayResult, tomorrowResult] = await Promise.all([
    listTodayCalendarEvents(),
    listTomorrowCalendarEvents(),
  ]);

  await interaction.reply(buildNotifyTestReply(todayResult, tomorrowResult));
}

export function buildNotifyTestReply(
  todayResult: CalendarListResult,
  tomorrowResult: CalendarListResult,
): InteractionReplyOptions {
  if (!todayResult.success) {
    return {
      content: todayResult.message,
      ephemeral: true,
    };
  }

  if (!tomorrowResult.success) {
    return {
      content: tomorrowResult.message,
      ephemeral: true,
    };
  }

  return {
    content: buildScheduleNotification(todayResult, tomorrowResult),
    ephemeral: true,
  };
}
