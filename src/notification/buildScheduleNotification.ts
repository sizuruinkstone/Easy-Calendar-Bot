import type { CalendarListResult } from "../calendar/types";
import { formatCalendarEventLine } from "../discord/commands/calendarListView";

type SuccessfulCalendarListResult = Extract<CalendarListResult, { success: true }>;

export function buildScheduleNotification(
  todayResult: SuccessfulCalendarListResult,
  tomorrowResult: SuccessfulCalendarListResult,
): string {
  if (todayResult.events.length === 0 && tomorrowResult.events.length === 0) {
    return "今日・明日の予定はありません。";
  }

  return [
    formatNotificationSection({
      title: "今日の予定",
      emptyMessage: "今日の予定はありません。",
      result: todayResult,
    }),
    formatNotificationSection({
      title: "明日の予定",
      emptyMessage: "明日の予定はありません。",
      result: tomorrowResult,
    }),
  ].join("\n\n");
}

function formatNotificationSection({
  title,
  emptyMessage,
  result,
}: {
  title: string;
  emptyMessage: string;
  result: SuccessfulCalendarListResult;
}): string {
  const body =
    result.events.length === 0
      ? emptyMessage
      : result.events
          .map((event) => `* ${formatCalendarEventLine(event, result.range.timezone)}`)
          .join("\n");

  return [title, "", body].join("\n");
}
