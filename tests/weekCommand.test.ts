import { describe, expect, it } from "vitest";

import type { CalendarListResult } from "../src/calendar/types";
import {
  buildWeekReply,
  formatWeekEventGroups,
} from "../src/discord/commands/week";

type SuccessfulCalendarListResult = Extract<CalendarListResult, { success: true }>;

describe("week command formatting", () => {
  it("groups timed and all-day events by date", () => {
    const result: SuccessfulCalendarListResult = {
      success: true,
      mode: "live",
      message: "今後7日間の予定を3件取得しました。",
      events: [
        {
          id: "work-1",
          title: "バイト",
          htmlLink: null,
          allDay: false,
          start: "2026-06-26T17:00:00+09:00",
          end: "2026-06-26T23:00:00+09:00",
          timezone: "Asia/Tokyo",
        },
        {
          id: "deadline-1",
          title: "物理レポート締切",
          htmlLink: null,
          allDay: false,
          start: "2026-06-27T13:00:00+09:00",
          end: null,
          timezone: "Asia/Tokyo",
        },
        {
          id: "report-1",
          title: "レポート",
          htmlLink: null,
          allDay: true,
          start: "2026-06-27",
          end: "2026-06-28",
          timezone: "Asia/Tokyo",
        },
      ],
      range: {
        timeMin: "2026-06-25T00:00:00+09:00",
        timeMax: "2026-07-02T00:00:00+09:00",
        timezone: "Asia/Tokyo",
      },
    };

    expect(formatWeekEventGroups(result)).toBe(
      [
        "6/26(金)",
        "",
        "* 17:00-23:00 バイト",
        "",
        "6/27(土)",
        "",
        "* 13:00 物理レポート締切",
        "* 終日 レポート",
      ].join("\n"),
    );
  });

  it("builds an empty schedule reply", () => {
    const result: CalendarListResult = {
      success: true,
      mode: "live",
      message: "今後7日間の予定はありません。",
      events: [],
      range: {
        timeMin: "2026-06-25T00:00:00+09:00",
        timeMax: "2026-07-02T00:00:00+09:00",
        timezone: "Asia/Tokyo",
      },
    };

    expect(buildWeekReply(result)).toMatchObject({
      content: "今後7日間の予定はありません。",
      ephemeral: true,
    });
  });
});
