import { describe, expect, it } from "vitest";

import type { CalendarListResult } from "../src/calendar/types";
import {
  buildTodayReply,
  formatTodayEventLine,
} from "../src/discord/commands/today";

describe("today command formatting", () => {
  it("formats timed and all-day events", () => {
    expect(
      formatTodayEventLine(
        {
          id: "work-1",
          title: "バイト",
          htmlLink: null,
          allDay: false,
          start: "2026-06-25T17:00:00+09:00",
          end: "2026-06-25T23:00:00+09:00",
          timezone: "Asia/Tokyo",
        },
        "Asia/Tokyo",
      ),
    ).toBe("17:00-23:00 バイト");

    expect(
      formatTodayEventLine(
        {
          id: "report-1",
          title: "レポート",
          htmlLink: null,
          allDay: true,
          start: "2026-06-25",
          end: "2026-06-26",
          timezone: "Asia/Tokyo",
        },
        "Asia/Tokyo",
      ),
    ).toBe("終日 レポート");
  });

  it("builds an empty schedule reply", () => {
    const result: CalendarListResult = {
      success: true,
      mode: "live",
      message: "今日の予定はありません。",
      events: [],
      range: {
        timeMin: "2026-06-25T00:00:00+09:00",
        timeMax: "2026-06-26T00:00:00+09:00",
        timezone: "Asia/Tokyo",
      },
    };

    expect(buildTodayReply(result)).toMatchObject({
      content: "今日の予定はありません。",
      ephemeral: true,
    });
  });
});
