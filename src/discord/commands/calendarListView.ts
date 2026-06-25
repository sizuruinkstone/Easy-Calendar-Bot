import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { EmbedBuilder, type InteractionReplyOptions } from "discord.js";

import type { CalendarListedEvent, CalendarListResult } from "../../calendar/types";

dayjs.extend(utc);
dayjs.extend(timezone);

export const CALENDAR_LIST_EMBED_COLOR = 0x2f80ed;
const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export type CalendarListViewOptions = {
  title: string;
  emptyMessage: string;
};

export function buildCalendarListReply(
  result: CalendarListResult,
  viewOptions: CalendarListViewOptions,
): InteractionReplyOptions {
  if (!result.success) {
    return {
      content: result.message,
      ephemeral: true,
    };
  }

  if (result.events.length === 0) {
    return {
      content: viewOptions.emptyMessage,
      ephemeral: true,
    };
  }

  return {
    embeds: [
      new EmbedBuilder()
        .setTitle(viewOptions.title)
        .setDescription(
          result.events
            .map((event) => `* ${formatCalendarEventLine(event, result.range.timezone)}`)
            .join("\n"),
        )
        .setColor(CALENDAR_LIST_EMBED_COLOR),
    ],
    ephemeral: true,
  };
}

export function formatCalendarEventLine(
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

export function getCalendarEventDateKey(
  event: CalendarListedEvent,
  timezoneName: string,
): string {
  return getCalendarEventStart(event, timezoneName).format("YYYY-MM-DD");
}

export function formatCalendarDateHeading(
  dateKey: string,
  timezoneName: string,
): string {
  const date = dayjs.tz(dateKey, timezoneName);

  return `${date.format("M/D")}(${WEEKDAY_LABELS[date.day()]})`;
}

function getCalendarEventStart(
  event: CalendarListedEvent,
  timezoneName: string,
): dayjs.Dayjs {
  return event.allDay
    ? dayjs.tz(event.start, timezoneName)
    : dayjs(event.start).tz(timezoneName);
}
