import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { EmbedBuilder, type InteractionReplyOptions } from "discord.js";

import type { CalendarListedEvent, CalendarListResult } from "../../calendar/types";

dayjs.extend(utc);
dayjs.extend(timezone);

const CALENDAR_LIST_EMBED_COLOR = 0x2f80ed;

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
